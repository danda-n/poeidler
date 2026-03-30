import { useStore } from "zustand";
import { gameStore, type GameStore } from "./gameStore";

export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useStore(gameStore, selector);
}
