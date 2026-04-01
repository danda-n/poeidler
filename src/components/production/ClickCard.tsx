import { memo } from "react";
import { formatCurrencyValue, fragmentCurrencyId, type CurrencyProduction, type CurrencyState } from "@/game/currencies";
import { getClickPower } from "@/game/upgradeEngine";

type ClickCardProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  clickMultiplier: number;
  hasGenerators: boolean;
  onGenerateFragment: () => void;
};

export const ClickCard = memo(function ClickCard({
  currenciesState,
  currencyProduction,
  clickMultiplier,
  hasGenerators,
  onGenerateFragment,
}: ClickCardProps) {
  const clickPower = getClickPower(currencyProduction[fragmentCurrencyId], clickMultiplier);
  const fragmentCount = currenciesState[fragmentCurrencyId];
  const passiveRate = currencyProduction[fragmentCurrencyId];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-b from-[rgba(244,213,140,0.08)] to-[rgba(255,255,255,0.03)] border border-[rgba(244,213,140,0.18)] ${
        hasGenerators ? "" : "col-span-2"
      }`}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-lg font-extrabold text-accent-gold tabular-nums">{formatCurrencyValue(fragmentCount)}</span>
        {passiveRate > 0 && (
          <span className="text-[0.65rem] text-text-secondary tabular-nums">+{formatCurrencyValue(passiveRate)}/s</span>
        )}
      </div>
      <button
        className="w-full max-w-[200px] px-4 py-2 border-none rounded-lg text-[0.82rem] font-bold text-bg-surface bg-gradient-to-b from-gradient-gold-start to-gradient-gold-end cursor-pointer transition-all duration-100 hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(229,164,36,0.3)] active:translate-y-[1px] active:shadow-none"
        type="button"
        onClick={onGenerateFragment}
      >
        +{formatCurrencyValue(clickPower)} Fragment
      </button>
    </div>
  );
});
