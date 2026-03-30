import { useGameStore } from "@/store/useGameStore";

export function useCurrencyState() {
  return useGameStore((s) => ({
    currencies: s.currencies,
    currencyProduction: s.currencyProduction,
    clickMultiplier: s.clickMultiplier,
    unlockedCurrencies: s.unlockedCurrencies,
  }));
}
