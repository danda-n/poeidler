import type { CurrencyId, CurrencyState } from "./currencies";

// ── Map Types ──

export type MapFamily = "currency" | "focused" | "mirror";

export type MapCost = Partial<Record<CurrencyId, number>>;
export type MapReward = Partial<Record<CurrencyId, number>>;

export type MapDefinition = {
  id: string;
  name: string;
  description: string;
  family: MapFamily;
  durationMs: number;
  cost: MapCost;
  rewards: MapReward;
  shardReward: number;
  unlockRequirement: { currencyId: CurrencyId; amount: number };
};

export type ActiveMapState = {
  mapId: string;
  startedAt: number;
  durationMs: number;
} | null;

export type MapCompletionResult = {
  mapId: string;
  rewards: MapReward;
  shardReward: number;
};

// ── Balance Constants ──

export const MAP_BALANCE = {
  currencyRewardMultiplier: 1.0,
  focusedRewardMultiplier: 1.0,
  mirrorShardBase: 1,
  mirrorMapShardMultiplier: 3,
  mapSpeedTalentPerRank: 0.05,
  mapRewardTalentPerRank: 0.10,
  mapCostReductionPerRank: 0.08,
  pathMemoryBonusPerStack: 0.05,
  pathMemoryMaxStacks: 5,
} as const;

// ── Map Definitions ──

export const maps: MapDefinition[] = [
  {
    id: "currencyMap",
    name: "Currency Stash",
    description: "A well-stocked hideout. Grants a burst of mid-tier currencies.",
    family: "currency",
    durationMs: 15_000,
    cost: { alterationOrb: 50, augmentationOrb: 100 },
    rewards: { transmutationOrb: 200, augmentationOrb: 80, alterationOrb: 30 },
    shardReward: 1,
    unlockRequirement: { currencyId: "alterationOrb", amount: 50 },
  },
  {
    id: "focusedMap",
    name: "Jeweller's Workshop",
    description: "A focused expedition targeting higher-value orbs.",
    family: "focused",
    durationMs: 25_000,
    cost: { jewellersOrb: 20, alterationOrb: 80 },
    rewards: { jewellersOrb: 15, fusingOrb: 8, alchemyOrb: 3 },
    shardReward: 2,
    unlockRequirement: { currencyId: "jewellersOrb", amount: 20 },
  },
  {
    id: "mirrorMap",
    name: "Fractured Realm",
    description: "A strange dimension. Lower currency rewards, but rich in Mirror Shards.",
    family: "mirror",
    durationMs: 30_000,
    cost: { fusingOrb: 15, jewellersOrb: 30 },
    rewards: { alterationOrb: 20, jewellersOrb: 5 },
    shardReward: 6,
    unlockRequirement: { currencyId: "fusingOrb", amount: 15 },
  },
];

export const mapMap: Record<string, MapDefinition> = maps.reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {} as Record<string, MapDefinition>);

// ── Map Logic ──

export function isMapUnlocked(mapDef: MapDefinition, currencies: CurrencyState): boolean {
  const req = mapDef.unlockRequirement;
  return currencies[req.currencyId] >= req.amount || false;
}

export function canAffordMap(mapDef: MapDefinition, currencies: CurrencyState, costReduction: number): boolean {
  return Object.entries(mapDef.cost).every(([currencyId, amount]) => {
    const reduced = Math.ceil((amount ?? 0) * Math.max(0, 1 - costReduction));
    return Math.floor(currencies[currencyId as CurrencyId]) >= reduced;
  });
}

export function payMapCost(currencies: CurrencyState, mapDef: MapDefinition, costReduction: number): CurrencyState {
  const next = { ...currencies };
  Object.entries(mapDef.cost).forEach(([currencyId, amount]) => {
    const reduced = Math.ceil((amount ?? 0) * Math.max(0, 1 - costReduction));
    next[currencyId as CurrencyId] -= reduced;
  });
  return next;
}

export function startMap(
  currencies: CurrencyState,
  mapDef: MapDefinition,
  costReduction: number,
  speedBonus: number,
): { currencies: CurrencyState; activeMap: ActiveMapState } | null {
  if (!canAffordMap(mapDef, currencies, costReduction)) {
    return null;
  }

  const adjustedDuration = Math.max(5000, Math.round(mapDef.durationMs * Math.max(0, 1 - speedBonus)));
  return {
    currencies: payMapCost(currencies, mapDef, costReduction),
    activeMap: {
      mapId: mapDef.id,
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
  mapDef: MapDefinition,
  rewardBonus: number,
  shardMultiplier: number,
): MapCompletionResult {
  const rewards: MapReward = {};
  Object.entries(mapDef.rewards).forEach(([currencyId, amount]) => {
    rewards[currencyId as CurrencyId] = Math.floor((amount ?? 0) * (1 + rewardBonus));
  });

  const shardReward = Math.floor(mapDef.shardReward * shardMultiplier);

  return { mapId: mapDef.id, rewards, shardReward };
}

export function applyMapRewards(currencies: CurrencyState, result: MapCompletionResult): CurrencyState {
  const next = { ...currencies };
  Object.entries(result.rewards).forEach(([currencyId, amount]) => {
    next[currencyId as CurrencyId] += amount ?? 0;
  });
  return next;
}

export function getMapTimeRemaining(activeMap: ActiveMapState, now: number): number {
  if (!activeMap) return 0;
  return Math.max(0, activeMap.durationMs - (now - activeMap.startedAt));
}
