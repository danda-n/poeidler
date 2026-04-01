import { memo } from "react";
import { formatCurrencyValue, fragmentCurrencyId, type CurrencyProduction, type CurrencyState } from "@/game/currencies";
import { getClickPower } from "@/game/upgradeEngine";

type ClickRowProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  clickMultiplier: number;
  onGenerateFragment: () => void;
};

export const ClickRow = memo(function ClickRow({
  currenciesState,
  currencyProduction,
  clickMultiplier,
  onGenerateFragment,
}: ClickRowProps) {
  const clickPower = getClickPower(currencyProduction[fragmentCurrencyId], clickMultiplier);
  const fragmentCount = currenciesState[fragmentCurrencyId];
  const passiveRate = currencyProduction[fragmentCurrencyId];

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 border-l-accent-gold bg-[rgba(244,213,140,0.04)]">
      <span className="text-[0.74rem] font-semibold text-accent-gold w-[7rem]">Fragment</span>

      <span className="text-[0.78rem] font-bold text-accent-gold tabular-nums w-[4.5rem] text-right">
        {formatCurrencyValue(fragmentCount)}
      </span>

      {passiveRate > 0 && (
        <span className="text-[0.62rem] text-text-secondary tabular-nums w-[4rem] text-right">
          +{formatCurrencyValue(passiveRate)}/s
        </span>
      )}

      <button
        className="ml-auto px-4 py-1 border-none rounded-md text-[0.7rem] font-bold text-bg-surface bg-gradient-to-r from-gradient-gold-start to-gradient-gold-end cursor-pointer transition-all duration-100 hover:translate-y-[-1px] hover:shadow-[0_2px_10px_rgba(229,164,36,0.25)] active:translate-y-[1px] active:shadow-none"
        type="button"
        onClick={onGenerateFragment}
      >
        +{formatCurrencyValue(clickPower)}
      </button>
    </div>
  );
});
