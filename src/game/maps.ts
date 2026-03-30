import {
  currencyMap,
  getTotalProductionValuePerSecond,
  type CurrencyId,
  type CurrencyProduction,
  type CurrencyState,
} from "./currencies";
import {
  rollNormalAffixes,
  rollOneNormalAffix,
  rollPremiumAffix,
  resolveAffixStats,
  getAffixCount,
  affixMap,
  type ResolvedAffixStats,
} from "./mapAffixes";
import type { DeviceLoadout, ResolvedDeviceEffects } from "./mapDevice";

export type MapFamily = "currency" | "focused" | "mirror";
export type MapRarity = "normal" | "magic" | "rare";
export type MapContentTag = "stash" | "workshop" | "realm" | "focused" | "mirror";
export type MapEncounterId = "expedition" | "ritual" | "delirium";
export type MapEncounterTag = "shards" | "focused" | "highRisk" | "prestige";

export type MapCost = Partial<Record<CurrencyId, number>>;
export type MapReward = Partial<Record<CurrencyId, number>>;
export type MapRewardWeights = Partial<Record<CurrencyId, number>>;

export type BaseMapDefinition = {
  id: string;
  name: string;
  description: string;
  family: MapFamily;
  tier: number;
  durationMs: number;
  cost: MapCost;
  rewardWeights: MapRewardWeights;
  focusedRewardWeights: MapRewardWeights;
  focusedRewardShare: number;
  baseRewardSeconds: number;
  minRewardValue: number;
  contentTags: MapContentTag[];
  baseShardChance: number;
  wealthScalingFactor: number;
  unlockRequirement: { currencyId: CurrencyId; amount: number };
};

export type CraftedMap = {
  baseMapId: string;
  tier: number;
  quality: number;
  rarity: MapRarity;
  affixIds: string[];
  contentTags: MapContentTag[];
  encounterId: MapEncounterId | null;
  resolvedStats: ResolvedAffixStats;
};

export type ActiveMapState = {
  craftedMap: CraftedMap;
  startedAt: number;
  durationMs: number;
  deviceEffects: ResolvedDeviceEffects;
  incomePerSecond: number;
  wealthSnapshot: number;
  rewardBonus: number;
  shardChanceBonus: number;
  encounterChain: number;
} | null;

export type MapCompletionResult = {
  baseMapId: string;
  rarity: MapRarity;
  encounterId: MapEncounterId | null;
  encounterName: string | null;
  encounterChain: number;
  rewards: MapReward;
  shardDropped: boolean;
  shardAmount: number;
  shardChance: number;
  bonusRewardTriggered: boolean;
  totalRewardValue: number;
};

export type QueuedMapSetup = {
  baseMapId: string;
  craftedMap: CraftedMap;
  deviceLoadout: DeviceLoadout;
};

export type MapNotification = {
  result: MapCompletionResult;
  mapName: string;
  timestamp: number;
};

export type MapRewardPreview = {
  totalRewardValue: number;
  economyFloorValue: number;
  rewards: MapReward;
  encounterNotes: string[];
  encounterChain: number;
};

export type MapEncounterUnlockRequirement =
  | { type: "mapsCompleted"; amount: number }
  | { type: "totalMirrorShards"; amount: number }
  | { type: "prestigeCount"; amount: number };

export type MapEncounterProgression = {
  mapsCompleted: number;
  totalMirrorShards: number;
  prestigeCount: number;
  lastEncounterId: MapEncounterId | null;
  lastEncounterStreak: number;
};

export type MapEncounterDefinition = {
  id: MapEncounterId;
  name: string;
  description: string;
  tags: MapEncounterTag[];
  rewardMultiplier: number;
  focusedRewardMultiplier: number;
  durationMultiplier: number;
  costMultiplier: number;
  shardChanceBonus: number;
  streakRewardMultiplier: number;
  unlockRequirement: MapEncounterUnlockRequirement;
};

export type MapEncounterSpecialization = {
  rewardMultiplier: number;
  focusedRewardMultiplier: number;
  durationMultiplier: number;
  costMultiplier: number;
  shardChanceBonus: number;
  notes: string[];
};

