import type { CurrencyId, CurrencyState } from "./currencies";
import {
  rollNormalAffixes,
  rollOneNormalAffix,
  rollPremiumAffix,
  resolveAffixStats,
  getAffixCount,
  affixMap,
  type ResolvedAffixStats,
} from "./mapAffixes";

// ── Map Types ──

export type MapFamily = "currency" | "focused" | "mirror";
export type MapRarity = "normal" | "magic" | "rare";

export type MapCost = Partial<Record<CurrencyId, number>>;
export type MapReward = Partial<Record<CurrencyId, number>>;

export type BaseMapDefinition = {
  id: string;
  name: string;
  description: string;
  family: MapFamily;
  durationMs: number;
  cost: MapCost;
  rewards: MapReward;
  focusedRewards: MapReward;
  baseShardChance: number;
  unlockRequirement: { currencyId: CurrencyId; amount: number };
};

export type CraftedMap = {
  baseMapId: string;
  rarity: MapRarity;
  affixIds: string[];
  resolvedStats: ResolvedAffixStats;
};

export type ActiveMapState = {
  craftedMap: CraftedMap;
  startedAt: number;
  durationMs: number;
} | null;

export type MapCompletionResult = {
  baseMapId: string;
  rarity: MapRarity;
  rewards: MapReward;
  shardDropped: boolean;
  shardAmount: number;
  shardChance: number;
};

// ── Balance Constants ──

export const MAP_BALANCE = {
  baseShardChance: 0.01,
  maxShardChance: 0.05,
  magicAffixCount: 2,
  rareAffixCount: 4,
  maxPrefixes: 2,
  maxSuffixes: 2,
} as const;

// ── Base Map Definitions ──

export const baseMaps: BaseMapDefinition[] = [
  {
    id: "currencyMap",
    name: "Currency Stash",
    description: "A well-stocked hideout. Grants a burst of mid-tier currencies.",
    family: "currency",
    durationMs: 15_000,
    cost: { alterationOrb: 40, augmentationOrb: 80 },
    rewards: { transmutationOrb: 400, augmentationOrb: 160, alterationOrb: 60 },
    focusedRewards: {},
    baseShardChance: MAP_BALANCE.baseShardChance,
    unlockRequirement: { currencyId: "alterationOrb", amount: 50 },
  },
  {
    id: "focusedMap",
    name: "Jeweller's Workshop",
    description: "A focused expedition targeting higher-value orbs.",
    family: "focused",
    durationMs: 25_000,
    cost: { jewellersOrb: 15, alterationOrb: 60 },
    rewards: { jewellersOrb: 25, fusingOrb: 14, alchemyOrb: 5 },
    focusedRewards: { fusingOrb: 8, alchemyOrb: 4 },
    baseShardChance: MAP_BALANCE.baseShardChance,
    unlockRequirement: { currencyId: "jewellersOrb", amount: 20 },
  },
  {
    id: "mirrorMap",
    name: "Fractured Realm",
    description: "A strange dimension. Higher shard chance, moderate currency rewards.",
    family: "mirror",
    durationMs: 30_000,
    cost: { fusingOrb: 12, jewellersOrb: 25 },
    rewards: { alterationOrb: 40, jewellersOrb: 10, fusingOrb: 5 },
    focusedRewards: {},
    baseShardChance: 0.03,
    unlockRequirement: { currencyId: "fusingOrb", amount: 15 },
  },
];

export const baseMapMap: Record<string, BaseMapDefinition> = baseMaps.reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {} as Record<string, BaseMapDefinition>);

// ── Map Rarity Helpers ──

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

// ── Crafted Map Creation ──

export function createNormalMap(baseMapId: string): CraftedMap {
  return {
    baseMapId,
    rarity: "normal",
    affixIds: [],
    resolvedStats: resolveAffixStats([]),
  };
}

// ── Crafting Actions ──

/** Transmutation: normal -> magic (roll 1-2 normal affixes) */
export function transmuteCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "normal") return null;
  const affixes = rollNormalAffixes(1 + Math.floor(Math.random() * 2));
  const affixIds = affixes.map((a) => a.id);
  return { ...map, rarity: "magic", affixIds, resolvedStats: resolveAffixStats(affixIds) };
}

