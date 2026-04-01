import type { StateCreator } from "zustand";
import type { GameStore } from "@/store/gameStore";

export type QuestActions = {
  dismissQuestNotification: () => void;
};

export const createQuestSlice: StateCreator<GameStore, [], [], { actions: QuestActions }> = (set) => ({
  actions: {
    dismissQuestNotification: () => {
      set((state) => ({
        questState: { ...state.questState, questNotification: null, fragmentNotification: null },
      }));
    },
  },
});
