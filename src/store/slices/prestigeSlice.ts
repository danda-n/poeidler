import type { StateCreator } from "zustand";
import type { GameStore } from "@/store/gameStore";
import { synchronizeGameState } from "@/game/gameEngine";
import { canPrestige, performPrestige } from "@/game/prestige";
import { purchaseTalent as purchaseTalentFn } from "@/game/talents";

export type PrestigeActions = {
  prestige: () => void;
  purchaseTalent: (talentId: string) => void;
};

export const createPrestigeSlice: StateCreator<GameStore, [], [], { actions: PrestigeActions }> = (set) => ({
  actions: {
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
  },
});
