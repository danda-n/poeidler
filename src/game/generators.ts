import { currencyIds, type CurrencyId } from "./currencies";

export const generators = [
  { id: "fragmentFarmer", currency: "fragmentOfWisdom", label: "Fragment Farmer", baseRate: 1, owned: 0, baseCost: 10, costMultiplier: 1.15, costCurrency: "fragmentOfWisdom" },
  { id: "transmutationPress", currency: "transmutationOrb", label: "Transmutation Press", baseRate: 0.2, owned: 0, baseCost: 120, costMultiplier: 1.17, costCurrency: "fragmentOfWisdom" },
  { id: "augmentationMill", currency: "augmentationOrb", label: "Augmentation Mill", baseRate: 0.12, owned: 0, baseCost: 320, costMultiplier: 1.18, costCurrency: "fragmentOfWisdom" },
  { id: "chaosHarvester", currency: "chaosOrb", label: "Chaos Harvester", baseRate: 0.04, owned: 0, baseCost: 1800, costMultiplier: 1.22, costCurrency: "fragmentOfWisdom" },
  { id: "exaltedForge", currency: "exaltedOrb", label: "Exalted Forge", baseRate: 0.01, owned: 0, baseCost: 9600, costMultiplier: 1.25, costCurrency: "fragmentOfWisdom" }
] as const;

export type GeneratorDefinition = (typeof generators)[number];
export type GeneratorId = GeneratorDefinition["id"];
export type GeneratorOwnedState = Record<GeneratorId, number>;

export const generatorIds = generators.map((generator) => generator.id) as GeneratorId[];

export const generatorMap: Record<GeneratorId, GeneratorDefinition> = generators.reduce((accumulator, generator) => {
  accumulator[generator.id] = generator;
  return accumulator;
}, {} as Record<GeneratorId, GeneratorDefinition>);

export const initialGeneratorsOwned: GeneratorOwnedState = generatorIds.reduce((accumulator, generatorId) => {
  accumulator[generatorId] = generatorMap[generatorId].owned;
  return accumulator;
}, {} as GeneratorOwnedState);

export function getGeneratorCost(generatorId: GeneratorId, owned: number, quantity = 1) {
  const generator = generatorMap[generatorId];
  let totalCost = 0;

  for (let purchaseIndex = 0; purchaseIndex < quantity; purchaseIndex += 1) {
    totalCost += Math.ceil(generator.baseCost * generator.costMultiplier ** (owned + purchaseIndex));
  }

  return totalCost;
}

export function getMaxAffordableGeneratorPurchases(generatorId: GeneratorId, owned: number, availableCurrency: number) {
  let quantity = 0;
  let runningCost = 0;

  while (true) {
    const nextCost = getGeneratorCost(generatorId, owned + quantity, 1);

    if (runningCost + nextCost > availableCurrency) {
      return quantity;
    }

    runningCost += nextCost;
    quantity += 1;
  }
}

export function createEmptyCurrencyBreakdown() {
  return currencyIds.reduce((accumulator, currencyId) => {
    accumulator[currencyId] = 0;
    return accumulator;
  }, {} as Record<CurrencyId, number>);
}