export const MAP_BALANCE = {
  baseShardChance: 0.01,
  maxShardChance: 0.05,
  magicAffixCount: 2,
  rareAffixCount: 4,
  maxPrefixes: 2,
  maxSuffixes: 2,
  minDurationMs: 5000,
  maxEncounterChain: 4,
} as const;

const mapContentValueMultiplier: Record<MapContentTag, number> = {
  stash: 1,
  workshop: 1.04,
  realm: 1.08,
  focused: 1.05,
  mirror: 1.08,
};

export const mapEncounters: MapEncounterDefinition[] = [
  {
    id: "expedition",
    name: "Expedition",
    description: "Longer route with stronger shard odds and better prestige setup.",
    tags: ["shards", "prestige"],
    rewardMultiplier: -0.06,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0.35,
    costMultiplier: 0.08,
    shardChanceBonus: 0.012,
    streakRewardMultiplier: 1.15,
    unlockRequirement: { type: "mapsCompleted", amount: 1 },
  },
  {
    id: "ritual",
    name: "Ritual",
    description: "Higher-cost focused rewards that convert map time into targeted payouts.",
    tags: ["focused", "prestige"],
    rewardMultiplier: 0.08,
    focusedRewardMultiplier: 0.5,
    durationMultiplier: 0.22,
    costMultiplier: 0.12,
    shardChanceBonus: 0.004,
    streakRewardMultiplier: 1,
    unlockRequirement: { type: "mapsCompleted", amount: 3 },
  },
  {
    id: "delirium",
    name: "Delirium",
    description: "High-reward runs with muted streak scaling and elevated shard pressure.",
    tags: ["highRisk", "shards"],
    rewardMultiplier: 0.42,
    focusedRewardMultiplier: 0.18,
    durationMultiplier: 0.45,
    costMultiplier: 0.18,
    shardChanceBonus: 0.006,
    streakRewardMultiplier: 0,
    unlockRequirement: { type: "totalMirrorShards", amount: 8 },
  },
];

export const mapEncounterMap: Record<MapEncounterId, MapEncounterDefinition> = mapEncounters.reduce((acc, encounter) => {
  acc[encounter.id] = encounter;
  return acc;
}, {} as Record<MapEncounterId, MapEncounterDefinition>);

export const baseMaps: BaseMapDefinition[] = [
  {
    id: "currencyMap",
    name: "Currency Stash",
    description: "A broad currency run worth roughly a minute of current production.",
    family: "currency",
    tier: 1,
    durationMs: 15_000,
    cost: { alterationOrb: 40, augmentationOrb: 80 },
    rewardWeights: { transmutationOrb: 8, augmentationOrb: 4, alterationOrb: 3 },
    focusedRewardWeights: {},
    focusedRewardShare: 0,
    baseRewardSeconds: 70,
    minRewardValue: 1400,
    contentTags: ["stash"],
    baseShardChance: MAP_BALANCE.baseShardChance,
    wealthScalingFactor: 18,
    unlockRequirement: { currencyId: "alterationOrb", amount: 50 },
  },
  {
    id: "focusedMap",
    name: "Jeweller's Workshop",
    description: "A tighter reward profile that leans into higher-value crafting currencies.",
    family: "focused",
    tier: 2,
    durationMs: 25_000,
    cost: { jewellersOrb: 15, alterationOrb: 60 },
    rewardWeights: { jewellersOrb: 4, fusingOrb: 3, alchemyOrb: 2 },
    focusedRewardWeights: { fusingOrb: 4, alchemyOrb: 3, chaosOrb: 1 },
    focusedRewardShare: 0.45,
    baseRewardSeconds: 85,
    minRewardValue: 3600,
    contentTags: ["workshop", "focused"],
    baseShardChance: MAP_BALANCE.baseShardChance,
    wealthScalingFactor: 24,
    unlockRequirement: { currencyId: "jewellersOrb", amount: 20 },
  },
  {
    id: "mirrorMap",
    name: "Fractured Realm",
    description: "A premium map with stronger scaling, elevated shard odds, and top-end payouts.",
    family: "mirror",
    tier: 3,
    durationMs: 30_000,
    cost: { fusingOrb: 12, jewellersOrb: 25 },
    rewardWeights: { alterationOrb: 2, jewellersOrb: 4, fusingOrb: 4, chaosOrb: 2 },
    focusedRewardWeights: { chaosOrb: 3, regalOrb: 2, exaltedOrb: 1 },
    focusedRewardShare: 0.35,
    baseRewardSeconds: 105,
    minRewardValue: 7200,
    contentTags: ["realm", "mirror"],
    baseShardChance: 0.03,
    wealthScalingFactor: 30,
    unlockRequirement: { currencyId: "fusingOrb", amount: 15 },
  },
];

