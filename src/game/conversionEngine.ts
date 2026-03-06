import {
  getVisibleAdjacentConversions,
  getConversionRatio,
  getSpendableAmount,
  type CurrencyId,
  type CurrencyState,
  type UnlockedCurrencyState,
} from "./currencies";
import type { GeneratorOwnedState } from "./generators";
import { getConversionReserve, type FeatureState, type PurchasedUpgradeState } from "./upgradeEngine";

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

function getSafeConvertibleUnits(
  currenciesState: CurrencyState,
  fromCurrencyId: CurrencyId,
  ratio: number,
  reserve: number,
) {
  const availableAmount = getSpendableAmount(currenciesState, fromCurrencyId);
  const safeAvailableAmount = Math.max(0, availableAmount - reserve);
  return Math.floor(safeAvailableAmount / ratio);
}

export function autoConvertCurrencies(
  currenciesState: CurrencyState,
  purchasedUpgrades: PurchasedUpgradeState,
  generatorsOwned: GeneratorOwnedState,
  unlockedFeatures: FeatureState,
  unlockedCurrencies: UnlockedCurrencyState,
) {
  if (!unlockedFeatures.autoConversion) {
    return currenciesState;
  }

  const conversionReserve = getConversionReserve(purchasedUpgrades, generatorsOwned);
  const visibleConversions = getVisibleAdjacentConversions(unlockedCurrencies);
  const conversionsToApply = unlockedFeatures.chainConversion ? visibleConversions : visibleConversions.slice(0, 1);
  let nextCurrencies = { ...currenciesState };

  conversionsToApply.forEach((conversion) => {
    const maxConvertible = getSafeConvertibleUnits(
      nextCurrencies,
      conversion.fromCurrencyId,
      conversion.ratio,
      conversionReserve[conversion.fromCurrencyId],
    );

    if (maxConvertible <= 0) {
      return;
    }

    nextCurrencies = convertCurrency(
      nextCurrencies,
      conversion.fromCurrencyId,
      conversion.toCurrencyId,
      unlockedFeatures.bulkConversion ? maxConvertible : 1,
    );
  });

  return nextCurrencies;
}
