import { ManualConversionRow } from "@/components/ManualConversionRow";
import type { CurrencyId, CurrencyState, UnlockedCurrencyState } from "@/game/currencies";

type ConversionStripProps = {
  currenciesState: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  onConvertCurrency: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => void;
};

export function ConversionStrip({ currenciesState, unlockedCurrencies, onConvertCurrency }: ConversionStripProps) {
  return (
    <div className="shrink-0 overflow-x-auto">
      <ManualConversionRow
        currenciesState={currenciesState}
        unlockedCurrencies={unlockedCurrencies}
        onConvertCurrency={onConvertCurrency}
      />
    </div>
  );
}