export const baseMapMap: Record<string, BaseMapDefinition> = baseMaps.reduce((acc, mapDef) => {
  acc[mapDef.id] = mapDef;
  return acc;
}, {} as Record<string, BaseMapDefinition>);

export function getRarityLabel(rarity: MapRarity): string {
  switch (rarity) {
    case "normal": return "Normal";
    case "magic": return "Magic";
    case "rare": return "Rare";
  }
}

export function getRarityColor(rarity: MapRarity): string {
  switch (rarity) {
    case "normal": return "#e0e0e0";
    case "magic": return "#8888ff";
    case "rare": return "#ffd700";
  }
}

function getDefaultCraftedMap(baseMapId: string): CraftedMap {
  const baseMap = baseMapMap[baseMapId];
  return {
    baseMapId,
    tier: baseMap?.tier ?? 1,
    quality: 0,
    rarity: "normal",
    affixIds: [],
    contentTags: [...(baseMap?.contentTags ?? [])],
    encounterId: null,
    resolvedStats: resolveAffixStats([]),
  };
}

function getEncounterRarityRank(rarity: MapRarity): number {
  switch (rarity) {
    case "normal": return 0;
    case "magic": return 1;
    case "rare": return 2;
  }
}

export function createNormalMap(baseMapId: string): CraftedMap {
  return getDefaultCraftedMap(baseMapId);
}

export function hydrateCraftedMap(map: Partial<CraftedMap> | null | undefined): CraftedMap | null {
  if (!map?.baseMapId) return null;

  const fallback = getDefaultCraftedMap(map.baseMapId);
  const affixIds = Array.isArray(map.affixIds) ? map.affixIds.filter((id): id is string => typeof id === "string") : [];
  const encounterId = typeof map.encounterId === "string" && map.encounterId in mapEncounterMap
    ? map.encounterId as MapEncounterId
    : fallback.encounterId;

  return {
    baseMapId: map.baseMapId,
    tier: typeof map.tier === "number" ? map.tier : fallback.tier,
    quality: typeof map.quality === "number" ? map.quality : fallback.quality,
    rarity: map.rarity ?? fallback.rarity,
    affixIds,
    contentTags: Array.isArray(map.contentTags) && map.contentTags.length > 0
      ? map.contentTags.filter((tag): tag is MapContentTag => typeof tag === "string")
      : fallback.contentTags,
    encounterId,
    resolvedStats: resolveAffixStats(affixIds),
  };
}

function updateCraftedMap(map: CraftedMap, updates: Partial<CraftedMap>): CraftedMap {
  const affixIds = updates.affixIds ?? map.affixIds;
  return {
    ...map,
    ...updates,
    affixIds,
    resolvedStats: resolveAffixStats(affixIds),
  };
}

export function transmuteCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "normal") return null;
  const affixes = rollNormalAffixes(1 + Math.floor(Math.random() * 2));
  return updateCraftedMap(map, { rarity: "magic", affixIds: affixes.map((affix) => affix.id) });
}

export function augmentCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "magic") return null;
  if (map.affixIds.length >= MAP_BALANCE.magicAffixCount) return null;
  const affix = rollOneNormalAffix(new Set(map.affixIds));
  if (!affix) return null;
  return updateCraftedMap(map, { affixIds: [...map.affixIds, affix.id] });
}

export function alterCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "magic") return null;
  const affixes = rollNormalAffixes(1 + Math.floor(Math.random() * 2));
  return updateCraftedMap(map, { affixIds: affixes.map((affix) => affix.id) });
}

export function regalCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "magic") return null;
  const added = rollNormalAffixes(1 + Math.floor(Math.random() * 2), new Set(map.affixIds));
  return updateCraftedMap(map, { rarity: "rare", affixIds: [...map.affixIds, ...added.map((affix) => affix.id)] });
}

