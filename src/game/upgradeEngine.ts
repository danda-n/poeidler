import { currencyMap, initialCurrencyMultipliers, type CurrencyId, type CurrencyMultipliers, type CurrencyState, type UnlockedCurrencyState } from "./currencies";
import { generators, getGeneratorCost, type GeneratorId, type GeneratorOwnedState } from "./generators";
import type { MapEncounterTag } from "./maps";
import type { ResolvedDeviceEffects } from "./mapDevice";

export const upgradeCategories = ["generators", "economy", "maps", "automation", "atlas", "relics"] as const;

export type UpgradeCategory = (typeof upgradeCategories)[number];
export type UpgradeGroup =
  | "Foundations"
  | "Crafting Lines"
  | "High Currency"
  | "Direct Power"
  | "Trading"
  | "Reward Engines"
  | "Queue Control"
  | "Atlas Memory"
  | "Relic Echoes";
export type FeatureId = "buyMax";
export type UpgradeCost = Partial<Record<CurrencyId, number>>;

type PrestigeSnapshot = {
  prestigeCount: number;
  totalMirrorShards: number;
  mapsCompleted: number;
};

export type UpgradeRequirement =
  | { type: "unlockedCurrency"; currencyId: CurrencyId }
  | { type: "mapsCompleted"; amount: number }
  | { type: "prestigeCount"; amount: number }
  | { type: "totalMirrorShards"; amount: number }
  | { type: "upgradeLevel"; upgradeId: string; amount: number };

export type UpgradeEffect =
  | { type: "percentProduction"; currency: CurrencyId; value: number }
  | { type: "unlockFeature"; feature: FeatureId }
  | { type: "percentClickPower"; value: number }
  | { type: "flatConversionOutput"; value: number }
  | { type: "percentMapReward"; value: number }
  | { type: "percentFocusedMapReward"; value: number }
  | { type: "percentMapRewardPerTier"; value: number }
  | { type: "percentQueuedMapReward"; value: number }
  | { type: "flatMapShardChance"; value: number }
  | { type: "flatQueuedMapShardChance"; value: number }
  | { type: "percentMapStreakReward"; value: number }
  | { type: "percentPrestigeShards"; value: number }
  | { type: "percentMapRewardFromShards"; value: number; shardStep: number; maxSteps?: number }
  | { type: "flatMapShardChanceFromShards"; value: number; shardStep: number; maxSteps?: number }
  | { type: "percentEncounterReward"; value: number }
  | { type: "flatEncounterShardChance"; value: number }
  | { type: "percentEncounterPrestigeShards"; value: number };

export type UpgradeDefinition = {
  id: string;
  category: UpgradeCategory;
  group: UpgradeGroup;
  name: string;
  description: string;
  baseCost: UpgradeCost;
  costMultiplier?: number;
  maxLevel?: number;
  prerequisite?: string;
  requirements?: UpgradeRequirement[];
  effect: UpgradeEffect;
};

