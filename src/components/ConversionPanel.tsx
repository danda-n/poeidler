import { currencyMap, getVisibleAdjacentConversions, getSpendableAmount, type CurrencyId, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import type { ConversionReserve } from "../game/upgradeEngine";

type ConversionPanelProps = {
  currenciesState: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  conversionReserve: ConversionReserve;
  onConvertCurrency: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => void;
};

function ConversionPanel({ currenciesState, unlockedCurrencies, conversionReserve, onConvertCurrency }: ConversionPanelProps) {
  const visibleConversions = getVisibleAdjacentConversions(unlockedCurrencies);
  const reserveEntries = Object.entries(conversionReserve).filter(([, amount]) => amount > 0);
  const reserveLabel = reserveEntries.length > 0
    ? `Reserve: ${reserveEntries.map(([cid, amount]) => `${amount} ${currencyMap[cid as CurrencyId].shortLabel}`).join(", ")}`
    : undefined;

  return (
    <div className="conversion-list">
      {visibleConversions.map((conversion) => (
        <button
          key={`${conversion.fromCurrencyId}-${conversion.toCurrencyId}`}
          className="conversion-button"
          type="button"
          title={reserveLabel}
          onClick={() => onConvertCurrency(conversion.fromCurrencyId, conversion.toCurrencyId)}
          disabled={getSpendableAmount(currenciesState, conversion.fromCurrencyId) < conversion.ratio}
        >
          {conversion.ratio} {currencyMap[conversion.fromCurrencyId].shortLabel} &rarr; 1 {currencyMap[conversion.toCurrencyId].shortLabel}
        </button>
      ))}
    </div>
  );
}

export default ConversionPanel;
