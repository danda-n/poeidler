import { currencyMap, formatCurrencyValue, type CurrencyId, type CurrencyState } from "./currencies";
import {
  canAffordCost,
  canPurchaseUpgrade,
  getUpgradeCost,
  getUpgradeUnlockText,
  getUpgradesByCategory,
  isUpgradeUnlocked,
  upgradeMap,
  type UpgradeAvailabilityState,
  type UpgradeCategory,
  type UpgradeDefinition,
  type UpgradeId,
} from "./upgradeEngine";

export type UpgradeNodeKind = "minor" | "unlock" | "keystone";
export type UpgradeNodeState = "locked" | "unlocked" | "available" | "purchased" | "maxed";

export type UpgradeNodePresentation = {
  shortLabel: string;
  shortEffect: string;
  kind: UpgradeNodeKind;
  tier: number;
  lane: string;
  laneOrder: number;
  visualParents?: UpgradeId[];
};

export type UpgradeTreeLane = {
  label: string;
  order: number;
};

export type UpgradeTreeEdge = {
  fromId: UpgradeId;
  toId: UpgradeId;
};

export type UpgradeNodeViewModel = {
  definition: UpgradeDefinition;
  presentation: UpgradeNodePresentation;
};

const upgradePresentationMap: Record<UpgradeId, UpgradeNodePresentation> = {
  fragmentEfficiency: { shortLabel: "Fragment Flow", shortEffect: "+10% Fragment gen", kind: "minor", tier: 1, lane: "Starter loop", laneOrder: 1 },
  transmutationEfficiency: { shortLabel: "Transmute Flow", shortEffect: "+10% Transmute gen", kind: "minor", tier: 2, lane: "Starter loop", laneOrder: 1, visualParents: ["fragmentEfficiency"] },
  augmentationEfficiency: { shortLabel: "Augment Flow", shortEffect: "+10% Augment gen", kind: "minor", tier: 3, lane: "Starter loop", laneOrder: 1, visualParents: ["transmutationEfficiency"] },
  alterationEfficiency: { shortLabel: "Alteration Flow", shortEffect: "+10% Alteration gen", kind: "minor", tier: 2, lane: "Crafting chain", laneOrder: 2, visualParents: ["fragmentEfficiency"] },
  jewellerEfficiency: { shortLabel: "Jeweller Flow", shortEffect: "+10% Jeweller gen", kind: "minor", tier: 3, lane: "Crafting chain", laneOrder: 2, visualParents: ["alterationEfficiency"] },
  fusingEfficiency: { shortLabel: "Fusing Flow", shortEffect: "+10% Fusing gen", kind: "minor", tier: 4, lane: "Crafting chain", laneOrder: 2, visualParents: ["jewellerEfficiency"] },
  alchemyEfficiency: { shortLabel: "Alchemy Flow", shortEffect: "+10% Alchemy gen", kind: "minor", tier: 5, lane: "Crafting chain", laneOrder: 2, visualParents: ["fusingEfficiency"] },
  chaosAmplification: { shortLabel: "Chaos Flow", shortEffect: "+10% Chaos gen", kind: "minor", tier: 3, lane: "High-value line", laneOrder: 3, visualParents: ["augmentationEfficiency", "jewellerEfficiency"] },
  regalEfficiency: { shortLabel: "Regal Flow", shortEffect: "+10% Regal gen", kind: "minor", tier: 4, lane: "High-value line", laneOrder: 3, visualParents: ["chaosAmplification"] },
  exaltedEfficiency: { shortLabel: "Exalted Flow", shortEffect: "+10% Exalted gen", kind: "minor", tier: 5, lane: "High-value line", laneOrder: 3, visualParents: ["regalEfficiency"] },
  divineEfficiency: { shortLabel: "Divine Flow", shortEffect: "+10% Divine gen", kind: "keystone", tier: 6, lane: "High-value line", laneOrder: 3, visualParents: ["exaltedEfficiency", "alchemyEfficiency"] },
  clickPower: { shortLabel: "Heavy Clicks", shortEffect: "+25% click", kind: "minor", tier: 1, lane: "Manual power", laneOrder: 1 },
  exchangeFinesse: { shortLabel: "Smart Exchange", shortEffect: "+1 convert output", kind: "unlock", tier: 2, lane: "Market flow", laneOrder: 2, visualParents: ["clickPower"] },
  supplyLogistics: { shortLabel: "Supply Lines", shortEffect: "-2.5% gen costs", kind: "keystone", tier: 3, lane: "Market flow", laneOrder: 2, visualParents: ["exchangeFinesse"] },
  mapCalibration: { shortLabel: "Calibration", shortEffect: "+12% map rewards", kind: "minor", tier: 1, lane: "Reward path", laneOrder: 1 },
  focusedSurvey: { shortLabel: "Focused Survey", shortEffect: "+18% focused maps", kind: "minor", tier: 2, lane: "Reward path", laneOrder: 1, visualParents: ["mapCalibration"] },
  waystoneDrafting: { shortLabel: "Waystone Drafting", shortEffect: "+10% per map tier", kind: "keystone", tier: 3, lane: "Reward path", laneOrder: 1, visualParents: ["focusedSurvey"] },
  encounterCartography: { shortLabel: "Encounter Charts", shortEffect: "+14% encounter rewards", kind: "keystone", tier: 4, lane: "Reward path", laneOrder: 1, visualParents: ["waystoneDrafting"] },
  swiftSurvey: { shortLabel: "Swift Survey", shortEffect: "-3% map time", kind: "keystone", tier: 5, lane: "Routing path", laneOrder: 2, visualParents: ["encounterCartography"] },
  buyMax: { shortLabel: "Buy Max", shortEffect: "Unlock bulk buys", kind: "unlock", tier: 1, lane: "Automation core", laneOrder: 1 },
  queuePriority: { shortLabel: "Queue Priority", shortEffect: "+20% queued rewards", kind: "unlock", tier: 2, lane: "Automation core", laneOrder: 1, visualParents: ["buyMax"] },
  relayStability: { shortLabel: "Relay Stability", shortEffect: "+0.35% queued shard", kind: "minor", tier: 3, lane: "Automation core", laneOrder: 1, visualParents: ["queuePriority"] },
  relayCalibration: { shortLabel: "Relay Calibration", shortEffect: "-2% map time", kind: "keystone", tier: 4, lane: "Automation core", laneOrder: 1, visualParents: ["relayStability"] },
  atlasSurveying: { shortLabel: "Atlas Surveying", shortEffect: "+0.4% shard chance", kind: "minor", tier: 1, lane: "Atlas memory", laneOrder: 1 },
  atlasTrails: { shortLabel: "Atlas Trails", shortEffect: "+5% streak rewards", kind: "minor", tier: 2, lane: "Atlas memory", laneOrder: 1, visualParents: ["atlasSurveying"] },
  routeCompass: { shortLabel: "Route Compass", shortEffect: "+6% per map tier", kind: "keystone", tier: 3, lane: "Atlas memory", laneOrder: 1, visualParents: ["atlasTrails"] },
  hazardSurveying: { shortLabel: "Hazard Surveying", shortEffect: "+0.3% encounter shard", kind: "minor", tier: 4, lane: "Atlas memory", laneOrder: 1, visualParents: ["routeCompass"] },
  atlasStockpiles: { shortLabel: "Atlas Stockpiles", shortEffect: "-3% map costs", kind: "keystone", tier: 5, lane: "Atlas memory", laneOrder: 1, visualParents: ["hazardSurveying"] },
  relicLattice: { shortLabel: "Relic Lattice", shortEffect: "+12% prestige shards", kind: "keystone", tier: 1, lane: "Relic echoes", laneOrder: 1 },
  shardResonance: { shortLabel: "Shard Resonance", shortEffect: "+3% rewards / 25 shards", kind: "keystone", tier: 2, lane: "Relic echoes", laneOrder: 1, visualParents: ["relicLattice"] },
  heirloomSpark: { shortLabel: "Heirloom Spark", shortEffect: "+0.15% shard / 25", kind: "minor", tier: 3, lane: "Relic echoes", laneOrder: 1, visualParents: ["shardResonance"] },
  echoArchive: { shortLabel: "Echo Archive", shortEffect: "+20% encounter prestige", kind: "keystone", tier: 4, lane: "Relic echoes", laneOrder: 1, visualParents: ["heirloomSpark"] },
};