export const upgrades: UpgradeDefinition[] = [
  { id: "fragmentEfficiency", category: "generators", group: "Foundations", name: "Fragment Efficiency", description: "Scale fragment production for the opening loop.", baseCost: { fragmentOfWisdom: 50 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "fragmentOfWisdom", value: 0.1 } },
  { id: "transmutationEfficiency", category: "generators", group: "Foundations", name: "Transmutation Tuning", description: "Increase transmutation output to accelerate the first unlock chain.", baseCost: { transmutationOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "transmutationOrb", value: 0.1 } },
  { id: "augmentationEfficiency", category: "generators", group: "Foundations", name: "Augmentation Refinement", description: "Keep early crafting lines moving faster.", baseCost: { augmentationOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "augmentationOrb", value: 0.1 } },
  { id: "alterationEfficiency", category: "generators", group: "Crafting Lines", name: "Alteration Mastery", description: "Push alteration production into maps sooner.", baseCost: { alterationOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "alterationOrb", value: 0.1 } },
  { id: "jewellerEfficiency", category: "generators", group: "Crafting Lines", name: "Jeweller Precision", description: "Improve jeweller throughput for map-related upgrades.", baseCost: { jewellersOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "jewellersOrb", value: 0.1 } },
  { id: "fusingEfficiency", category: "generators", group: "Crafting Lines", name: "Fusing Synergy", description: "Feed higher-value crafting and map chains.", baseCost: { fusingOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "fusingOrb", value: 0.1 } },
  { id: "alchemyEfficiency", category: "generators", group: "Crafting Lines", name: "Alchemy Potency", description: "Lift mid-game currency throughput.", baseCost: { alchemyOrb: 3 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "alchemyOrb", value: 0.1 } },
  { id: "chaosAmplification", category: "generators", group: "High Currency", name: "Chaos Amplification", description: "Grow chaos output for atlas and relic planning.", baseCost: { chaosOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "chaosOrb", value: 0.1 } },
  { id: "regalEfficiency", category: "generators", group: "High Currency", name: "Regal Authority", description: "Strengthen rare crafting currency lines.", baseCost: { regalOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "regalOrb", value: 0.1 } },
  { id: "exaltedEfficiency", category: "generators", group: "High Currency", name: "Exalted Brilliance", description: "Scale late-run premium crafting value.", baseCost: { exaltedOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "exaltedOrb", value: 0.1 } },
  { id: "divineEfficiency", category: "generators", group: "High Currency", name: "Divine Resonance", description: "Anchor endgame generator scaling.", baseCost: { divineOrb: 2 }, costMultiplier: 1.2, effect: { type: "percentProduction", currency: "divineOrb", value: 0.1 } },
  { id: "clickPower", category: "economy", group: "Direct Power", name: "Click Power", description: "Raise manual click impact for short-term push moments.", baseCost: { fragmentOfWisdom: 25 }, costMultiplier: 1.3, effect: { type: "percentClickPower", value: 0.25 } },
  { id: "exchangeFinesse", category: "economy", group: "Trading", name: "Exchange Finesse", description: "Manual conversions output extra currency, creating a stronger bridge between tiers.", baseCost: { augmentationOrb: 18, alterationOrb: 6 }, costMultiplier: 1.35, requirements: [{ type: "unlockedCurrency", currencyId: "augmentationOrb" }], effect: { type: "flatConversionOutput", value: 1 } },
  { id: "mapCalibration", category: "maps", group: "Reward Engines", name: "Map Calibration", description: "Lift baseline map reward value.", baseCost: { alterationOrb: 25, jewellersOrb: 2 }, costMultiplier: 1.35, requirements: [{ type: "unlockedCurrency", currencyId: "alterationOrb" }], effect: { type: "percentMapReward", value: 0.12 } },
  { id: "focusedSurvey", category: "maps", group: "Reward Engines", name: "Focused Survey", description: "Make specialized maps a stronger choice when you want targeted currencies.", baseCost: { jewellersOrb: 10, fusingOrb: 4 }, costMultiplier: 1.36, prerequisite: "mapCalibration", requirements: [{ type: "mapsCompleted", amount: 1 }], effect: { type: "percentFocusedMapReward", value: 0.18 } },
  { id: "waystoneDrafting", category: "maps", group: "Reward Engines", name: "Waystone Drafting", description: "Higher-tier maps become a clearer step up instead of just a longer run.", baseCost: { fusingOrb: 14, chaosOrb: 3 }, costMultiplier: 1.38, prerequisite: "focusedSurvey", requirements: [{ type: "mapsCompleted", amount: 3 }], effect: { type: "percentMapRewardPerTier", value: 0.1 } },
  { id: "encounterCartography", category: "maps", group: "Reward Engines", name: "Encounter Cartography", description: "Map encounters pay out more value once you start routing around them.", baseCost: { alchemyOrb: 8, chaosOrb: 3 }, costMultiplier: 1.42, prerequisite: "waystoneDrafting", requirements: [{ type: "mapsCompleted", amount: 5 }], effect: { type: "percentEncounterReward", value: 0.14 } },
  { id: "buyMax", category: "automation", group: "Queue Control", name: "Buy Max", description: "Buy the maximum affordable generators at once.", baseCost: { alterationOrb: 1 }, maxLevel: 1, requirements: [{ type: "unlockedCurrency", currencyId: "alterationOrb" }], effect: { type: "unlockFeature", feature: "buyMax" } },
  { id: "queuePriority", category: "automation", group: "Queue Control", name: "Queue Priority", description: "Queued maps gain extra reward value, making route planning matter.", baseCost: { jewellersOrb: 14, fusingOrb: 4 }, costMultiplier: 1.4, requirements: [{ type: "mapsCompleted", amount: 2 }], effect: { type: "percentQueuedMapReward", value: 0.2 } },
  { id: "relayStability", category: "automation", group: "Queue Control", name: "Relay Stability", description: "Queued maps gain shard consistency so chaining runs feels better.", baseCost: { chaosOrb: 4, regalOrb: 1 }, costMultiplier: 1.42, prerequisite: "queuePriority", requirements: [{ type: "mapsCompleted", amount: 4 }], effect: { type: "flatQueuedMapShardChance", value: 0.0035 } },
  { id: "atlasSurveying", category: "atlas", group: "Atlas Memory", name: "Atlas Surveying", description: "Increase baseline shard chance for all maps.", baseCost: { chaosOrb: 2, regalOrb: 1 }, costMultiplier: 1.4, requirements: [{ type: "mapsCompleted", amount: 3 }], effect: { type: "flatMapShardChance", value: 0.004 } },
  { id: "atlasTrails", category: "atlas", group: "Atlas Memory", name: "Atlas Trails", description: "Family streaks matter more, rewarding committed routing.", baseCost: { chaosOrb: 8, regalOrb: 3 }, costMultiplier: 1.44, prerequisite: "atlasSurveying", requirements: [{ type: "totalMirrorShards", amount: 5 }], effect: { type: "percentMapStreakReward", value: 0.05 } },
  { id: "routeCompass", category: "atlas", group: "Atlas Memory", name: "Route Compass", description: "Tier advantage grows as your atlas experience deepens.", baseCost: { regalOrb: 6, exaltedOrb: 1 }, costMultiplier: 1.48, prerequisite: "atlasTrails", requirements: [{ type: "totalMirrorShards", amount: 12 }], effect: { type: "percentMapRewardPerTier", value: 0.06 } },
  { id: "hazardSurveying", category: "atlas", group: "Atlas Memory", name: "Hazard Surveying", description: "Encounter runs become more reliable shard sources once your atlas deepens.", baseCost: { regalOrb: 6, exaltedOrb: 1 }, costMultiplier: 1.5, prerequisite: "routeCompass", requirements: [{ type: "totalMirrorShards", amount: 18 }], effect: { type: "flatEncounterShardChance", value: 0.003 } },
  { id: "relicLattice", category: "relics", group: "Relic Echoes", name: "Relic Lattice", description: "Prestige yields more shards, strengthening long-term resets.", baseCost: { chaosOrb: 12, regalOrb: 4 }, costMultiplier: 1.5, requirements: [{ type: "prestigeCount", amount: 1 }], effect: { type: "percentPrestigeShards", value: 0.12 } },
  { id: "shardResonance", category: "relics", group: "Relic Echoes", name: "Shard Resonance", description: "Total shards feed back into map rewards, tying resets to active runs.", baseCost: { regalOrb: 8, exaltedOrb: 2 }, costMultiplier: 1.55, prerequisite: "relicLattice", requirements: [{ type: "totalMirrorShards", amount: 12 }], effect: { type: "percentMapRewardFromShards", value: 0.03, shardStep: 25, maxSteps: 8 } },
  { id: "heirloomSpark", category: "relics", group: "Relic Echoes", name: "Heirloom Spark", description: "Shard stockpiles also steady future shard drops inside maps.", baseCost: { exaltedOrb: 4, divineOrb: 1 }, costMultiplier: 1.6, prerequisite: "shardResonance", requirements: [{ type: "totalMirrorShards", amount: 30 }], effect: { type: "flatMapShardChanceFromShards", value: 0.0015, shardStep: 25, maxSteps: 8 } },
  { id: "echoArchive", category: "relics", group: "Relic Echoes", name: "Echo Archive", description: "Encounter-heavy runs cash out for better prestige rewards.", baseCost: { exaltedOrb: 3, divineOrb: 1 }, costMultiplier: 1.65, prerequisite: "heirloomSpark", requirements: [{ type: "prestigeCount", amount: 2 }], effect: { type: "percentEncounterPrestigeShards", value: 0.2 } },
];

