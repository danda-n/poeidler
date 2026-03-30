import type { StateCreator } from "zustand";
import type { GameStore } from "@/store/gameStore";
import { getRunStartMapBonuses } from "@/game/gameEngine";
import { getTotalCurrencyValue } from "@/game/currencies";
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
import { getMapCostReduction } from "@/game/talents";
import { augmentDeviceEffectsForUpgrades, getMapCostReductionUpgradeBonus } from "@/game/upgradeEngine";

export type MapActions = {
  craftMap: (craftedMap: CraftedMap, action: CraftingAction) => CraftedMap | null;
  startMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => void;
  queueMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => void;
  cancelQueue: () => void;
};

export const createMapSlice: StateCreator<GameStore, [], [], { actions: MapActions }> = (set, get) => ({
  actions: {
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
  },
});