export function chaosCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "rare") return null;
  const affixes = rollNormalAffixes(3 + Math.floor(Math.random() * 2));
  return updateCraftedMap(map, { affixIds: affixes.map((affix) => affix.id) });
}

export function alchemyCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "normal") return null;
  const affixes = rollNormalAffixes(3 + Math.floor(Math.random() * 2));
  return updateCraftedMap(map, { rarity: "rare", affixIds: affixes.map((affix) => affix.id) });
}

export function exaltCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "rare") return null;
  const counts = getAffixCount(map.affixIds);
  if (counts.prefixes >= MAP_BALANCE.maxPrefixes && counts.suffixes >= MAP_BALANCE.maxSuffixes) return null;
  const affix = rollPremiumAffix(new Set(map.affixIds));
  if (!affix) return null;
  if (affix.slot === "prefix" && counts.prefixes >= MAP_BALANCE.maxPrefixes) return null;
  if (affix.slot === "suffix" && counts.suffixes >= MAP_BALANCE.maxSuffixes) return null;
  return updateCraftedMap(map, { affixIds: [...map.affixIds, affix.id] });
}

export type CraftingAction = "transmute" | "augment" | "alter" | "regal" | "chaos" | "alchemy" | "exalt";

export const craftingCosts: Record<CraftingAction, Partial<Record<CurrencyId, number>>> = {
  transmute: { transmutationOrb: 4 },
  augment: { augmentationOrb: 4 },
  alter: { alterationOrb: 4 },
  regal: { regalOrb: 1 },
  chaos: { chaosOrb: 1 },
  alchemy: { alchemyOrb: 1 },
  exalt: { exaltedOrb: 1 },
};

export function canAffordCraft(currencies: CurrencyState, action: CraftingAction): boolean {
  const cost = craftingCosts[action];
  return Object.entries(cost).every(([currencyId, amount]) => Math.floor(currencies[currencyId]) >= (amount ?? 0));
}

export function payCraftCost(currencies: CurrencyState, action: CraftingAction): CurrencyState {
  const next = { ...currencies };
  Object.entries(craftingCosts[action]).forEach(([currencyId, amount]) => {
    next[currencyId] -= amount ?? 0;
  });
  return next;
}

export function getAvailableCraftingActions(map: CraftedMap): CraftingAction[] {
  const actions: CraftingAction[] = [];
  if (map.rarity === "normal") actions.push("transmute", "alchemy");
  if (map.rarity === "magic") {
    if (map.affixIds.length < MAP_BALANCE.magicAffixCount) actions.push("augment");
    actions.push("alter", "regal");
  }
  if (map.rarity === "rare") {
    actions.push("chaos");
    const { prefixes, suffixes } = getAffixCount(map.affixIds);
    if (prefixes < MAP_BALANCE.maxPrefixes || suffixes < MAP_BALANCE.maxSuffixes) actions.push("exalt");
  }
  return actions;
}

export const craftingActionLabels: Record<CraftingAction, string> = {
  transmute: "Transmute",
  augment: "Augment",
  alter: "Alterate",
  regal: "Regal",
  chaos: "Chaos",
  alchemy: "Alch",
  exalt: "Exalt",
};

export const craftingActionDescriptions: Record<CraftingAction, string> = {
  transmute: "Normal -> Magic (1-2 affixes)",
  augment: "Add 1 affix to Magic map",
  alter: "Reroll Magic map affixes",
  regal: "Magic -> Rare (add 1-2 affixes)",
  chaos: "Reroll Rare map affixes",
  alchemy: "Normal -> Rare (3-4 affixes)",
  exalt: "Add 1 premium affix to Rare map",
};

export function isMapUnlocked(mapDef: BaseMapDefinition, currencies: CurrencyState): boolean {
  const requirement = mapDef.unlockRequirement;
  return currencies[requirement.currencyId] >= requirement.amount || false;
}

export function getMapEncounter(encounterId: MapEncounterId | null | undefined): MapEncounterDefinition | null {
  if (!encounterId) return null;
  return mapEncounterMap[encounterId] ?? null;
}