export type UpgradeId = (typeof upgrades)[number]["id"];
export type PurchasedUpgradeState = Record<UpgradeId, number>;
export type FeatureState = Record<FeatureId, boolean>;

export type UpgradeAvailabilityState = {
  currencies: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeSnapshot;
};

export type UpgradeEngineState = UpgradeAvailabilityState & {
  generatorsOwned: GeneratorOwnedState;
  currencyMultipliers: CurrencyMultipliers;
  unlockedFeatures: FeatureState;
};

export type MapUpgradeContext = {
  tier: number;
  streak: number;
  totalMirrorShards: number;
  encounterTags: MapEncounterTag[];
  hasEncounter: boolean;
};

export const upgradeMap: Record<UpgradeId, UpgradeDefinition> = upgrades.reduce((acc, upgrade) => {
  acc[upgrade.id as UpgradeId] = upgrade;
  return acc;
}, {} as Record<UpgradeId, UpgradeDefinition>);

export const initialPurchasedUpgrades: PurchasedUpgradeState = upgrades.reduce((acc, upgrade) => {
  acc[upgrade.id as UpgradeId] = 0;
  return acc;
}, {} as PurchasedUpgradeState);

export const initialUnlockedFeatures: FeatureState = {
  buyMax: false,
};

function scaleCost(baseCost: number, costMultiplier: number | undefined, level: number) {
  if (!costMultiplier) return Math.ceil(baseCost);
  return Math.ceil(baseCost * costMultiplier ** level);
}

