import { currencyMap, getVisibleAdjacentConversions, getSpendableAmount, type CurrencyId, type CurrencyState, type UnlockedCurrencyState } from "@/game/currencies";

type ManualConversionRowProps = {
  currenciesState: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  onConvertCurrency: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => void;
};

export function ManualConversionRow({ currenciesState, unlockedCurrencies, onConvertCurrency }: ManualConversionRowProps) {
  const visibleConversions = getVisibleAdjacentConversions(unlockedCurrencies);

  if (visibleConversions.length === 0) {
    return null;
  }

  return (
    <div className="conversion-row">
      {visibleConversions.map((conversion) => (
        <button
          key={`${conversion.fromCurrencyId}-${conversion.toCurrencyId}`}
          className="btn btn-sm conversion-btn"
          type="button"
          onClick={() => onConvertCurrency(conversion.fromCurrencyId, conversion.toCurrencyId)}
          disabled={getSpendableAmount(currenciesState, conversion.fromCurrencyId) < conversion.ratio}
        >
          {conversion.ratio} {currencyMap[conversion.fromCurrencyId].shortLabel} &rarr; 1 {currencyMap[conversion.toCurrencyId].shortLabel}
        </button>
      ))}
    </div>
  );
}