export function isMapEncounterUnlocked(encounter: MapEncounterDefinition, progression: MapEncounterProgression): boolean {
  switch (encounter.unlockRequirement.type) {
    case "mapsCompleted":
      return progression.mapsCompleted >= encounter.unlockRequirement.amount;
    case "totalMirrorShards":
      return progression.totalMirrorShards >= encounter.unlockRequirement.amount;
    case "prestigeCount":
      return progression.prestigeCount >= encounter.unlockRequirement.amount;
  }
}

export function getMapEncounterUnlockText(encounter: MapEncounterDefinition): string {
  switch (encounter.unlockRequirement.type) {
    case "mapsCompleted":
      return `Complete ${encounter.unlockRequirement.amount} map${encounter.unlockRequirement.amount === 1 ? "" : "s"}`;
    case "totalMirrorShards":
      return `Reach ${encounter.unlockRequirement.amount} total shards`;
    case "prestigeCount":
      return `Prestige ${encounter.unlockRequirement.amount} time${encounter.unlockRequirement.amount === 1 ? "" : "s"}`;
  }
}

export function hasMapEncounter(craftedMap: CraftedMap): boolean {
  return craftedMap.encounterId !== null;
}

export function getEncounterRewardTags(craftedMap: CraftedMap): MapEncounterTag[] {
  return getMapEncounter(craftedMap.encounterId)?.tags ?? [];
}

export function getEncounterChain(craftedMap: CraftedMap, progression: MapEncounterProgression): number {
  if (!craftedMap.encounterId) return 0;
  if (progression.lastEncounterId !== craftedMap.encounterId) return 0;
  return Math.min(progression.lastEncounterStreak, MAP_BALANCE.maxEncounterChain);
}

export function getEncounterAdjustedStreak(craftedMap: CraftedMap, streak: number): number {
  const encounter = getMapEncounter(craftedMap.encounterId);
  return streak * (encounter?.streakRewardMultiplier ?? 1);
}

export function getEncounterSpecialization(craftedMap: CraftedMap): MapEncounterSpecialization {
  const encounter = getMapEncounter(craftedMap.encounterId);
  if (!encounter) {
    return {
      rewardMultiplier: 0,
      focusedRewardMultiplier: 0,
      durationMultiplier: 0,
      costMultiplier: 0,
      shardChanceBonus: 0,
      notes: [],
    };
  }

  const affixCount = craftedMap.affixIds.length;
  const rarityRank = getEncounterRarityRank(craftedMap.rarity);
  const extraTags = Math.max(0, craftedMap.contentTags.length - 1);

  switch (encounter.id) {
    case "expedition": {
      const rewardMultiplier = rarityRank * 0.08 + extraTags * 0.05;
      const shardChanceBonus = rarityRank * 0.003 + extraTags * 0.0015;
      return {
        rewardMultiplier,
        focusedRewardMultiplier: 0,
        durationMultiplier: 0,
        costMultiplier: 0,
        shardChanceBonus,
        notes: [
          rarityRank > 0 ? `Rarity adds +${Math.round(rewardMultiplier * 100)}% reward` : "Rare maps improve the route haul",
          `Extra content tags add +${(extraTags * 0.15).toFixed(1)}% shard chance`,
        ],
      };
    }
    case "ritual": {
      const focusedRewardMultiplier = affixCount * 0.12 + (craftedMap.contentTags.includes("focused") ? 0.25 : 0);
      const costMultiplier = affixCount * 0.03;
      return {
        rewardMultiplier: 0,
        focusedRewardMultiplier,
        durationMultiplier: 0,
        costMultiplier,
        shardChanceBonus: 0,
        notes: [
          affixCount > 0 ? `${affixCount} affix${affixCount === 1 ? "" : "es"} feed ritual focus` : "Craft affixes to intensify focused rewards",
          craftedMap.contentTags.includes("focused") ? "Focused maps get an extra ritual spike" : "Focused-tag maps ritualize better",
        ],
      };
    }
    case "delirium": {
      const rewardMultiplier = affixCount * 0.1 + rarityRank * 0.08;
      const durationMultiplier = affixCount * 0.08;
      const shardChanceBonus = rarityRank * 0.0025;
      return {
        rewardMultiplier,
        focusedRewardMultiplier: 0,
        durationMultiplier,
        costMultiplier: 0,
        shardChanceBonus,
        notes: [
          affixCount > 0 ? `Each affix adds +10% reward and +8% time` : "Craft affixes to deepen delirium payout",
          rarityRank > 0 ? "Rarity pushes delirium shard odds" : "Magic and rare maps amplify delirium pressure",
        ],
      };
    }
  }
}