export function getUpgradePresentation(upgradeId: UpgradeId) {
  return upgradePresentationMap[upgradeId];
}

export function getUpgradeTree(category: UpgradeCategory) {
  const nodes: UpgradeNodeViewModel[] = getUpgradesByCategory(category)
    .map((definition) => ({ definition, presentation: getUpgradePresentation(definition.id as UpgradeId) }))
    .sort((left, right) => {
      if (left.presentation.tier !== right.presentation.tier) return left.presentation.tier - right.presentation.tier;
      if (left.presentation.laneOrder !== right.presentation.laneOrder) return left.presentation.laneOrder - right.presentation.laneOrder;
      return left.definition.name.localeCompare(right.definition.name);
    });

  const lanes = Array.from(
    nodes.reduce((acc, node) => {
      if (!acc.has(node.presentation.lane)) {
        acc.set(node.presentation.lane, { label: node.presentation.lane, order: node.presentation.laneOrder });
      }
      return acc;
    }, new Map<string, UpgradeTreeLane>()),
  )
    .map(([, lane]) => lane)
    .sort((left, right) => left.order - right.order);

  const edges: UpgradeTreeEdge[] = nodes.flatMap((node) =>
    (node.presentation.visualParents ?? []).map((fromId) => ({ fromId, toId: node.definition.id as UpgradeId })),
  );

  const tierCount = nodes.reduce((max, node) => Math.max(max, node.presentation.tier), 1);

  return { nodes, lanes, edges, tierCount };
}

