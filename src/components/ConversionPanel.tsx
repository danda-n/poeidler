import { currencyMap, getVisibleAdjacentConversions, getSpendableAmount, type CurrencyId, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import type { ConversionReserve } from "../game/upgradeEngine";

type ConversionPanelProps = {
  currenciesState: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  conversionReserve: ConversionReserve;
  onConvertCurrency: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => void;
};

function ConversionPanel({ currenciesState, unlockedCurrencies, conversionReserve, onConvertCurrency }: ConversionPanelProps) {
  const reserveEntries = Object.entries(conversionReserve).filter(([, amount]) => amount > 0);
  const visibleConversions = getVisibleAdjacentConversions(unlockedCurrencies);

  return (
    <div className="conversion-list compact-list">
      <p className="conversion-note">
        Conversion stays compact and only shows currently unlocked tier steps.
      </p>
      {reserveEntries.length > 0 ? (
        <p className="conversion-reserve">
          Reserve: {reserveEntries.map(([currencyId, amount]) => `${amount} ${currencyMap[currencyId as CurrencyId].shortLabel}`).join(", ")}
        </p>
      ) : null}
      {visibleConversions.map((conversion) => (
        <button
          key={`${conversion.fromCurrencyId}-${conversion.toCurrencyId}`}
          className="conversion-button compact-button"
          type="button"
          onClick={() => onConvertCurrency(conversion.fromCurrencyId, conversion.toCurrencyId)}
          disabled={getSpendableAmount(currenciesState, conversion.fromCurrencyId) < conversion.ratio}
        >
          {conversion.ratio} {currencyMap[conversion.fromCurrencyId].shortLabel} to 1 {currencyMap[conversion.toCurrencyId].shortLabel}
        </button>
      ))}
    </div>
  );
}

export default ConversionPanel;