function getMapTierMultiplier(tier: number): number {
  return 1 + Math.max(0, tier - 1) * 0.18;
}

function getMapQualityMultiplier(map: CraftedMap): number {
  return 1 + Math.max(0, map.quality) * 0.05;
}

function getContentMultiplier(tags: MapContentTag[]): number {
  return tags.reduce((total, tag) => total * (mapContentValueMultiplier[tag] ?? 1), 1);
}

function getEncounterRewardMultiplier(craftedMap: CraftedMap): number {
  const encounter = getMapEncounter(craftedMap.encounterId);
  const specialization = getEncounterSpecialization(craftedMap);
  return encounter ? 1 + encounter.rewardMultiplier + specialization.rewardMultiplier : 1;
}

function getEncounterFocusedRewardMultiplier(craftedMap: CraftedMap): number {
  const encounter = getMapEncounter(craftedMap.encounterId);
  const specialization = getEncounterSpecialization(craftedMap);
  return encounter ? 1 + encounter.focusedRewardMultiplier + specialization.focusedRewardMultiplier : 1;
}

function getEncounterDurationMultiplier(craftedMap: CraftedMap): number {
  const encounter = getMapEncounter(craftedMap.encounterId);
  const specialization = getEncounterSpecialization(craftedMap);
  return encounter ? 1 + encounter.durationMultiplier + specialization.durationMultiplier : 1;
}

function getEncounterCostMultiplier(craftedMap: CraftedMap): number {
  const encounter = getMapEncounter(craftedMap.encounterId);
  const specialization = getEncounterSpecialization(craftedMap);
  return encounter ? 1 + encounter.costMultiplier + specialization.costMultiplier : 1;
}

function getRewardValueMultiplier(
  craftedMap: CraftedMap,
  rewardBonus: number,
  deviceEffects?: ResolvedDeviceEffects,
): number {
  const totalBonus = rewardBonus + craftedMap.resolvedStats.rewardMultiplier + (deviceEffects?.rewardMultiplier ?? 0);
  return Math.max(0.35, 1 + totalBonus) * getEncounterRewardMultiplier(craftedMap);
}

function getFocusedValueMultiplier(craftedMap: CraftedMap, deviceEffects?: ResolvedDeviceEffects): number {
  const totalBonus = craftedMap.resolvedStats.focusedRewardMultiplier + (deviceEffects?.focusedRewardMultiplier ?? 0);
  return Math.max(0.25, 1 + totalBonus) * getEncounterFocusedRewardMultiplier(craftedMap);
}

function getWealthRewardFloor(mapDef: BaseMapDefinition, wealthValue: number) {
  if (wealthValue <= 0) return mapDef.minRewardValue;
  return Math.max(mapDef.minRewardValue, Math.floor(Math.sqrt(wealthValue) * mapDef.wealthScalingFactor));
}

function getBaseRewardValue(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  incomePerSecond: number,
  wealthValue: number,
  rewardBonus: number,
  deviceEffects?: ResolvedDeviceEffects,
): number {
  const baselineValue = Math.max(
    mapDef.minRewardValue,
    incomePerSecond * mapDef.baseRewardSeconds,
    getWealthRewardFloor(mapDef, wealthValue),
  );

  return baselineValue
    * getMapTierMultiplier(craftedMap.tier)
    * getMapQualityMultiplier(craftedMap)
    * getContentMultiplier(craftedMap.contentTags)
    * getRewardValueMultiplier(craftedMap, rewardBonus, deviceEffects);
}

