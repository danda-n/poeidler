import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertCurrency } from "@/game/conversionEngine";
import { fragmentCurrencyId, getTotalCurrencyValue, type CurrencyId } from "@/game/currencies";
import { createInitialGameState, getRunStartMapBonuses, startGameEngine, synchronizeGameState, type GameState } from "@/game/gameEngine";
import { generatorMap, getGeneratorCost, getMaxAffordableGeneratorPurchases, type GeneratorId } from "@/game/generators";
import { payLoadoutCost, resolveLoadoutEffects, type DeviceLoadout } from "@/game/mapDevice";
import {
  applyCraftingAction,
  baseMapMap,
  canAffordCraft,
  getMapIncomeSnapshot,
  isMapUnlocked,
  payCraftCost,
  startMap,
  type CraftedMap,
  type CraftingAction,
  type QueuedMapSetup,
} from "@/game/maps";
import { canPrestige, performPrestige } from "@/game/prestige";
import { AUTOSAVE_INTERVAL_MS, clearSavedGame, loadGameState, saveGameState } from "@/game/saveSystem";
import { getConversionBonus, getGeneratorCostReduction, getMapCostReduction, purchaseTalent as purchaseTalentFn } from "@/game/talents";
import {
  augmentDeviceEffectsForUpgrades,
  getClickPower,
  getConversionOutputUpgradeBonus,
  getGeneratorCostReductionUpgradeBonus,
  getMapCostReductionUpgradeBonus,
  purchaseGenerator,
  purchaseUpgrade,
  type UpgradeId,
} from "@/game/upgradeEngine";

const DISPLAY_SYNC_INTERVAL_MS = 200;

type GameStateUpdater = (currentState: GameState) => GameState;

