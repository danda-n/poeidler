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
    <div className="flex flex-wrap gap-1 px-1">
      {visibleConversions.map((conversion) => (
        <button
          key={`${conversion.fromCurrencyId}-${conversion.toCurrencyId}`}
          className="px-2 py-1 border border-[rgba(255,211,106,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-gold bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(255,211,106,0.1)] hover:not-disabled:border-[rgba(255,211,106,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
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