function allocateRewardValue(weights: MapRewardWeights, totalValue: number): MapReward {
  const entries = Object.entries(weights).filter(([, weight]) => (weight ?? 0) > 0) as [CurrencyId, number][];
  if (entries.length === 0 || totalValue <= 0) return {};

  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const rewards: MapReward = {};

  entries.forEach(([currencyId, weight]) => {
    const proportionalValue = totalValue * (weight / totalWeight);
    const currencyValue = currencyMap[currencyId].baseValue;
    const amount = Math.max(1, Math.floor(proportionalValue / currencyValue));
    rewards[currencyId] = amount;
  });

  return rewards;
}

function mergeRewards(...rewardSets: MapReward[]): MapReward {
  const merged: MapReward = {};

  rewardSets.forEach((rewardSet) => {
    Object.entries(rewardSet).forEach(([currencyId, amount]) => {
      merged[currencyId] = (merged[currencyId] ?? 0) + (amount ?? 0);
    });
  });

  return merged;
}

export function getResolvedMapCost(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  costReduction: number,
  deviceEffects?: ResolvedDeviceEffects,
): MapCost {
  const costMult = (1 + craftedMap.resolvedStats.costMultiplier + (deviceEffects?.costMultiplier ?? 0))
    * getEncounterCostMultiplier(craftedMap);
  const resolved: MapCost = {};

  Object.entries(mapDef.cost).forEach(([currencyId, amount]) => {
    const adjusted = Math.ceil((amount ?? 0) * Math.max(0.1, costMult) * Math.max(0, 1 - costReduction));
    resolved[currencyId] = adjusted;
  });

  return resolved;
}

export function canAffordMap(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  currencies: CurrencyState,
  costReduction: number,
  deviceEffects?: ResolvedDeviceEffects,
): boolean {
  const resolved = getResolvedMapCost(mapDef, craftedMap, costReduction, deviceEffects);
  return Object.entries(resolved).every(([currencyId, amount]) => Math.floor(currencies[currencyId]) >= (amount ?? 0));
}

export function getResolvedMapDuration(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  speedBonus: number,
  deviceEffects?: ResolvedDeviceEffects,
): number {
  const durationMult = (1 + craftedMap.resolvedStats.durationMultiplier + (deviceEffects?.durationMultiplier ?? 0))
    * getEncounterDurationMultiplier(craftedMap);
  return Math.max(MAP_BALANCE.minDurationMs, Math.round(mapDef.durationMs * Math.max(0.2, durationMult) * Math.max(0, 1 - speedBonus)));
}

export function getMapIncomeSnapshot(currencyProduction: CurrencyProduction): number {
  return getTotalProductionValuePerSecond(currencyProduction);
}

export function getMapRewardPreview(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  incomePerSecond: number,
  wealthValue: number,
  rewardBonus: number,
  deviceEffects?: ResolvedDeviceEffects,
  encounterChain = 0,
): MapRewardPreview {
  const economyFloorValue = getWealthRewardFloor(mapDef, wealthValue);
  const baseRewardValue = getBaseRewardValue(mapDef, craftedMap, incomePerSecond, wealthValue, rewardBonus, deviceEffects);
  const focusedValue = baseRewardValue * mapDef.focusedRewardShare * getFocusedValueMultiplier(craftedMap, deviceEffects);
  const rewards = mergeRewards(
    allocateRewardValue(mapDef.rewardWeights, baseRewardValue),
    allocateRewardValue(mapDef.focusedRewardWeights, focusedValue),
  );

  return {
    totalRewardValue: baseRewardValue + focusedValue,
    economyFloorValue,
    rewards,
    encounterNotes: getEncounterSpecialization(craftedMap).notes,
    encounterChain,
  };
}

export function startMap(
  currencies: CurrencyState,
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  costReduction: number,
  speedBonus: number,
  deviceEffects: ResolvedDeviceEffects,
  incomePerSecond: number,
  wealthValue: number,
  rewardBonus: number,
  shardChanceBonus: number,
  encounterChain: number,
): { currencies: CurrencyState; activeMap: ActiveMapState } | null {
  if (!canAffordMap(mapDef, craftedMap, currencies, costReduction, deviceEffects)) return null;

  const cost = getResolvedMapCost(mapDef, craftedMap, costReduction, deviceEffects);
  const nextCurrencies = { ...currencies };

  Object.entries(cost).forEach(([currencyId, amount]) => {
    nextCurrencies[currencyId] -= amount ?? 0;
  });

  return {
    currencies: nextCurrencies,
    activeMap: {
      craftedMap,
      startedAt: Date.now(),
      durationMs: getResolvedMapDuration(mapDef, craftedMap, speedBonus, deviceEffects),
      deviceEffects,
      incomePerSecond,
      wealthSnapshot: wealthValue,
      rewardBonus,
      shardChanceBonus,
      encounterChain,
    },
  };
}

