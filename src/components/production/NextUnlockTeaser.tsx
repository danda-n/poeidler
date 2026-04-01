import { memo } from "react";
import { currencyMap, formatCurrencyValue, scrambleName, type CurrencyDefinition, type CurrencyProduction } from "@/game/currencies";

type NextUnlockTeaserProps = {
  nextLocked: CurrencyDefinition[];
  currencyProduction: CurrencyProduction;
};

export const NextUnlockTeaser = memo(function NextUnlockTeaser({ nextLocked, currencyProduction }: NextUnlockTeaserProps) {
  if (nextLocked.length === 0) return null;

  return (
    <div className="shrink-0 grid gap-1">
      {nextLocked.map((currency) => {
        const requirement = currency.unlockRequirement;
        if (!requirement) return null;

        const currentRate = currencyProduction[requirement.currencyId];
        const targetRate = requirement.productionPerSecond;
        const progress = Math.min(100, (currentRate / targetRate) * 100);
        const requirementCurrency = currencyMap[requirement.currencyId];

        return (
          <div key={currency.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[rgba(255,211,106,0.04)] border border-[rgba(255,211,106,0.10)]">
            <img className="w-4 h-4 rounded-md brightness-[0.4] blur-[1.5px] grayscale-[0.6] shrink-0" src={currency.icon} alt="" />
            <span className="text-[0.72rem] font-mono text-[#a0a0a0] truncate">{scrambleName(currency.label)}</span>
            <span className="ml-auto text-[0.62rem] text-accent-gold-bright font-semibold shrink-0 tabular-nums">
              {formatCurrencyValue(targetRate)} {requirementCurrency.shortLabel}/s
            </span>
            <div className="w-16 h-1 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden shrink-0">
              <div className="h-full rounded-[inherit] bg-[rgba(255,211,106,0.7)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
});