function getShardThresholdSteps(totalMirrorShards: number, shardStep: number, maxSteps?: number) {
  const steps = Math.floor(totalMirrorShards / shardStep);
  return maxSteps === undefined ? steps : Math.min(steps, maxSteps);
}

function getRequirementProgress(state: UpgradeAvailabilityState, requirement: UpgradeRequirement) {
  switch (requirement.type) {
    case "unlockedCurrency":
      return state.unlockedCurrencies[requirement.currencyId] ? 1 : 0;
    case "mapsCompleted":
      return state.prestige.mapsCompleted;
    case "prestigeCount":
      return state.prestige.prestigeCount;
    case "totalMirrorShards":
      return state.prestige.totalMirrorShards;
    case "upgradeLevel":
      return state.purchasedUpgrades[requirement.upgradeId as UpgradeId] ?? 0;
  }
}

function getRequirementTarget(requirement: UpgradeRequirement) {
  switch (requirement.type) {
    case "unlockedCurrency":
      return 1;
    case "mapsCompleted":
    case "prestigeCount":
    case "totalMirrorShards":
    case "upgradeLevel":
      return requirement.amount;
  }
}

function isRequirementMet(state: UpgradeAvailabilityState, requirement: UpgradeRequirement) {
  return getRequirementProgress(state, requirement) >= getRequirementTarget(requirement);
}

function formatRequirement(requirement: UpgradeRequirement) {
  switch (requirement.type) {
    case "unlockedCurrency":
      return `Unlock ${currencyMap[requirement.currencyId].shortLabel}`;
    case "mapsCompleted":
      return `Complete ${requirement.amount} map${requirement.amount === 1 ? "" : "s"}`;
    case "prestigeCount":
      return `Prestige ${requirement.amount} time${requirement.amount === 1 ? "" : "s"}`;
    case "totalMirrorShards":
      return `Reach ${requirement.amount} total shards`;
    case "upgradeLevel":
      return `${upgradeMap[requirement.upgradeId as UpgradeId]?.name ?? requirement.upgradeId} Lv ${requirement.amount}`;
  }
}

export function getUpgradeCost(upgradeId: UpgradeId, level: number) {
  const upgrade = upgradeMap[upgradeId];
  return Object.entries(upgrade.baseCost).reduce((acc, [currencyId, amount]) => {
    acc[currencyId as CurrencyId] = scaleCost(amount ?? 0, upgrade.costMultiplier, level);
    return acc;
  }, {} as UpgradeCost);
}

export function canAffordCost(currenciesState: CurrencyState, cost: UpgradeCost) {
  return Object.entries(cost).every(([currencyId, amount]) => Math.floor(currenciesState[currencyId as CurrencyId]) >= (amount ?? 0));
}

export function getUpgradeBreakpointMultiplier(level: number) {
  return 2 ** Math.floor(level / 25);
}

export function isUpgradeUnlocked(state: UpgradeAvailabilityState, upgradeId: UpgradeId) {
  const upgrade = upgradeMap[upgradeId];

  if (upgrade.prerequisite) {
    const prereqLevel = state.purchasedUpgrades[upgrade.prerequisite as UpgradeId] ?? 0;
    if (prereqLevel <= 0) return false;
  }

  return (upgrade.requirements ?? []).every((requirement) => isRequirementMet(state, requirement));
}

