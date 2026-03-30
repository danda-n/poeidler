import { useGameStore } from "@/store/useGameStore";
import type { GameActions } from "@/store/gameStore";

export function useActions(): GameActions {
  return useGameStore((s) => s.actions);
}