export function getUpgradeNodeState(state: UpgradeAvailabilityState, upgradeId: UpgradeId): UpgradeNodeState {
  const definition = upgradeMap[upgradeId];
  const level = state.purchasedUpgrades[upgradeId];
  const isCapped = definition.maxLevel !== undefined && level >= definition.maxLevel;
  if (isCapped) return "maxed";
  if (canPurchaseUpgrade(state, upgradeId)) return "available";
  if (level > 0) return "purchased";
  if (isUpgradeUnlocked(state, upgradeId)) return "unlocked";
  return "locked";
}

export function getUpgradeNodeStateLabel(nodeState: UpgradeNodeState) {
  switch (nodeState) {
    case "locked":
      return "Locked";
    case "unlocked":
      return "Unlocked";
    case "available":
      return "Ready";
    case "purchased":
      return "Owned";
    case "maxed":
      return "Maxed";
  }
}

export function formatUpgradeCost(cost: Partial<Record<CurrencyId, number>>) {
  return Object.entries(cost)
    .map(([currencyId, amount]) => `${formatCurrencyValue(amount ?? 0)} ${currencyMap[currencyId as CurrencyId].shortLabel}`)
    .join(", ");
}

export function describeUpgradeEffect(upgrade: UpgradeDefinition, level: number, totalMirrorShards: number) {
  switch (upgrade.effect.type) {
    case "percentProduction":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% ${currencyMap[upgrade.effect.currency].shortLabel} production`;
    case "percentClickPower":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% click power`;
    case "flatConversionOutput":
      return `+${level * upgrade.effect.value} conversion output`;
    case "percentGeneratorCostReduction":
      return `-${Math.round(upgrade.effect.value * 100 * level)}% generator costs`;
    case "percentMapReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% map reward value`;
    case "percentFocusedMapReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% focused rewards`;
    case "percentMapRewardPerTier":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% reward per map tier`;
    case "percentQueuedMapReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% queued map rewards`;
    case "flatMapShardChance":
      return `+${(upgrade.effect.value * 100 * level).toFixed(1)}% shard chance`;
    case "flatQueuedMapShardChance":
      return `+${(upgrade.effect.value * 100 * level).toFixed(2)}% queued shard chance`;
    case "percentMapStreakReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% reward per streak step`;
    case "percentMapSpeed":
      return `-${Math.round(upgrade.effect.value * 100 * level)}% map duration`;
    case "percentMapCostReduction":
      return `-${Math.round(upgrade.effect.value * 100 * level)}% map costs`;
    case "percentPrestigeShards":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% prestige shards`;
    case "percentMapRewardFromShards": {
      const steps = Math.floor(totalMirrorShards / upgrade.effect.shardStep);
      const activeSteps = upgrade.effect.maxSteps === undefined ? steps : Math.min(steps, upgrade.effect.maxSteps);
      return `+${Math.round(upgrade.effect.value * 100 * level)}% reward per ${upgrade.effect.shardStep} shards (${activeSteps} active)`;
    }
    case "flatMapShardChanceFromShards": {
      const steps = Math.floor(totalMirrorShards / upgrade.effect.shardStep);
      const activeSteps = upgrade.effect.maxSteps === undefined ? steps : Math.min(steps, upgrade.effect.maxSteps);
      return `+${(upgrade.effect.value * 100 * level).toFixed(2)}% shard chance per ${upgrade.effect.shardStep} shards (${activeSteps} active)`;
    }
    case "percentEncounterReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% encounter reward value`;
    case "flatEncounterShardChance":
      return `+${(upgrade.effect.value * 100 * level).toFixed(2)}% shard chance on encounter maps`;
    case "percentEncounterPrestigeShards":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% encounter prestige value`;
    case "unlockFeature":
      return level > 0 ? "Unlocked" : getUpgradePresentation(upgrade.id as UpgradeId).shortEffect;
  }
}

export function getUpgradeNodeRequirementText(state: UpgradeAvailabilityState, upgradeId: UpgradeId) {
  return getUpgradeUnlockText(state, upgradeId) ?? "Ready";
}

export function getUpgradeNodeCostLabel(state: UpgradeAvailabilityState, upgradeId: UpgradeId) {
  return formatUpgradeCost(getUpgradeCost(upgradeId, state.purchasedUpgrades[upgradeId]));
}

export function getUpgradeNodeAffordability(state: UpgradeAvailabilityState, upgradeId: UpgradeId, currenciesState: CurrencyState) {
  return canAffordCost(currenciesState, getUpgradeCost(upgradeId, state.purchasedUpgrades[upgradeId]));
}
