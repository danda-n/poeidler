import {
  getConversionRatio,
  getSpendableAmount,
  type CurrencyId,
  type CurrencyState,
} from "./currencies";

export function convertCurrency(
  currenciesState: CurrencyState,
  fromCurrencyId: CurrencyId,
  toCurrencyId: CurrencyId,
  amount = 1,
) {
  const ratio = getConversionRatio(fromCurrencyId, toCurrencyId);

  if (!ratio) {
    return currenciesState;
  }

  const requiredAmount = ratio * amount;
  const availableAmount = getSpendableAmount(currenciesState, fromCurrencyId);

  if (availableAmount < requiredAmount) {
    return currenciesState;
  }

  return {
    ...currenciesState,
    [fromCurrencyId]: currenciesState[fromCurrencyId] - requiredAmount,
    [toCurrencyId]: currenciesState[toCurrencyId] + amount,
  };
}
