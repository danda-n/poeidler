import { formatCurrencyValue, fragmentCurrencyId, type CurrencyProduction, type CurrencyState } from "../game/currencies";
import { getClickPower } from "../game/upgradeEngine";

type ClickPanelProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  clickMultiplier: number;
  onGenerateFragment: () => void;
};

function ClickPanel({ currenciesState, currencyProduction, clickMultiplier, onGenerateFragment }: ClickPanelProps) {
  const clickPower = getClickPower(currencyProduction[fragmentCurrencyId], clickMultiplier);
  const fragmentCount = currenciesState[fragmentCurrencyId];
  const passiveRate = currencyProduction[fragmentCurrencyId];

  return (
    <div className="click-area">
      <div className="fragment-display">
        <span className="fragment-count">{formatCurrencyValue(fragmentCount)}</span>
        <span className="fragment-label">
          Fragments of Wisdom{passiveRate > 0 ? ` (+${formatCurrencyValue(passiveRate)}/sec)` : ""}
        </span>
      </div>
      <button className="click-button" type="button" onClick={onGenerateFragment}>
        +{formatCurrencyValue(clickPower)} Fragment
      </button>
      <span className="click-meta">Click power: {formatCurrencyValue(clickPower)}</span>
    </div>
  );
}

export default ClickPanel;
