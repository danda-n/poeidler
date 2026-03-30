import type { StateCreator } from "zustand";
import type { GameStore } from "@/store/gameStore";
import { createInitialGameState } from "@/game/gameEngine";
import { clearSavedGame } from "@/game/saveSystem";

export type SystemActions = {
  resetSave: () => void;
};

export const createSystemSlice: StateCreator<GameStore, [], [], { actions: SystemActions }> = (set) => ({
  actions: {
    resetSave: () => {
      clearSavedGame();
      set(createInitialGameState());
    },
  },
});
