import { createStore } from "zustand/vanilla";
import { type GameState, createInitialGameState, runGameTick, synchronizeGameState, TICK_RATE_MS } from "@/game/gameEngine";
import { loadGameState, saveGameState, clearSavedGame, AUTOSAVE_INTERVAL_MS } from "@/game/saveSystem";
import { convertCurrency } from "@/game/conversionEngine";
import { fragmentCurrencyId, getTotalCurrencyValue, type CurrencyId } from "@/game/currencies";
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
import { getRunStartMapBonuses } from "@/game/gameEngine";

export type GameActions = {
  generateFragment: () => void;
  manualConvert: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => void;
  buyUpgrade: (upgradeId: UpgradeId) => void;
  buyGenerator: (generatorId: GeneratorId) => void;
  craftMap: (craftedMap: CraftedMap, action: CraftingAction) => CraftedMap | null;
  startMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => void;
  queueMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => void;
  cancelQueue: () => void;
  prestige: () => void;
  purchaseTalent: (talentId: string) => void;
  resetSave: () => void;
};

export type GameStore = GameState & { actions: GameActions };

export const gameStore = createStore<GameStore>()((set, get) => ({
  ...loadGameState(),

  actions: {
    generateFragment: () => {
      set((state) => {
        const power = getClickPower(state.currencyProduction[fragmentCurrencyId], state.clickMultiplier);
        return {
          currencies: {
            ...state.currencies,
            [fragmentCurrencyId]: state.currencies[fragmentCurrencyId] + power,
          },
        };
      });
    },

    manualConvert: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => {
      set((state) => {
        const talentBonus = getConversionBonus(state.talentsPurchased);
        const upgradeBonus = getConversionOutputUpgradeBonus(state.purchasedUpgrades);
        const converted = convertCurrency(state.currencies, fromCurrencyId, toCurrencyId);
        const totalBonus = talentBonus + upgradeBonus;

        if (totalBonus > 0 && converted !== state.currencies) {
          return {
            currencies: {
              ...converted,
              [toCurrencyId]: converted[toCurrencyId] + totalBonus,
            },
          };
        }

        return { currencies: converted };
      });
    },

    buyUpgrade: (upgradeId: UpgradeId) => {
      set((state) => {
        const result = synchronizeGameState(purchaseUpgrade(state, upgradeId));
        return { ...result };
      });
    },

    buyGenerator: (generatorId: GeneratorId) => {
      set((state) => {
        const generator = generatorMap[generatorId];
        const costReduction = getGeneratorCostReduction(state.talentsPurchased) + getGeneratorCostReductionUpgradeBonus(state.purchasedUpgrades);

        if (state.unlockedFeatures.buyMax) {
          let quantity = 0;
          let runningCost = 0;
          const available = Math.floor(state.currencies[generator.costCurrency]);
          const owned = state.generatorsOwned[generatorId];

          while (true) {
            const rawCost = getGeneratorCost(generatorId, owned + quantity, 1);
            const reducedCost = Math.ceil(rawCost * Math.max(0.2, 1 - costReduction));
            if (runningCost + reducedCost > available) break;
            runningCost += reducedCost;
            quantity += 1;
          }

          if (quantity <= 0) return state;

          return synchronizeGameState({
            ...state,
            currencies: {
              ...state.currencies,
              [generator.costCurrency]: state.currencies[generator.costCurrency] - runningCost,
            },
            generatorsOwned: {
              ...state.generatorsOwned,
              [generatorId]: state.generatorsOwned[generatorId] + quantity,
            },
          });
        }

        if (costReduction > 0) {
          const owned = state.generatorsOwned[generatorId];
          const rawCost = getGeneratorCost(generatorId, owned, 1);
          const reducedCost = Math.ceil(rawCost * Math.max(0.2, 1 - costReduction));

          if (Math.floor(state.currencies[generator.costCurrency]) < reducedCost) {
            return state;
          }

          return synchronizeGameState({
            ...state,
            currencies: {
              ...state.currencies,
              [generator.costCurrency]: state.currencies[generator.costCurrency] - reducedCost,
            },
            generatorsOwned: {
              ...state.generatorsOwned,
              [generatorId]: owned + 1,
            },
          });
        }

        const availableCurrency = Math.floor(state.currencies[generator.costCurrency]);
        const quantity = state.unlockedFeatures.buyMax
          ? getMaxAffordableGeneratorPurchases(generatorId, state.generatorsOwned[generatorId], availableCurrency)
          : 1;

        return synchronizeGameState(purchaseGenerator(state, generatorId, quantity));
      });
    },

    craftMap: (craftedMap: CraftedMap, action: CraftingAction): CraftedMap | null => {
      const state = get();
      if (!canAffordCraft(state.currencies, action)) return null;

      const newMap = applyCraftingAction(craftedMap, action);
      if (!newMap) return null;

      set((s) => ({ currencies: payCraftCost(s.currencies, action) }));
      return newMap;
    },

    startMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => {
      set((state) => {
        const mapDef = baseMapMap[baseMapId];
        if (!mapDef) return state;
        if (state.activeMap) return state;
        if (!isMapUnlocked(mapDef, state.currencies)) return state;

        const costReduction = getMapCostReduction(state.talentsPurchased) + getMapCostReductionUpgradeBonus(state.purchasedUpgrades);
        const { rewardBonus, shardChanceBonus, speedBonus, encounterChain } = getRunStartMapBonuses(
          craftedMap,
          state.prestige,
          state.talentsPurchased,
          state.purchasedUpgrades,
        );
        const deviceEffects = augmentDeviceEffectsForUpgrades(resolveLoadoutEffects(deviceLoadout), state.purchasedUpgrades, false);
        const currenciesAfterLoadout = payLoadoutCost(state.currencies, deviceLoadout);
        const incomePerSecond = getMapIncomeSnapshot(state.currencyProduction);
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
        if (!result) return state;

        return {
          currencies: result.currencies,
          activeMap: result.activeMap,
          lastMapResult: null,
          queuedMap: null,
        };
      });
    },

    queueMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => {
      set((state) => {
        const mapDef = baseMapMap[baseMapId];
        if (!mapDef) return state;
        if (!state.activeMap) return state;
        if (!isMapUnlocked(mapDef, state.currencies)) return state;

        const setup: QueuedMapSetup = { baseMapId, craftedMap, deviceLoadout };
        return { queuedMap: setup };
      });
    },

    cancelQueue: () => {
      set({ queuedMap: null });
    },

    prestige: () => {
      set((state) => {
        if (!canPrestige(state.currencies)) return state;

        const result = performPrestige(
          state.currencies,
          state.unlockedCurrencies,
          state.prestige,
          state.talentsPurchased,
          state.purchasedUpgrades,
          state.mapDevice,
        );
        if (!result) return state;

        return synchronizeGameState({
          ...state,
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
    },

    purchaseTalent: (talentId: string) => {
      set((state) => {
        const result = purchaseTalentFn(talentId, state.talentsPurchased, state.prestige.mirrorShards);
        if (!result) return state;

        return synchronizeGameState({
          ...state,
          talentsPurchased: result.purchased,
          prestige: {
            ...state.prestige,
            mirrorShards: result.mirrorShards,
          },
        });
      });
    },

    resetSave: () => {
      clearSavedGame();
      set(createInitialGameState());
    },
  },
}));

let gameLoopCleanup: (() => void) | null = null;
let autosaveCleanup: (() => void) | null = null;

export function startStoreGameLoop() {
  if (gameLoopCleanup) return;

  let lastTickTime = Date.now();

  const intervalId = window.setInterval(() => {
    const now = Date.now();
    const deltaTimeSeconds = (now - lastTickTime) / 1000;
    lastTickTime = now;

    const currentState = gameStore.getState();
    const nextState = runGameTick(currentState, deltaTimeSeconds);
    if (nextState !== currentState) {
      gameStore.setState(nextState);
    }
  }, TICK_RATE_MS);

  gameLoopCleanup = () => window.clearInterval(intervalId);
}

export function startStoreAutosave() {
  if (autosaveCleanup) return;

  const intervalId = window.setInterval(() => {
    const state = gameStore.getState();
    const saveTimestamp = saveGameState(state);
    if (state.lastSaveTime !== saveTimestamp) {
      gameStore.setState({ lastSaveTime: saveTimestamp });
    }
  }, AUTOSAVE_INTERVAL_MS);

  const handleBeforeUnload = () => {
    saveGameState(gameStore.getState());
  };
  window.addEventListener("beforeunload", handleBeforeUnload);

  autosaveCleanup = () => {
    window.clearInterval(intervalId);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}

export function stopStoreGameLoop() {
  gameLoopCleanup?.();
  gameLoopCleanup = null;
  autosaveCleanup?.();
  autosaveCleanup = null;
}