/** Augmentation: add 1 normal affix to magic map (if room) */
export function augmentCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "magic") return null;
  if (map.affixIds.length >= MAP_BALANCE.magicAffixCount) return null;
  const existing = new Set(map.affixIds);
  const affix = rollOneNormalAffix(existing);
  if (!affix) return null;
  const affixIds = [...map.affixIds, affix.id];
  return { ...map, affixIds, resolvedStats: resolveAffixStats(affixIds) };
}

/** Alteration: reroll magic map affixes (1-2 new normal affixes) */
export function alterCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "magic") return null;
  const affixes = rollNormalAffixes(1 + Math.floor(Math.random() * 2));
  const affixIds = affixes.map((a) => a.id);
  return { ...map, affixIds, resolvedStats: resolveAffixStats(affixIds) };
}

/** Regal: magic -> rare (add 1-2 more normal affixes) */
export function regalCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "magic") return null;
  const existing = new Set(map.affixIds);
  const added = rollNormalAffixes(1 + Math.floor(Math.random() * 2), existing);
  const affixIds = [...map.affixIds, ...added.map((a) => a.id)];
  return { ...map, rarity: "rare", affixIds, resolvedStats: resolveAffixStats(affixIds) };
}

/** Chaos: reroll rare map affixes (3-4 new normal affixes) */
export function chaosCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "rare") return null;
  const affixes = rollNormalAffixes(3 + Math.floor(Math.random() * 2));
  const affixIds = affixes.map((a) => a.id);
  return { ...map, affixIds, resolvedStats: resolveAffixStats(affixIds) };
}

/** Alchemy: normal -> rare (roll 3-4 normal affixes) */
export function alchemyCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "normal") return null;
  const affixes = rollNormalAffixes(3 + Math.floor(Math.random() * 2));
  const affixIds = affixes.map((a) => a.id);
  return { ...map, rarity: "rare", affixIds, resolvedStats: resolveAffixStats(affixIds) };
}

/** Exalted: add 1 premium affix to rare map (if room) */
export function exaltCraftedMap(map: CraftedMap): CraftedMap | null {
  if (map.rarity !== "rare") return null;
  const counts = getAffixCount(map.affixIds);
  if (counts.prefixes >= MAP_BALANCE.maxPrefixes && counts.suffixes >= MAP_BALANCE.maxSuffixes) return null;
  const existing = new Set(map.affixIds);
  const affix = rollPremiumAffix(existing);
  if (!affix) return null;
  if (affix.slot === "prefix" && counts.prefixes >= MAP_BALANCE.maxPrefixes) return null;
  if (affix.slot === "suffix" && counts.suffixes >= MAP_BALANCE.maxSuffixes) return null;
  const affixIds = [...map.affixIds, affix.id];
  return { ...map, affixIds, resolvedStats: resolveAffixStats(affixIds) };
}

// ── Crafting Currency Costs ──

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
  return Object.entries(cost).every(([cid, amount]) =>
    Math.floor(currencies[cid as CurrencyId]) >= (amount ?? 0),
  );
}

export function payCraftCost(currencies: CurrencyState, action: CraftingAction): CurrencyState {
  const cost = craftingCosts[action];
  const next = { ...currencies };
  Object.entries(cost).forEach(([cid, amount]) => {
    next[cid as CurrencyId] -= amount ?? 0;
  });
  return next;
}

