import { useGameStore } from "@/store/useGameStore";

export function usePrestigeState() {
  return useGameStore((s) => ({
    prestige: s.prestige,
    talentsPurchased: s.talentsPurchased,
  }));
}
