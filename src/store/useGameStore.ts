import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";
import { gameStore, type GameStore } from "./gameStore";

export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useStore(gameStore, useShallow(selector));
}
