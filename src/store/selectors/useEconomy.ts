import { useGameStore } from "@/store/useGameStore";

export function useEconomy() {
  return useGameStore((s) => ({
    generatorsOwned: s.generatorsOwned,
    purchasedUpgrades: s.purchasedUpgrades,
    unlockedFeatures: s.unlockedFeatures,
  }));
}
