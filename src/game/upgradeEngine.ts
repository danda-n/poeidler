import {
  currencyIds,
  initialCurrencyMultipliers,
  type CurrencyId,
  type CurrencyMultipliers,
  type CurrencyState,
} from "./currencies";
import {
  generators,
  getGeneratorCost,
  type GeneratorId,
  type GeneratorOwnedState,
} from "./generators";

export const upgradeCategories = ["currency", "automators", "converters", "qualityOfLife"] as const;

export type UpgradeCategory = (typeof upgradeCategories)[number];
export type FeatureId = "autoConversion" | "bulkConversion" | "chainConversion" | "buyMax";
export type UpgradeCost = Partial<Record<CurrencyId, number>>;

export type UpgradeEffect =
  | { type: "percentProduction"; currency: CurrencyId; value: number }
  | { type: "unlockFeature"; feature: FeatureId };

export type UpgradeDefinition = {
  id: string;
  category: UpgradeCategory;
  name: string;
  description: string;
  baseCost: UpgradeCost;
  costMultiplier?: number;
  maxLevel?: number;
  effect: UpgradeEffect;
};

export const upgrades: UpgradeDefinition[] = [
  { id: "fragmentEfficiency", category: "currency", name: "Fragment Efficiency", description: "+10% Fragment production", baseCost: { fragmentOfWisdom: 50 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "fragmentOfWisdom", value: 0.1 } },
  { id: "transmutationEfficiency", category: "currency", name: "Transmutation Tuning", description: "+10% Transmutation production", baseCost: { transmutationOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "transmutationOrb", value: 0.1 } },
  { id: "chaosAmplification", category: "currency", name: "Chaos Amplification", description: "+10% Chaos production", baseCost: { chaosOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "chaosOrb", value: 0.1 } },
  { id: "autoConversion", category: "automators", name: "Efficient Conversion", description: "Unlock automatic conversion between tiers", baseCost: { transmutationOrb: 1 }, maxLevel: 1, effect: { type: "unlockFeature", feature: "autoConversion" } },
  { id: "bulkConversion", category: "automators", name: "Bulk Conversion", description: "Convert the maximum safe amount each tick", baseCost: { transmutationOrb: 2 }, maxLevel: 1, effect: { type: "unlockFeature", feature: "bulkConversion" } },
  { id: "chainConversion", category: "converters", name: "Chain Conversion", description: "Cascade conversions upward through every tier", baseCost: { augmentationOrb: 1 }, maxLevel: 1, effect: { type: "unlockFeature", feature: "chainConversion" } },
  { id: "buyMax", category: "qualityOfLife", name: "Buy Max", description: "Buy the maximum affordable generators at once", baseCost: { alterationOrb: 1 }, maxLevel: 1, effect: { type: "unlockFeature", feature: "buyMax" } }
];

export type UpgradeId = (typeof upgrades)[number]["id"];
export type PurchasedUpgradeState = Record<UpgradeId, number>;
export type FeatureState = Record<FeatureId, boolean>;
export type ConversionReserve = Record<CurrencyId, number>;

export type UpgradeEngineState = {
  currencies: CurrencyState;
  generatorsOwned: GeneratorOwnedState;
  purchasedUpgrades: PurchasedUpgradeState;
  currencyMultipliers: CurrencyMultipliers;
  unlockedFeatures: FeatureState;
};

export const upgradeMap: Record<UpgradeId, UpgradeDefinition> = upgrades.reduce((accumulator, upgrade) => {
  accumulator[upgrade.id as UpgradeId] = upgrade;
  return accumulator;
}, {} as Record<UpgradeId, UpgradeDefinition>);

export const initialPurchasedUpgrades: PurchasedUpgradeState = upgrades.reduce((accumulator, upgrade) => {
  accumulator[upgrade.id as UpgradeId] = 0;
  return accumulator;
}, {} as PurchasedUpgradeState);

export const initialUnlockedFeatures: FeatureState = {
  autoConversion: false,
  bulkConversion: false,
  chainConversion: false,
  buyMax: false,
};

function scaleCost(baseCost: number, costMultiplier: number | undefined, level: number) {
  if (!costMultiplier) {
    return Math.ceil(baseCost);
  }

  return Math.ceil(baseCost * costMultiplier ** level);
}

export function getUpgradeCost(upgradeId: UpgradeId, level: number) {
  const upgrade = upgradeMap[upgradeId];
  return Object.entries(upgrade.baseCost).reduce((accumulator, [currencyId, amount]) => {
    accumulator[currencyId as CurrencyId] = scaleCost(amount ?? 0, upgrade.costMultiplier, level);
    return accumulator;
  }, {} as UpgradeCost);
}

