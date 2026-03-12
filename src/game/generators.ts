export const GENERATOR_MILESTONES = [10, 25, 50, 100] as const;

export const generators = [
  { id: "fragmentFarmer", currency: "fragmentOfWisdom", label: "Fragment Farmer", tier: 1, baseRate: 1, baseCost: 10, costMultiplier: 1.15, costCurrency: "fragmentOfWisdom" },
  { id: "transmutationPress", currency: "transmutationOrb", label: "Transmutation Press", tier: 2, baseRate: 0.2, baseCost: 120, costMultiplier: 1.17, costCurrency: "fragmentOfWisdom" },
  { id: "augmentationMill", currency: "augmentationOrb", label: "Augmentation Mill", tier: 3, baseRate: 0.12, baseCost: 320, costMultiplier: 1.18, costCurrency: "fragmentOfWisdom" },
  { id: "alterationWorkshop", currency: "alterationOrb", label: "Alteration Workshop", tier: 4, baseRate: 0.08, baseCost: 25, costMultiplier: 1.19, costCurrency: "transmutationOrb" },
  { id: "jewellerBench", currency: "jewellersOrb", label: "Jeweller's Bench", tier: 5, baseRate: 0.06, baseCost: 20, costMultiplier: 1.2, costCurrency: "augmentationOrb" },
  { id: "fusingApparatus", currency: "fusingOrb", label: "Fusing Apparatus", tier: 6, baseRate: 0.05, baseCost: 15, costMultiplier: 1.21, costCurrency: "alterationOrb" },
  { id: "alchemyLab", currency: "alchemyOrb", label: "Alchemy Lab", tier: 7, baseRate: 0.06, baseCost: 12, costMultiplier: 1.22, costCurrency: "jewellersOrb" },
  { id: "chaosHarvester", currency: "chaosOrb", label: "Chaos Harvester", tier: 8, baseRate: 0.05, baseCost: 10, costMultiplier: 1.23, costCurrency: "fusingOrb" },
  { id: "regalRefinery", currency: "regalOrb", label: "Regal Refinery", tier: 9, baseRate: 0.04, baseCost: 8, costMultiplier: 1.24, costCurrency: "alchemyOrb" },
  { id: "exaltedForge", currency: "exaltedOrb", label: "Exalted Forge", tier: 10, baseRate: 0.03, baseCost: 6, costMultiplier: 1.25, costCurrency: "chaosOrb" },
  { id: "divineAnchor", currency: "divineOrb", label: "Divine Anchor", tier: 11, baseRate: 0.02, baseCost: 5, costMultiplier: 1.26, costCurrency: "regalOrb" },
] as const;

export type GeneratorDefinition = (typeof generators)[number];
export type GeneratorId = GeneratorDefinition["id"];
export type GeneratorOwnedState = Record<GeneratorId, number>;

export const generatorIds = generators.map((generator) => generator.id) as GeneratorId[];

export const generatorMap: Record<GeneratorId, GeneratorDefinition> = generators.reduce((accumulator, generator) => {
  accumulator[generator.id] = generator;
  return accumulator;
}, {} as Record<GeneratorId, GeneratorDefinition>);

export const generatorByCurrency: Partial<Record<string, GeneratorDefinition>> = generators.reduce((accumulator, generator) => {
  accumulator[generator.currency] = generator;
  return accumulator;
}, {} as Record<string, GeneratorDefinition>);

export const initialGeneratorsOwned: GeneratorOwnedState = generatorIds.reduce((accumulator, generatorId) => {
  accumulator[generatorId] = 0;
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

export function getGeneratorMilestoneBonus(owned: number) {
  let bonus = 0;

  if (owned >= 10) bonus += 0.12;
  if (owned >= 25) bonus += 0.18;
  if (owned >= 50) bonus += 0.3;
  if (owned >= 100) bonus += 0.45;

  return bonus;
}

export function getNextGeneratorMilestone(owned: number) {
  return GENERATOR_MILESTONES.find((milestone) => milestone > owned) ?? null;
}

export function getGeneratorOutputMultiplier(generator: GeneratorDefinition, owned: number) {
  if (owned <= 0) return 1;

  const depthBonus = Math.log10(owned + 1) * (0.08 + generator.tier * 0.006);
  const milestoneBonus = getGeneratorMilestoneBonus(owned);

  return 1 + depthBonus + milestoneBonus;
}
