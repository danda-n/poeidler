import { memo, useMemo } from "react";
import {
  formatCurrencyValue,
  fragmentCurrencyId,
  getTotalCurrencyValue,
  getTotalProductionValuePerSecond,
  getVisibleCurrencies,
} from "@/game/currencies";
import { useGameStore } from "@/store/useGameStore";

export const TopStatusStrip = memo(function TopStatusStrip() {
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
    const prioritizedHighTier = wealthCandidates
      .filter((currency) => currency.id !== fragmentCurrencyId)
      .sort((left, right) => right.tier - left.tier)
      .slice(0, 4);
    const priorityIds = new Set([fragmentCurrencyId, ...prioritizedHighTier.map((currency) => currency.id)]);
    const items = visibleCurrencies
      .filter((currency) => priorityIds.has(currency.id))
      .sort((left, right) => left.tier - right.tier)
      .map((currency) => ({
        id: currency.id,
        label: currency.shortLabel,
        icon: currency.icon,
        amount: currencies[currency.id],
        productionRate: currencyProduction[currency.id],
      }));

    return {
      items,
      hiddenCount: Math.max(0, wealthCandidates.filter((currency) => currency.id !== fragmentCurrencyId).length - prioritizedHighTier.length),
      totalWealthValue: getTotalCurrencyValue(currencies),
      totalProductionValue: getTotalProductionValuePerSecond(currencyProduction),
    };
  }, [currencies, currencyProduction, unlockedCurrencies]);

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-0" role="status" aria-label="Economy status">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-bg-overlay border border-[rgba(255,255,255,0.07)]">
        <span className="text-[0.62rem] font-extrabold tracking-[0.08em] uppercase text-[#8090a6]">Stash</span>
        <span className="text-[0.72rem] font-extrabold text-[#f2ead8]">{formatCurrencyValue(totalWealthValue)}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-bg-overlay border border-[rgba(255,255,255,0.07)]">
        <span className="text-[0.62rem] font-extrabold tracking-[0.08em] uppercase text-[#8090a6]">Rate</span>
        <span className="text-[0.72rem] font-extrabold text-[#f2ead8]">{formatCurrencyValue(totalProductionValue)}/s</span>
      </div>
      <div className="flex flex-1 min-w-0 flex-wrap gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="inline-flex items-center gap-1.5 min-w-0 px-[9px] py-[5px] rounded-full bg-[rgba(255,255,255,0.035)] border border-border-subtle">
            <img className="w-[18px] h-[18px] rounded-full object-cover shrink-0" src={item.icon} alt="" />
            <span className="text-[0.68rem] font-bold text-[#d9e1ef]">{item.label}</span>
            <span className="text-[0.68rem] text-[#93a0b4]">
              {formatCurrencyValue(item.amount)}
              {item.productionRate > 0 ? ` \u00b7 ${formatCurrencyValue(item.productionRate)}/s` : ""}
            </span>
          </div>
        ))}
        {hiddenCount > 0 && <span className="text-[0.68rem] text-[#93a0b4]">+{hiddenCount} more</span>}
      </div>
    </div>
  );
});