export function canAffordCost(currenciesState: CurrencyState, cost: UpgradeCost) {
  return Object.entries(cost).every(([currencyId, amount]) => Math.floor(currenciesState[currencyId as CurrencyId]) >= (amount ?? 0));
}

export function getUpgradeBreakpointMultiplier(level: number) {
  return 2 ** Math.floor(level / 25);
}

export function applyUpgradeEffects(purchasedUpgrades: PurchasedUpgradeState) {
  const currencyMultipliers = { ...initialCurrencyMultipliers };
  const unlockedFeatures = { ...initialUnlockedFeatures };

  upgrades.forEach((upgrade) => {
    const level = purchasedUpgrades[upgrade.id as UpgradeId];

    if (level <= 0) {
      return;
    }

    if (upgrade.effect.type === "percentProduction") {
      const additiveMultiplier = 1 + upgrade.effect.value * level;
      const breakpointMultiplier = getUpgradeBreakpointMultiplier(level);
      currencyMultipliers[upgrade.effect.currency] *= additiveMultiplier * breakpointMultiplier;
      return;
    }

    unlockedFeatures[upgrade.effect.feature] = true;
  });

  return { currencyMultipliers, unlockedFeatures };
}

function payCost(currenciesState: CurrencyState, cost: UpgradeCost) {
  const nextCurrencies = { ...currenciesState };

  Object.entries(cost).forEach(([currencyId, amount]) => {
    nextCurrencies[currencyId as CurrencyId] -= amount ?? 0;
  });

  return nextCurrencies;
}

export function purchaseUpgrade<T extends UpgradeEngineState>(gameState: T, upgradeId: UpgradeId) {
  const upgrade = upgradeMap[upgradeId];
  const currentLevel = gameState.purchasedUpgrades[upgradeId];

  if (upgrade.maxLevel !== undefined && currentLevel >= upgrade.maxLevel) {
    return gameState;
  }

  const cost = getUpgradeCost(upgradeId, currentLevel);

  if (!canAffordCost(gameState.currencies, cost)) {
    return gameState;
  }

  return {
    ...gameState,
    currencies: payCost(gameState.currencies, cost),
    purchasedUpgrades: {
      ...gameState.purchasedUpgrades,
      [upgradeId]: currentLevel + 1,
    },
  };
}

export function purchaseGenerator<T extends UpgradeEngineState>(gameState: T, generatorId: GeneratorId, quantity: number) {
  if (quantity <= 0) {
    return gameState;
  }

  const generator = generators.find((entry) => entry.id === generatorId);

  if (!generator) {
    return gameState;
  }

  const owned = gameState.generatorsOwned[generatorId];
  const cost = getGeneratorCost(generatorId, owned, quantity);

  if (Math.floor(gameState.currencies[generator.costCurrency]) < cost) {
    return gameState;
  }

  return {
    ...gameState,
    currencies: {
      ...gameState.currencies,
      [generator.costCurrency]: gameState.currencies[generator.costCurrency] - cost,
    },
    generatorsOwned: {
      ...gameState.generatorsOwned,
      [generatorId]: owned + quantity,
    },
  };
}

export function getConversionReserve(purchasedUpgrades: PurchasedUpgradeState, generatorsOwned: GeneratorOwnedState) {
  const reserve = currencyIds.reduce((accumulator, currencyId) => {
    accumulator[currencyId] = 0;
    return accumulator;
  }, {} as ConversionReserve);

  upgrades.forEach((upgrade) => {
    const currentLevel = purchasedUpgrades[upgrade.id as UpgradeId];

    if (upgrade.maxLevel !== undefined && currentLevel >= upgrade.maxLevel) {
      return;
    }

    const nextCost = getUpgradeCost(upgrade.id as UpgradeId, currentLevel);

    Object.entries(nextCost).forEach(([currencyId, amount]) => {
      const typedCurrencyId = currencyId as CurrencyId;
      reserve[typedCurrencyId] = Math.max(reserve[typedCurrencyId], amount ?? 0);
    });
  });

  generators.forEach((generator) => {
    const nextCost = getGeneratorCost(generator.id, generatorsOwned[generator.id], 1);
    reserve[generator.costCurrency] = Math.max(reserve[generator.costCurrency], nextCost);
  });

  return reserve;
}

export function getUpgradeCategoryLabel(category: UpgradeCategory) {
  switch (category) {
    case "currency":
      return "Currency Upgrades";
    case "automators":
      return "Automators";
    case "converters":
      return "Converters";
    case "qualityOfLife":
      return "Quality of Life";
    default:
      return category;
  }
}