export function getAvailableCraftingActions(map: CraftedMap): CraftingAction[] {
  const actions: CraftingAction[] = [];
  if (map.rarity === "normal") {
    actions.push("transmute", "alchemy");
  }
  if (map.rarity === "magic") {
    if (map.affixIds.length < MAP_BALANCE.magicAffixCount) actions.push("augment");
    actions.push("alter", "regal");
  }
  if (map.rarity === "rare") {
    actions.push("chaos");
    const { prefixes, suffixes } = getAffixCount(map.affixIds);
    if (prefixes < MAP_BALANCE.maxPrefixes || suffixes < MAP_BALANCE.maxSuffixes) {
      actions.push("exalt");
    }
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
  transmute: "Normal \u2192 Magic (1-2 affixes)",
  augment: "Add 1 affix to Magic map",
  alter: "Reroll Magic map affixes",
  regal: "Magic \u2192 Rare (add 1-2 affixes)",
  chaos: "Reroll Rare map affixes",
  alchemy: "Normal \u2192 Rare (3-4 affixes)",
  exalt: "Add 1 premium affix to Rare map",
};

// ── Map Logic ──

export function isMapUnlocked(mapDef: BaseMapDefinition, currencies: CurrencyState): boolean {
  const req = mapDef.unlockRequirement;
  return currencies[req.currencyId] >= req.amount || false;
}

export function getResolvedMapCost(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  costReduction: number,
): MapCost {
  const costMult = 1 + craftedMap.resolvedStats.costMultiplier;
  const resolved: MapCost = {};
  Object.entries(mapDef.cost).forEach(([cid, amount]) => {
    const adjusted = Math.ceil((amount ?? 0) * costMult * Math.max(0, 1 - costReduction));
    resolved[cid as CurrencyId] = adjusted;
  });
  return resolved;
}

export function canAffordMap(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  currencies: CurrencyState,
  costReduction: number,
): boolean {
  const resolved = getResolvedMapCost(mapDef, craftedMap, costReduction);
  return Object.entries(resolved).every(([cid, amount]) =>
    Math.floor(currencies[cid as CurrencyId]) >= (amount ?? 0),
  );
}

export function getResolvedMapDuration(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  speedBonus: number,
): number {
  const durationMult = 1 + craftedMap.resolvedStats.durationMultiplier;
  return Math.max(5000, Math.round(mapDef.durationMs * durationMult * Math.max(0, 1 - speedBonus)));
}

export function startMap(
  currencies: CurrencyState,
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  costReduction: number,
  speedBonus: number,
): { currencies: CurrencyState; activeMap: ActiveMapState } | null {
  if (!canAffordMap(mapDef, craftedMap, currencies, costReduction)) return null;

  const cost = getResolvedMapCost(mapDef, craftedMap, costReduction);
  const next = { ...currencies };
  Object.entries(cost).forEach(([cid, amount]) => {
    next[cid as CurrencyId] -= amount ?? 0;
  });

  const adjustedDuration = getResolvedMapDuration(mapDef, craftedMap, speedBonus);
  return {
    currencies: next,
    activeMap: {
      craftedMap,
      startedAt: Date.now(),
      durationMs: adjustedDuration,
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

export function completeMap(
  mapDef: BaseMapDefinition,
  craftedMap: CraftedMap,
  rewardBonus: number,
): MapCompletionResult {
  const stats = craftedMap.resolvedStats;
  const rewardMult = 1 + stats.rewardMultiplier + rewardBonus;
  const focusedRewardMult = 1 + stats.focusedRewardMultiplier + rewardBonus;

  const rewards: MapReward = {};
  Object.entries(mapDef.rewards).forEach(([cid, amount]) => {
    rewards[cid as CurrencyId] = Math.floor((amount ?? 0) * rewardMult);
  });
  Object.entries(mapDef.focusedRewards).forEach(([cid, amount]) => {
    rewards[cid as CurrencyId] = (rewards[cid as CurrencyId] ?? 0) + Math.floor((amount ?? 0) * focusedRewardMult);
  });

  const shardChance = Math.min(MAP_BALANCE.maxShardChance, mapDef.baseShardChance + stats.shardChanceBonus);
  const shardDropped = Math.random() < shardChance;
  const shardAmount = shardDropped ? 1 : 0;

  return { baseMapId: mapDef.id, rarity: craftedMap.rarity, rewards, shardDropped, shardAmount, shardChance };
}

export function applyMapRewards(currencies: CurrencyState, result: MapCompletionResult): CurrencyState {
  const next = { ...currencies };
  Object.entries(result.rewards).forEach(([cid, amount]) => {
    next[cid as CurrencyId] += amount ?? 0;
  });
  return next;
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