export function getUpgradeUnlockText(state: UpgradeAvailabilityState, upgradeId: UpgradeId) {
  const upgrade = upgradeMap[upgradeId];

  if (upgrade.prerequisite) {
    const prereq = upgradeMap[upgrade.prerequisite as UpgradeId];
    const prereqLevel = state.purchasedUpgrades[upgrade.prerequisite as UpgradeId] ?? 0;
    if (prereqLevel <= 0) return `Requires ${prereq?.name ?? upgrade.prerequisite}`;
  }

  const unmetRequirement = (upgrade.requirements ?? []).find((requirement) => !isRequirementMet(state, requirement));
  return unmetRequirement ? formatRequirement(unmetRequirement) : null;
}

export function canPurchaseUpgrade(state: UpgradeAvailabilityState, upgradeId: UpgradeId) {
  const upgrade = upgradeMap[upgradeId];
  const currentLevel = state.purchasedUpgrades[upgradeId];

  if (upgrade.maxLevel !== undefined && currentLevel >= upgrade.maxLevel) return false;
  if (!isUpgradeUnlocked(state, upgradeId)) return false;

  return canAffordCost(state.currencies, getUpgradeCost(upgradeId, currentLevel));
}

export function getUpgradeCategoryStats(state: UpgradeAvailabilityState, category: UpgradeCategory) {
  const categoryUpgrades = upgrades.filter((upgrade) => upgrade.category === category);
  const unlocked = categoryUpgrades.filter((upgrade) => isUpgradeUnlocked(state, upgrade.id as UpgradeId)).length;
  const affordable = categoryUpgrades.filter((upgrade) => canPurchaseUpgrade(state, upgrade.id as UpgradeId)).length;
  return {
    total: categoryUpgrades.length,
    unlocked,
    affordable,
  };
}

export function getAffordableUpgradeCount(state: UpgradeAvailabilityState) {
  return upgrades.filter((upgrade) => canPurchaseUpgrade(state, upgrade.id as UpgradeId)).length;
}

export function applyUpgradeEffects(purchasedUpgrades: PurchasedUpgradeState, breakpointBonus = 0) {
  const currencyMultipliers = { ...initialCurrencyMultipliers };
  const unlockedFeatures = { ...initialUnlockedFeatures };
  let clickMultiplier = 1;

  upgrades.forEach((upgrade) => {
    const level = purchasedUpgrades[upgrade.id as UpgradeId];
    if (level <= 0) return;

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

    if (upgrade.effect.type === "unlockFeature") {
      unlockedFeatures[upgrade.effect.feature] = true;
    }
  });

  return { currencyMultipliers, unlockedFeatures, clickMultiplier };
}

export function getConversionOutputUpgradeBonus(purchasedUpgrades: PurchasedUpgradeState) {
  return upgrades.reduce((bonus, upgrade) => {
    if (upgrade.effect.type !== "flatConversionOutput") return bonus;
    return bonus + purchasedUpgrades[upgrade.id as UpgradeId] * upgrade.effect.value;
  }, 0);
}

export function getBaseMapRewardUpgradeBonus(purchasedUpgrades: PurchasedUpgradeState, context: MapUpgradeContext) {
  return upgrades.reduce((bonus, upgrade) => {
    const level = purchasedUpgrades[upgrade.id as UpgradeId];
    if (level <= 0) return bonus;

    switch (upgrade.effect.type) {
      case "percentMapReward":
        return bonus + level * upgrade.effect.value;
      case "percentMapRewardPerTier":
        return bonus + Math.max(0, context.tier - 1) * level * upgrade.effect.value;
      case "percentMapStreakReward":
        return bonus + Math.max(0, context.streak) * level * upgrade.effect.value;
      case "percentMapRewardFromShards": {
        const steps = getShardThresholdSteps(context.totalMirrorShards, upgrade.effect.shardStep, upgrade.effect.maxSteps);
        return bonus + steps * level * upgrade.effect.value;
      }
      case "percentEncounterReward":
        return context.hasEncounter ? bonus + level * upgrade.effect.value : bonus;
      default:
        return bonus;
    }
  }, 0);
}

export function getFocusedMapRewardUpgradeBonus(purchasedUpgrades: PurchasedUpgradeState) {
  return upgrades.reduce((bonus, upgrade) => {
    if (upgrade.effect.type !== "percentFocusedMapReward") return bonus;
    return bonus + purchasedUpgrades[upgrade.id as UpgradeId] * upgrade.effect.value;
  }, 0);
}

export function getQueuedMapRewardUpgradeBonus(purchasedUpgrades: PurchasedUpgradeState) {
  return upgrades.reduce((bonus, upgrade) => {
    if (upgrade.effect.type !== "percentQueuedMapReward") return bonus;
    return bonus + purchasedUpgrades[upgrade.id as UpgradeId] * upgrade.effect.value;
  }, 0);
}

