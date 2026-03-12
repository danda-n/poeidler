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
    <div className="click-area">
      <div className="fragment-display">
        <span className="fragment-count">{formatCurrencyValue(fragmentCount)}</span>
        <span className="fragment-label">
          Fragments of Wisdom{passiveRate > 0 ? ` (+${formatCurrencyValue(passiveRate)}/sec)` : ""}
        </span>
      </div>
      <div className="click-row">
        <button className="click-button" type="button" onClick={onGenerateFragment}>
          +{formatCurrencyValue(clickPower)} Fragment
        </button>
        <InfoIcon tooltip={tooltip} />
      </div>
    </div>
  );
}