type SyncMode = "immediate" | "deferred";

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const gameStateRef = useRef(gameState);
  const lastPublishedAtRef = useRef(Date.now());

  const publishDeferredGameState = useCallback((nextState: GameState) => {
    gameStateRef.current = nextState;
    lastPublishedAtRef.current = Date.now();
    startTransition(() => {
      setGameState(nextState);
    });
  }, []);

  const publishGameState = useCallback((nextState: GameState) => {
    gameStateRef.current = nextState;
    setGameState(nextState);
    lastPublishedAtRef.current = Date.now();
  }, []);

  const updateGameState = useCallback((updater: GameStateUpdater, syncMode: SyncMode = "immediate") => {
    const currentState = gameStateRef.current;
    const nextState = updater(currentState);
    if (nextState === currentState) {
      return currentState;
    }

    gameStateRef.current = nextState;

    if (syncMode === "immediate") {
      setGameState(nextState);
      lastPublishedAtRef.current = Date.now();
    }

    return nextState;
  }, []);

  useEffect(
    () =>
      startGameEngine((updater) => {
        const nextState = updater(gameStateRef.current);
        if (nextState === gameStateRef.current) {
          return;
        }

        gameStateRef.current = nextState;
        const now = Date.now();
        if (now - lastPublishedAtRef.current >= DISPLAY_SYNC_INTERVAL_MS) {
          publishDeferredGameState(nextState);
        }
      }),
    [publishDeferredGameState],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const saveTimestamp = saveGameState(gameStateRef.current);
      if (gameStateRef.current.lastSaveTime === saveTimestamp) {
        return;
      }

      const nextState = {
        ...gameStateRef.current,
        lastSaveTime: saveTimestamp,
      };
      publishGameState(nextState);
    }, AUTOSAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [publishGameState]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameState(gameStateRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const generateFragment = useCallback(() => {
    updateGameState((currentState) => {
      const power = getClickPower(currentState.currencyProduction[fragmentCurrencyId], currentState.clickMultiplier);
      return {
        ...currentState,
        currencies: {
          ...currentState.currencies,
          [fragmentCurrencyId]: currentState.currencies[fragmentCurrencyId] + power,
        },
      };
    });
  }, [updateGameState]);

  const manualConvert = useCallback((fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => {
    updateGameState((currentState) => {
      const talentBonus = getConversionBonus(currentState.talentsPurchased);
      const upgradeBonus = getConversionOutputUpgradeBonus(currentState.purchasedUpgrades);
      const converted = convertCurrency(currentState.currencies, fromCurrencyId, toCurrencyId);
      const totalBonus = talentBonus + upgradeBonus;

      if (totalBonus > 0 && converted !== currentState.currencies) {
        return {
          ...currentState,
          currencies: {
            ...converted,
            [toCurrencyId]: converted[toCurrencyId] + totalBonus,
          },
        };
      }

      return {
        ...currentState,
        currencies: converted,
      };
    });
  }, [updateGameState]);

  const buyUpgrade = useCallback((upgradeId: UpgradeId) => {
    updateGameState((currentState) => synchronizeGameState(purchaseUpgrade(currentState, upgradeId)));
  }, [updateGameState]);

  const buyGenerator = useCallback((generatorId: GeneratorId) => {
    updateGameState((currentState) => {
      const generator = generatorMap[generatorId];
      const costReduction = getGeneratorCostReduction(currentState.talentsPurchased) + getGeneratorCostReductionUpgradeBonus(currentState.purchasedUpgrades);

      if (currentState.unlockedFeatures.buyMax) {
        let quantity = 0;
        let runningCost = 0;
        const available = Math.floor(currentState.currencies[generator.costCurrency]);
        const owned = currentState.generatorsOwned[generatorId];

        while (true) {
          const rawCost = getGeneratorCost(generatorId, owned + quantity, 1);
          const reducedCost = Math.ceil(rawCost * Math.max(0.2, 1 - costReduction));
          if (runningCost + reducedCost > available) break;
          runningCost += reducedCost;
          quantity += 1;
        }

        if (quantity <= 0) return currentState;

        return synchronizeGameState({
          ...currentState,
          currencies: {
            ...currentState.currencies,
            [generator.costCurrency]: currentState.currencies[generator.costCurrency] - runningCost,
          },
          generatorsOwned: {
            ...currentState.generatorsOwned,
            [generatorId]: currentState.generatorsOwned[generatorId] + quantity,
          },
        });
      }

      if (costReduction > 0) {
        const owned = currentState.generatorsOwned[generatorId];
        const rawCost = getGeneratorCost(generatorId, owned, 1);
        const reducedCost = Math.ceil(rawCost * Math.max(0.2, 1 - costReduction));

        if (Math.floor(currentState.currencies[generator.costCurrency]) < reducedCost) {
          return currentState;
        }

        return synchronizeGameState({
          ...currentState,
          currencies: {
            ...currentState.currencies,
            [generator.costCurrency]: currentState.currencies[generator.costCurrency] - reducedCost,
          },
          generatorsOwned: {
            ...currentState.generatorsOwned,
            [generatorId]: owned + 1,
          },
        });
      }

      const availableCurrency = Math.floor(currentState.currencies[generator.costCurrency]);
      const quantity = currentState.unlockedFeatures.buyMax
        ? getMaxAffordableGeneratorPurchases(generatorId, currentState.generatorsOwned[generatorId], availableCurrency)
        : 1;

      return synchronizeGameState(purchaseGenerator(currentState, generatorId, quantity));
    });
  }, [updateGameState]);

  const craftMap = useCallback((craftedMap: CraftedMap, action: CraftingAction): CraftedMap | null => {
    const currentState = gameStateRef.current;
    if (!canAffordCraft(currentState.currencies, action)) return null;

    const newMap = applyCraftingAction(craftedMap, action);
    if (!newMap) return null;

    updateGameState((state) => ({ ...state, currencies: payCraftCost(state.currencies, action) }));
    return newMap;
  }, [updateGameState]);

  const startMapAction = useCallback((baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => {
    updateGameState((currentState) => {
      const mapDef = baseMapMap[baseMapId];
      if (!mapDef) return currentState;
      if (currentState.activeMap) return currentState;
      if (!isMapUnlocked(mapDef, currentState.currencies)) return currentState;

      const costReduction = getMapCostReduction(currentState.talentsPurchased) + getMapCostReductionUpgradeBonus(currentState.purchasedUpgrades);
      const { rewardBonus, shardChanceBonus, speedBonus, encounterChain } = getRunStartMapBonuses(
        craftedMap,
        currentState.prestige,
        currentState.talentsPurchased,
        currentState.purchasedUpgrades,
      );
      const deviceEffects = augmentDeviceEffectsForUpgrades(resolveLoadoutEffects(deviceLoadout), currentState.purchasedUpgrades, false);
      const currenciesAfterLoadout = payLoadoutCost(currentState.currencies, deviceLoadout);
      const incomePerSecond = getMapIncomeSnapshot(currentState.currencyProduction);
      const wealthValue = getTotalCurrencyValue(currenciesAfterLoadout);

      const result = startMap(
        currenciesAfterLoadout,
        mapDef,
        craftedMap,
        costReduction,
        speedBonus,
        deviceEffects,
        incomePerSecond,
        wealthValue,
        rewardBonus,
        shardChanceBonus,
        encounterChain,
      );
      if (!result) return currentState;

      return {
        ...currentState,
        currencies: result.currencies,
        activeMap: result.activeMap,
        lastMapResult: null,
        queuedMap: null,
      };
    });
  }, [updateGameState]);

  const queueMapAction = useCallback((baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => {
    updateGameState((currentState) => {
      const mapDef = baseMapMap[baseMapId];
      if (!mapDef) return currentState;
      if (!currentState.activeMap) return currentState;
      if (!isMapUnlocked(mapDef, currentState.currencies)) return currentState;

      const setup: QueuedMapSetup = { baseMapId, craftedMap, deviceLoadout };
      return { ...currentState, queuedMap: setup };
    });
  }, [updateGameState]);

  const cancelQueueAction = useCallback(() => {
    updateGameState((currentState) => ({ ...currentState, queuedMap: null }));
  }, [updateGameState]);

  const prestigeAction = useCallback(() => {
    updateGameState((currentState) => {
      if (!canPrestige(currentState.currencies)) return currentState;

      const result = performPrestige(
        currentState.currencies,
        currentState.unlockedCurrencies,
        currentState.prestige,
        currentState.talentsPurchased,
        currentState.purchasedUpgrades,
        currentState.mapDevice,
      );
      if (!result) return currentState;

      return synchronizeGameState({
        ...currentState,
        currencies: result.currencies,
        generatorsOwned: result.generatorsOwned,
        purchasedUpgrades: result.purchasedUpgrades,
        unlockedCurrencies: result.unlockedCurrencies,
        activeMap: result.activeMap,
        prestige: result.prestige,
        mapDevice: result.mapDevice,
        queuedMap: null,
        mapNotification: null,
      });
    });
  }, [updateGameState]);

  const purchaseTalent = useCallback((talentId: string) => {
    updateGameState((currentState) => {
      const result = purchaseTalentFn(talentId, currentState.talentsPurchased, currentState.prestige.mirrorShards);
      if (!result) return currentState;

      return synchronizeGameState({
        ...currentState,
        talentsPurchased: result.purchased,
        prestige: {
          ...currentState.prestige,
          mirrorShards: result.mirrorShards,
        },
      });
    });
  }, [updateGameState]);

  const resetSave = useCallback(() => {
    clearSavedGame();
    publishGameState(createInitialGameState());
  }, [publishGameState]);

  const actions = useMemo(
    () => ({
      generateFragment,
      manualConvert,
      buyUpgrade,
      buyGenerator,
      craftMap,
      startMap: startMapAction,
      queueMap: queueMapAction,
      cancelQueue: cancelQueueAction,
      prestige: prestigeAction,
      purchaseTalent,
      resetSave,
    }),
    [
      buyGenerator,
      buyUpgrade,
      cancelQueueAction,
      craftMap,
      generateFragment,
      manualConvert,
      prestigeAction,
      purchaseTalent,
      queueMapAction,
      resetSave,
      startMapAction,
    ],
  );

  return {
    gameState,
    actions,
  };
}

