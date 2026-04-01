import { memo, useMemo } from "react";
import {
  formatCurrencyValue,
  fragmentCurrencyId,
  getVisibleCurrencies,
} from "@/game/currencies";
import { useGameStore } from "@/store/useGameStore";

export const ResourceBar = memo(function ResourceBar() {
  const currencies = useGameStore((s) => s.currencies);
  const currencyProduction = useGameStore((s) => s.currencyProduction);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);

  const items = useMemo(() => {
    const visibleCurrencies = getVisibleCurrencies(unlockedCurrencies);
    const candidates = visibleCurrencies.filter(
      (currency) =>
        currency.id === fragmentCurrencyId ||
        currencies[currency.id] > 0 ||
        currencyProduction[currency.id] > 0,
    );

    // Show max 5, prioritize highest tier
    const sorted = [...candidates].sort((a, b) => b.tier - a.tier);
    const topIds = new Set(sorted.slice(0, 5).map((c) => c.id));

    return candidates
      .filter((c) => topIds.has(c.id))
      .sort((a, b) => a.tier - b.tier)
      .map((currency) => ({
        id: currency.id,
        icon: currency.icon,
        label: currency.shortLabel,
        amount: currencies[currency.id],
        productionRate: currencyProduction[currency.id],
      }));
  }, [currencies, currencyProduction, unlockedCurrencies]);

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 border-b border-border-subtle bg-[rgba(8,11,16,0.88)]">
      {items.map((item) => (
        <div
          key={item.id}
          className="inline-flex items-center gap-1 min-w-0 px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-border-subtle"
          title={`${item.label}: ${formatCurrencyValue(item.amount)}${item.productionRate > 0 ? ` (+${formatCurrencyValue(item.productionRate)}/s)` : ""}`}
        >
          <img className="w-3.5 h-3.5 rounded-full object-cover shrink-0" src={item.icon} alt="" />
          <span className="text-[0.6rem] text-[#93a0b4] tabular-nums">
            {formatCurrencyValue(item.amount)}
          </span>
        </div>
      ))}
    </div>
  );
});