export function getMapProgress(activeMap: ActiveMapState, now: number): number {
  if (!activeMap) return 0;
  const elapsed = now - activeMap.startedAt;
  return Math.min(1, elapsed / activeMap.durationMs);
}

export function isMapComplete(activeMap: ActiveMapState, now: number): boolean {
  if (!activeMap) return false;
  return now - activeMap.startedAt >= activeMap.durationMs;
}

export function completeMap(mapDef: BaseMapDefinition, activeMap: NonNullable<ActiveMapState>): MapCompletionResult {
  const specialization = getEncounterSpecialization(activeMap.craftedMap);
  const preview = getMapRewardPreview(
    mapDef,
    activeMap.craftedMap,
    activeMap.incomePerSecond,
    activeMap.wealthSnapshot,
    activeMap.rewardBonus,
    activeMap.deviceEffects,
    activeMap.encounterChain,
  );

  const bonusRewardChance = activeMap.deviceEffects.bonusRewardChance;
  const rewards = { ...preview.rewards };
  const bonusRewardTriggered = bonusRewardChance > 0 && Math.random() < bonusRewardChance;

  if (bonusRewardTriggered) {
    const rewardKeys = Object.keys(rewards);
    if (rewardKeys.length > 0) {
      const bonusCurrencyId = rewardKeys[Math.floor(Math.random() * rewardKeys.length)];
      rewards[bonusCurrencyId] = Math.max(1, Math.floor((rewards[bonusCurrencyId] ?? 0) * 1.5));
    }
  }

  const shardChance = Math.min(
    MAP_BALANCE.maxShardChance,
    mapDef.baseShardChance
      + activeMap.craftedMap.resolvedStats.shardChanceBonus
      + activeMap.deviceEffects.shardChanceBonus
      + specialization.shardChanceBonus
      + (getMapEncounter(activeMap.craftedMap.encounterId)?.shardChanceBonus ?? 0)
      + activeMap.shardChanceBonus,
  );
  const shardDropped = Math.random() < shardChance;
  const shardAmount = shardDropped ? 1 : 0;

  return {
    baseMapId: mapDef.id,
    rarity: activeMap.craftedMap.rarity,
    encounterId: activeMap.craftedMap.encounterId,
    encounterName: getMapEncounter(activeMap.craftedMap.encounterId)?.name ?? null,
    encounterChain: activeMap.encounterChain,
    rewards,
    shardDropped,
    shardAmount,
    shardChance,
    bonusRewardTriggered,
    totalRewardValue: preview.totalRewardValue,
  };
}

export function applyMapRewards(currencies: CurrencyState, result: MapCompletionResult): CurrencyState {
  const nextCurrencies = { ...currencies };
  Object.entries(result.rewards).forEach(([currencyId, amount]) => {
    nextCurrencies[currencyId] += amount ?? 0;
  });
  return nextCurrencies;
}

export function getMapTimeRemaining(activeMap: ActiveMapState, now: number): number {
  if (!activeMap) return 0;
  return Math.max(0, activeMap.durationMs - (now - activeMap.startedAt));
}

export function getAffixDisplayName(affixId: string): string {
  return affixMap[affixId]?.name ?? affixId;
}

export function getAffixDescription(affixId: string): string {
  return affixMap[affixId]?.description ?? "";
}

export function applyCraftingAction(map: CraftedMap, action: CraftingAction): CraftedMap | null {
  switch (action) {
    case "transmute": return transmuteCraftedMap(map);
    case "augment": return augmentCraftedMap(map);
    case "alter": return alterCraftedMap(map);
    case "regal": return regalCraftedMap(map);
    case "chaos": return chaosCraftedMap(map);
    case "alchemy": return alchemyCraftedMap(map);
    case "exalt": return exaltCraftedMap(map);
  }
}

