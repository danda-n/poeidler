import { currencyMap, formatCurrencyValue, scrambleName, type CurrencyDefinition, type CurrencyProduction } from "@/game/currencies";

type MysteryRowProps = {
  currency: CurrencyDefinition;
  currencyProduction: CurrencyProduction;
};

export function MysteryRow({ currency, currencyProduction }: MysteryRowProps) {
  const requirement = currency.unlockRequirement;

  if (!requirement) {
    return null;
  }

  const currentRate = currencyProduction[requirement.currencyId];
  const targetRate = requirement.productionPerSecond;
  const progress = Math.min(100, (currentRate / targetRate) * 100);
  const requirementCurrency = currencyMap[requirement.currencyId];

  return (
    <div className="mystery-row">
      <img className="mystery-icon" src={currency.icon} alt="" aria-hidden="true" />
      <div className="mystery-info">
        <span className="mystery-name">{scrambleName(currency.label)}</span>
        <span className="mystery-hint">
          Reach {formatCurrencyValue(targetRate)} {requirementCurrency.shortLabel}/sec
        </span>
      </div>
      <div className="mystery-progress">
        <div className="mystery-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
