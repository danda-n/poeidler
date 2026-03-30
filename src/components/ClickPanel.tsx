import { formatCurrencyValue, fragmentCurrencyId, type CurrencyProduction, type CurrencyState } from "@/game/currencies";
import { getClickPower } from "@/game/upgradeEngine";
import { InfoIcon } from "@/components/InfoIcon";

type ClickPanelProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  clickMultiplier: number;
  onGenerateFragment: () => void;
};

export function ClickPanel({ currenciesState, currencyProduction, clickMultiplier, onGenerateFragment }: ClickPanelProps) {
  const clickPower = getClickPower(currencyProduction[fragmentCurrencyId], clickMultiplier);
  const fragmentCount = currenciesState[fragmentCurrencyId];
  const passiveRate = currencyProduction[fragmentCurrencyId];

  const tooltip = `Click power: ${formatCurrencyValue(clickPower)}\nBase: 1 + production x 0.3\nMultiplier: x${formatCurrencyValue(clickMultiplier)}`;

  return (
    <div className="flex-1 min-h-[100px] flex flex-col items-center justify-center gap-3 p-5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold text-accent-gold leading-none">{formatCurrencyValue(fragmentCount)}</span>
        <span className="text-[0.8rem] text-[#999]">
          Fragments of Wisdom{passiveRate > 0 ? ` (+${formatCurrencyValue(passiveRate)}/sec)` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-full max-w-[280px] px-5 py-3 border-none rounded-[10px] text-[0.95rem] font-bold text-bg-surface bg-gradient-to-b from-gradient-gold-start to-gradient-gold-end cursor-pointer transition-all duration-100 hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(229,164,36,0.3)] active:translate-y-[1px] active:shadow-none" type="button" onClick={onGenerateFragment}>
          +{formatCurrencyValue(clickPower)} Fragment
        </button>
        <InfoIcon tooltip={tooltip} />
      </div>
    </div>
  );
}
