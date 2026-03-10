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

export const upgradeCategories = ["currency", "qualityOfLife"] as const;

export type UpgradeCategory = (typeof upgradeCategories)[number];
export type FeatureId = "buyMax";
export type UpgradeCost = Partial<Record<CurrencyId, number>>;

export type UpgradeEffect =
  | { type: "percentProduction"; currency: CurrencyId; value: number }
  | { type: "unlockFeature"; feature: FeatureId }
  | { type: "percentClickPower"; value: number };

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
  { id: "augmentationEfficiency", category: "currency", name: "Augmentation Refinement", description: "+10% Augmentation production", baseCost: { augmentationOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "augmentationOrb", value: 0.1 } },
  { id: "alterationEfficiency", category: "currency", name: "Alteration Mastery", description: "+10% Alteration production", baseCost: { alterationOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "alterationOrb", value: 0.1 } },
  { id: "jewellerEfficiency", category: "currency", name: "Jeweller Precision", description: "+10% Jeweller production", baseCost: { jewellersOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "jewellersOrb", value: 0.1 } },
  { id: "fusingEfficiency", category: "currency", name: "Fusing Synergy", description: "+10% Fusing production", baseCost: { fusingOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "fusingOrb", value: 0.1 } },
  { id: "alchemyEfficiency", category: "currency", name: "Alchemy Potency", description: "+10% Alchemy production", baseCost: { alchemyOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "alchemyOrb", value: 0.1 } },
  { id: "chaosAmplification", category: "currency", name: "Chaos Amplification", description: "+10% Chaos production", baseCost: { chaosOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "chaosOrb", value: 0.1 } },
  { id: "regalEfficiency", category: "currency", name: "Regal Authority", description: "+10% Regal production", baseCost: { regalOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "regalOrb", value: 0.1 } },
  { id: "exaltedEfficiency", category: "currency", name: "Exalted Brilliance", description: "+10% Exalted production", baseCost: { exaltedOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "exaltedOrb", value: 0.1 } },
  { id: "divineEfficiency", category: "currency", name: "Divine Resonance", description: "+10% Divine production", baseCost: { divineOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "divineOrb", value: 0.1 } },
  { id: "buyMax", category: "qualityOfLife", name: "Buy Max", description: "Buy the maximum affordable generators at once", baseCost: { alterationOrb: 1 }, maxLevel: 1, effect: { type: "unlockFeature", feature: "buyMax" } },
  { id: "clickPower", category: "currency", name: "Click Power", description: "+25% click power", baseCost: { fragmentOfWisdom: 25 }, costMultiplier: 1.3, effect: { type: "percentClickPower", value: 0.25 } },
];

export type UpgradeId = (typeof upgrades)[number]["id"];
export type PurchasedUpgradeState = Record<UpgradeId, number>;
export type FeatureState = Record<FeatureId, boolean>;

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
  buyMax: false,
};

export const productionUpgradeByCurrency: Partial<Record<CurrencyId, UpgradeDefinition>> =
  upgrades.reduce((accumulator, upgrade) => {
    if (upgrade.effect.type === "percentProduction") {
      accumulator[upgrade.effect.currency] = upgrade;
    }
    return accumulator;
  }, {} as Partial<Record<CurrencyId, UpgradeDefinition>>);

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

export function applyUpgradeEffects(purchasedUpgrades: PurchasedUpgradeState, breakpointBonus = 0) {
  const currencyMultipliers = { ...initialCurrencyMultipliers };
  const unlockedFeatures = { ...initialUnlockedFeatures };
  let clickMultiplier = 1;

  upgrades.forEach((upgrade) => {
    const level = purchasedUpgrades[upgrade.id as UpgradeId];

    if (level <= 0) {
      return;
    }

    if (upgrade.effect.type === "percentProduction") {
      const additiveMultiplier = 1 + upgrade.effect.value * level;
      const baseBreakpoint = getUpgradeBreakpointMultiplier(level);
      const breakpointMultiplier = baseBreakpoint * (1 + breakpointBonus * Math.floor(level / 25));
      currencyMultipliers[upgrade.effect.currency] *= additiveMultiplier * breakpointMultiplier;
      return;
    }

    if (upgrade.effect.type === "percentClickPower") {
      clickMultiplier *= 1 + upgrade.effect.value * level;
      return;
    }

    unlockedFeatures[upgrade.effect.feature] = true;
  });

  return { currencyMultipliers, unlockedFeatures, clickMultiplier };
}

export function getClickPower(fragmentProductionRate: number, clickMultiplier: number) {
  const baseClick = 1 + fragmentProductionRate * 0.3;
  return Math.max(1, Math.floor(baseClick * clickMultiplier));
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

export function getUpgradeCategoryLabel(category: UpgradeCategory) {
  switch (category) {
    case "currency":
      return "Currency Upgrades";
    case "qualityOfLife":
      return "Quality of Life";
    default:
      return category;
  }
}
