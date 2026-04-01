import { memo, useMemo } from "react";
import {
  formatCurrencyValue,
  fragmentCurrencyId,
  getTotalCurrencyValue,
  getTotalProductionValuePerSecond,
  getVisibleCurrencies,
} from "@/game/currencies";
import { useGameStore } from "@/store/useGameStore";

export const ResourceBar = memo(function ResourceBar() {
  const currencies = useGameStore((s) => s.currencies);
  const currencyProduction = useGameStore((s) => s.currencyProduction);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);

  const { items, hiddenCount, totalWealthValue, totalProductionValue } = useMemo(() => {
    const visibleCurrencies = getVisibleCurrencies(unlockedCurrencies);
    const wealthCandidates = visibleCurrencies.filter(
      (currency) =>
        currency.id === fragmentCurrencyId ||
        currencies[currency.id] > 0 ||
        currencyProduction[currency.id] > 0,
    );

    const sorted = [...wealthCandidates].sort((a, b) => b.tier - a.tier);
    const top3Ids = new Set(sorted.slice(0, 3).map((c) => c.id));

    const items = wealthCandidates
      .sort((a, b) => a.tier - b.tier)
      .map((currency) => ({
        id: currency.id,
        label: currency.shortLabel,
        icon: currency.icon,
        amount: currencies[currency.id],
        productionRate: currencyProduction[currency.id],
        showRate: top3Ids.has(currency.id),
      }));

    const maxVisible = 7;
    const visibleItems = items.slice(0, maxVisible);
    const hiddenCount = Math.max(0, items.length - maxVisible);

    return {
      items: visibleItems,
      hiddenCount,
      totalWealthValue: getTotalCurrencyValue(currencies),
      totalProductionValue: getTotalProductionValuePerSecond(currencyProduction),
    };
  }, [currencies, currencyProduction, unlockedCurrencies]);

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border-subtle bg-[rgba(8,11,16,0.88)]">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-overlay border border-[rgba(255,255,255,0.07)]">
        <span className="text-[0.6rem] font-extrabold tracking-[0.08em] uppercase text-[#8090a6]">Stash</span>
        <span className="text-[0.7rem] font-extrabold text-[#f2ead8]">{formatCurrencyValue(totalWealthValue)}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-overlay border border-[rgba(255,255,255,0.07)]">
        <span className="text-[0.6rem] font-extrabold tracking-[0.08em] uppercase text-[#8090a6]">Rate</span>
        <span className="text-[0.7rem] font-extrabold text-[#f2ead8]">{formatCurrencyValue(totalProductionValue)}/s</span>
      </div>
      <div className="flex flex-1 min-w-0 flex-wrap gap-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="inline-flex items-center gap-1.5 min-w-0 px-2 py-1 rounded-full bg-[rgba(255,255,255,0.035)] border border-border-subtle"
            title={`${item.label}: ${formatCurrencyValue(item.amount)}${item.productionRate > 0 ? ` (${formatCurrencyValue(item.productionRate)}/s)` : ""}`}
          >
            <img className="w-4 h-4 rounded-full object-cover shrink-0" src={item.icon} alt="" />
            <span className="text-[0.65rem] font-bold text-[#d9e1ef]">{item.label}</span>
            <span className="text-[0.65rem] text-[#93a0b4] tabular-nums">
              {formatCurrencyValue(item.amount)}
              {item.showRate && item.productionRate > 0 ? ` · ${formatCurrencyValue(item.productionRate)}/s` : ""}
            </span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <span className="self-center text-[0.65rem] text-[#93a0b4]">+{hiddenCount} more</span>
        )}
      </div>
    </div>
  );
});