export function getMapShardChanceUpgradeBonus(
  purchasedUpgrades: PurchasedUpgradeState,
  totalMirrorShards: number,
  hasEncounter = false,
) {
  return upgrades.reduce((bonus, upgrade) => {
    const level = purchasedUpgrades[upgrade.id as UpgradeId];
    if (level <= 0) return bonus;

    switch (upgrade.effect.type) {
      case "flatMapShardChance":
        return bonus + level * upgrade.effect.value;
      case "flatMapShardChanceFromShards": {
        const steps = getShardThresholdSteps(totalMirrorShards, upgrade.effect.shardStep, upgrade.effect.maxSteps);
        return bonus + steps * level * upgrade.effect.value;
      }
      case "flatEncounterShardChance":
        return hasEncounter ? bonus + level * upgrade.effect.value : bonus;
      default:
        return bonus;
    }
  }, 0);
}

export function getQueuedMapShardChanceUpgradeBonus(purchasedUpgrades: PurchasedUpgradeState) {
  return upgrades.reduce((bonus, upgrade) => {
    if (upgrade.effect.type !== "flatQueuedMapShardChance") return bonus;
    return bonus + purchasedUpgrades[upgrade.id as UpgradeId] * upgrade.effect.value;
  }, 0);
}

export function getPrestigeShardUpgradeBonus(purchasedUpgrades: PurchasedUpgradeState) {
  return upgrades.reduce((bonus, upgrade) => {
    if (upgrade.effect.type !== "percentPrestigeShards") return bonus;
    return bonus + purchasedUpgrades[upgrade.id as UpgradeId] * upgrade.effect.value;
  }, 0);
}

export function getEncounterPrestigeUpgradeBonus(purchasedUpgrades: PurchasedUpgradeState) {
  return upgrades.reduce((bonus, upgrade) => {
    if (upgrade.effect.type !== "percentEncounterPrestigeShards") return bonus;
    return bonus + purchasedUpgrades[upgrade.id as UpgradeId] * upgrade.effect.value;
  }, 0);
}

export function augmentDeviceEffectsForUpgrades(
  deviceEffects: ResolvedDeviceEffects,
  purchasedUpgrades: PurchasedUpgradeState,
  isQueuedMap = false,
): ResolvedDeviceEffects {
  return {
    ...deviceEffects,
    rewardMultiplier: deviceEffects.rewardMultiplier + (isQueuedMap ? getQueuedMapRewardUpgradeBonus(purchasedUpgrades) : 0),
    focusedRewardMultiplier: deviceEffects.focusedRewardMultiplier + getFocusedMapRewardUpgradeBonus(purchasedUpgrades),
    shardChanceBonus: deviceEffects.shardChanceBonus + (isQueuedMap ? getQueuedMapShardChanceUpgradeBonus(purchasedUpgrades) : 0),
  };
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
  if (!canPurchaseUpgrade(gameState, upgradeId)) return gameState;

  const currentLevel = gameState.purchasedUpgrades[upgradeId];
  const cost = getUpgradeCost(upgradeId, currentLevel);

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
  if (quantity <= 0) return gameState;

  const generator = generators.find((entry) => entry.id === generatorId);
  if (!generator) return gameState;

  const owned = gameState.generatorsOwned[generatorId];
  const cost = getGeneratorCost(generatorId, owned, quantity);
  if (Math.floor(gameState.currencies[generator.costCurrency]) < cost) return gameState;

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

export function getUpgradesByCategory(category: UpgradeCategory) {
  return upgrades.filter((upgrade) => upgrade.category === category);
}

export function getUpgradeCategoryLabel(category: UpgradeCategory) {
  switch (category) {
    case "generators": return "Generators";
    case "economy": return "Economy";
    case "maps": return "Maps";
    case "automation": return "Automation";
    case "atlas": return "Atlas";
    case "relics": return "Relics";
  }
}

export function getUpgradeCategoryDescription(category: UpgradeCategory) {
  switch (category) {
    case "generators": return "Immediate output boosts across currency lines.";
    case "economy": return "Click and conversion tools for short-term pushes.";
    case "maps": return "Active run value, encounter routing, and targeted map scaling.";
    case "automation": return "Batching and queue-based leverage.";
    case "atlas": return "Routing, streaks, and encounter reliability that build over time.";
    case "relics": return "Prestige-fed bonuses that echo back into live runs and encounter planning.";
  }
}
