import { useEffect, useRef, useState } from "react";
import { convertCurrency } from "../game/conversionEngine";
import { fragmentCurrencyId, type CurrencyId } from "../game/currencies";
import { generatorMap, getMaxAffordableGeneratorPurchases, type GeneratorId } from "../game/generators";
import { createInitialGameState, getRunStartMapBonuses, startGameEngine, synchronizeGameState, type GameState } from "../game/gameEngine";
import { AUTOSAVE_INTERVAL_MS, clearSavedGame, loadGameState, saveGameState } from "../game/saveSystem";
import {
  augmentDeviceEffectsForUpgrades,
  getClickPower,
  getConversionOutputUpgradeBonus,
  purchaseGenerator,
  purchaseUpgrade,
  type UpgradeId,
} from "../game/upgradeEngine";
import {
  baseMapMap,
  startMap,
  isMapUnlocked,
  canAffordCraft,
  payCraftCost,
  applyCraftingAction,
  getMapIncomeSnapshot,
  type CraftedMap,
  type CraftingAction,
  type QueuedMapSetup,
} from "../game/maps";
import { resolveLoadoutEffects, payLoadoutCost, type DeviceLoadout } from "../game/mapDevice";
import { performPrestige, canPrestige } from "../game/prestige";
import { purchaseTalent as purchaseTalentFn, getConversionBonus, getGeneratorCostReduction, getMapCostReduction } from "../game/talents";
import { getGeneratorCost } from "../game/generators";

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => startGameEngine(setGameState), []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setGameState((currentState) => {
        const saveTimestamp = saveGameState(currentState);
        return {
          ...currentState,
          lastSaveTime: saveTimestamp,
        };
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameState(gameStateRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function generateFragment() {
    setGameState((currentState) => {
      const power = getClickPower(currentState.currencyProduction[fragmentCurrencyId], currentState.clickMultiplier);
      return {
        ...currentState,
        currencies: {
          ...currentState.currencies,
          [fragmentCurrencyId]: currentState.currencies[fragmentCurrencyId] + power,
        },
      };
    });
  }

  function manualConvert(fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) {
    setGameState((currentState) => {
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
  }

  function buyUpgrade(upgradeId: UpgradeId) {
    setGameState((currentState) => synchronizeGameState(purchaseUpgrade(currentState, upgradeId)));
  }

  function buyGenerator(generatorId: GeneratorId) {
    setGameState((currentState) => {
      const generator = generatorMap[generatorId];
      const costReduction = getGeneratorCostReduction(currentState.talentsPurchased);

      if (currentState.unlockedFeatures.buyMax) {
        let quantity = 0;
        let runningCost = 0;
        const available = Math.floor(currentState.currencies[generator.costCurrency]);
        const owned = currentState.generatorsOwned[generatorId];

        while (true) {
          const rawCost = getGeneratorCost(generatorId, owned + quantity, 1);
          const reducedCost = Math.ceil(rawCost * Math.max(0, 1 - costReduction));
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
        const reducedCost = Math.ceil(rawCost * Math.max(0, 1 - costReduction));

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
  }

  function craftMap(craftedMap: CraftedMap, action: CraftingAction): CraftedMap | null {
    const currentState = gameStateRef.current;
    if (!canAffordCraft(currentState.currencies, action)) return null;

    const newMap = applyCraftingAction(craftedMap, action);
    if (!newMap) return null;

    setGameState((s) => ({ ...s, currencies: payCraftCost(s.currencies, action) }));
    return newMap;
  }

  function startMapAction(baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) {
    setGameState((currentState) => {
      const mapDef = baseMapMap[baseMapId];
      if (!mapDef) return currentState;
      if (currentState.activeMap) return currentState;
      if (!isMapUnlocked(mapDef, currentState.currencies)) return currentState;

      const costReduction = getMapCostReduction(currentState.talentsPurchased);
      const { rewardBonus, shardChanceBonus, speedBonus, encounterChain } = getRunStartMapBonuses(
        craftedMap,
        currentState.prestige,
        currentState.talentsPurchased,
        currentState.purchasedUpgrades,
      );
      const deviceEffects = augmentDeviceEffectsForUpgrades(
        resolveLoadoutEffects(deviceLoadout),
        currentState.purchasedUpgrades,
        false,
      );
      const incomePerSecond = getMapIncomeSnapshot(currentState.currencyProduction);

      const currencies = payLoadoutCost(currentState.currencies, deviceLoadout);
      const result = startMap(
        currencies,
        mapDef,
        craftedMap,
        costReduction,
        speedBonus,
        deviceEffects,
        incomePerSecond,
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
  }

  function queueMapAction(baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) {
    setGameState((currentState) => {
      const mapDef = baseMapMap[baseMapId];
      if (!mapDef) return currentState;
      if (!currentState.activeMap) return currentState;
      if (!isMapUnlocked(mapDef, currentState.currencies)) return currentState;

      const setup: QueuedMapSetup = { baseMapId, craftedMap, deviceLoadout };
      return { ...currentState, queuedMap: setup };
    });
  }

  function cancelQueueAction() {
    setGameState((currentState) => ({ ...currentState, queuedMap: null }));
  }

  function prestigeAction() {
    setGameState((currentState) => {
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
  }

  function purchaseTalent(talentId: string) {
    setGameState((currentState) => {
      const result = purchaseTalentFn(
        talentId,
        currentState.talentsPurchased,
        currentState.prestige.mirrorShards,
      );
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
  }

  function resetSave() {
    clearSavedGame();
    setGameState(createInitialGameState());
  }

  return {
    gameState,
    actions: {
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
    },
  };
}
