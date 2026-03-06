import fragmentIcon from "../assets/icons/fragment.png";
import transmutationIcon from "../assets/icons/transmutation.png";
import augmentationIcon from "../assets/icons/augmentation.png";
import alterationIcon from "../assets/icons/alteration.png";
import jewellerIcon from "../assets/icons/jeweller.png";
import fusingIcon from "../assets/icons/fusing.png";
import alchemyIcon from "../assets/icons/alchemy.png";
import chaosIcon from "../assets/icons/chaos.png";
import regalIcon from "../assets/icons/regal.png";
import exaltedIcon from "../assets/icons/exalted.png";

export type CurrencyId =
  | "fragmentOfWisdom"
  | "transmutationOrb"
  | "augmentationOrb"
  | "alterationOrb"
  | "jewellersOrb"
  | "fusingOrb"
  | "alchemyOrb"
  | "chaosOrb"
  | "regalOrb"
  | "exaltedOrb";

export type UnlockRequirement = {
  currencyId: CurrencyId;
  productionPerSecond: number;
};

export type CurrencyDefinition = {
  id: CurrencyId;
  label: string;
  shortLabel: string;
  tier: number;
  baseValue: number;
  icon: string;
  unlockRequirement?: UnlockRequirement;
};

export type CurrencyState = Record<CurrencyId, number>;
export type CurrencyProduction = Record<CurrencyId, number>;
export type CurrencyMultipliers = Record<CurrencyId, number>;
export type UnlockedCurrencyState = Record<CurrencyId, boolean>;

export const currencies: CurrencyDefinition[] = [
  { id: "fragmentOfWisdom", label: "Fragment of Wisdom", shortLabel: "Fragment", tier: 1, baseValue: 1, icon: fragmentIcon },
  { id: "transmutationOrb", label: "Transmutation Orb", shortLabel: "Transmutation", tier: 2, baseValue: 8, icon: transmutationIcon, unlockRequirement: { currencyId: "fragmentOfWisdom", productionPerSecond: 10 } },
  { id: "augmentationOrb", label: "Augmentation Orb", shortLabel: "Augmentation", tier: 3, baseValue: 16, icon: augmentationIcon, unlockRequirement: { currencyId: "transmutationOrb", productionPerSecond: 2 } },
  { id: "alterationOrb", label: "Alteration Orb", shortLabel: "Alteration", tier: 4, baseValue: 32, icon: alterationIcon, unlockRequirement: { currencyId: "augmentationOrb", productionPerSecond: 1.5 } },
  { id: "jewellersOrb", label: "Jeweller's Orb", shortLabel: "Jeweller", tier: 5, baseValue: 64, icon: jewellerIcon, unlockRequirement: { currencyId: "alterationOrb", productionPerSecond: 1 } },
  { id: "fusingOrb", label: "Fusing Orb", shortLabel: "Fusing", tier: 6, baseValue: 96, icon: fusingIcon, unlockRequirement: { currencyId: "jewellersOrb", productionPerSecond: 0.75 } },
  { id: "alchemyOrb", label: "Alchemy Orb", shortLabel: "Alchemy", tier: 7, baseValue: 128, icon: alchemyIcon, unlockRequirement: { currencyId: "fusingOrb", productionPerSecond: 0.5 } },
  { id: "chaosOrb", label: "Chaos Orb", shortLabel: "Chaos", tier: 8, baseValue: 256, icon: chaosIcon, unlockRequirement: { currencyId: "alchemyOrb", productionPerSecond: 0.35 } },
  { id: "regalOrb", label: "Regal Orb", shortLabel: "Regal", tier: 9, baseValue: 512, icon: regalIcon, unlockRequirement: { currencyId: "chaosOrb", productionPerSecond: 0.2 } },
  { id: "exaltedOrb", label: "Exalted Orb", shortLabel: "Exalted", tier: 10, baseValue: 1024, icon: exaltedIcon, unlockRequirement: { currencyId: "regalOrb", productionPerSecond: 0.1 } }
];

export const currencyIds = currencies.map((currency) => currency.id) as CurrencyId[];
export const fragmentCurrencyId: CurrencyId = "fragmentOfWisdom";

export const currencyMap: Record<CurrencyId, CurrencyDefinition> = currencies.reduce((accumulator, currency) => {
  accumulator[currency.id] = currency;
  return accumulator;
}, {} as Record<CurrencyId, CurrencyDefinition>);

export const initialCurrencies: CurrencyState = currencyIds.reduce((accumulator, currencyId) => {
  accumulator[currencyId] = 0;
  return accumulator;
}, {} as CurrencyState);

export const initialCurrencyProduction: CurrencyProduction = currencyIds.reduce((accumulator, currencyId) => {
  accumulator[currencyId] = 0;
  return accumulator;
}, {} as CurrencyProduction);

export const initialCurrencyMultipliers: CurrencyMultipliers = currencyIds.reduce((accumulator, currencyId) => {
  accumulator[currencyId] = 1;
  return accumulator;
}, {} as CurrencyMultipliers);

export const initialUnlockedCurrencies: UnlockedCurrencyState = currencyIds.reduce((accumulator, currencyId) => {
  accumulator[currencyId] = currencyId === fragmentCurrencyId;
  return accumulator;
}, {} as UnlockedCurrencyState);

export const orderedCurrencies = [...currencies].sort((left, right) => left.tier - right.tier);

export function getVisibleCurrencies(unlockedCurrencies: UnlockedCurrencyState) {
  return orderedCurrencies.filter((currency) => unlockedCurrencies[currency.id]);
}

export function unlockCurrencies(unlockedCurrencies: UnlockedCurrencyState, currencyProduction: CurrencyProduction) {
  const nextUnlockedCurrencies = { ...unlockedCurrencies };

  orderedCurrencies.forEach((currency) => {
    if (!currency.unlockRequirement) {
      nextUnlockedCurrencies[currency.id] = true;
      return;
    }

    if (currencyProduction[currency.unlockRequirement.currencyId] >= currency.unlockRequirement.productionPerSecond) {
      nextUnlockedCurrencies[currency.id] = true;
    }
  });

  return nextUnlockedCurrencies;
}

export function getNextCurrencyUnlock(unlockedCurrencies: UnlockedCurrencyState) {
  return orderedCurrencies.find((currency) => !unlockedCurrencies[currency.id] && currency.unlockRequirement);
}

export function getVisibleAdjacentConversions(unlockedCurrencies: UnlockedCurrencyState) {
  const visibleCurrencies = getVisibleCurrencies(unlockedCurrencies);
  return visibleCurrencies.slice(0, -1).map((currency, index) => ({
    fromCurrencyId: currency.id,
    toCurrencyId: visibleCurrencies[index + 1].id,
    ratio: visibleCurrencies[index + 1].baseValue / currency.baseValue,
  }));
}

export function formatCurrencyValue(value: number) {
  const rounded = Math.round(value * 10) / 10;
  const isWholeNumber = Math.abs(rounded - Math.round(rounded)) < 0.001;
  return isWholeNumber ? String(Math.round(rounded)) : rounded.toFixed(1);
}

export function getSpendableAmount(currenciesState: CurrencyState, currencyId: CurrencyId) {
  return Math.floor(currenciesState[currencyId]);
}

export function getConversionRatio(fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) {
  const fromCurrency = currencyMap[fromCurrencyId];
  const toCurrency = currencyMap[toCurrencyId];

  if (toCurrency.baseValue <= fromCurrency.baseValue) {
    return null;
  }

  const ratio = toCurrency.baseValue / fromCurrency.baseValue;
  return Number.isInteger(ratio) ? ratio : null;
}
