import { useGameStore } from "@/store/useGameStore";

export function useSettings() {
  return useGameStore((s) => ({
    version: s.settings.version,
    lastSaveTime: s.lastSaveTime,
  }));
}
