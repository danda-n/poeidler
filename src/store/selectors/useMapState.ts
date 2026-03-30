import { useGameStore } from "@/store/useGameStore";

export function useMapState() {
  return useGameStore((s) => ({
    activeMap: s.activeMap,
    queuedMap: s.queuedMap,
    lastMapResult: s.lastMapResult,
    mapNotification: s.mapNotification,
  }));
}
