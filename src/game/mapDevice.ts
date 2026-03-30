import type { CurrencyId, CurrencyState } from "./currencies";

export type DeviceModTier = "normal" | "magic" | "rare" | "premium";
export type DeviceModCategory = "reward" | "duration" | "utility" | "synergy";
export type DeviceModDeltaType = "reward" | "focusedReward" | "duration" | "cost" | "bonusReward" | "shardChance";

export type DeviceModEffects = {
  rewardMultiplier?: number;
  focusedRewardMultiplier?: number;
  durationMultiplier?: number;
  costMultiplier?: number;
  bonusRewardChance?: number;
  shardChanceBonus?: number;
};

export type DeviceModDefinition = {
  id: string;
  name: string;
  summary: string;
  description: string;
  tier: DeviceModTier;
  category: DeviceModCategory;
  effects: DeviceModEffects;
  playstyle: string;
};

export type DeviceModDelta = {
  type: DeviceModDeltaType;
  label: string;
  value: number;
};

export type ResolvedDeviceEffects = {
  rewardMultiplier: number;
  focusedRewardMultiplier: number;
  durationMultiplier: number;
  costMultiplier: number;
  bonusRewardChance: number;
  shardChanceBonus: number;
};

export const LOADOUT_MAX_SLOTS = 3;

export type DeviceLoadout = {
  modIds: string[];
};

export const emptyDeviceLoadout: DeviceLoadout = { modIds: [] };

export type MapDeviceState = Record<string, never>;
export const initialMapDeviceState: MapDeviceState = {} as MapDeviceState;

export const deviceModPool: DeviceModDefinition[] = [
  {
    id: "amplifier",
    name: "Amplifier",
    summary: "Broad loot push",
    description: "Higher raw rewards with no extra side conditions.",
    tier: "normal",
    category: "reward",
    playstyle: "Safe default when you just want a richer payout.",
    effects: { rewardMultiplier: 0.2 },
  },
  {
    id: "concentrator",
    name: "Concentrator",
    summary: "Focused outcome",
    description: "Pushes targeted rewards harder than general loot.",
    tier: "normal",
    category: "reward",
    playstyle: "Best when the selected map or encounter already leans focused.",
    effects: { focusedRewardMultiplier: 0.25 },
  },
  {
    id: "accelerator",
    name: "Accelerator",
    summary: "Faster cycle",
    description: "Shortens run duration so the device asks for less attention.",
    tier: "normal",
    category: "duration",
    playstyle: "Useful for low-friction farming or queue throughput.",
    effects: { durationMultiplier: -0.15 },
  },
  {
    id: "economist",
    name: "Economist",
    summary: "Cheaper entry",
    description: "Cuts map cost to keep repeated runs affordable.",
    tier: "normal",
    category: "utility",
    playstyle: "Good when the atlas cost curve is the main pressure point.",
    effects: { costMultiplier: -0.12 },
  },
  {
    id: "fragmentLens",
    name: "Fragment Lens",
    summary: "Shard hunt",
    description: "Raises shard odds without changing duration or base rewards.",
    tier: "normal",
    category: "utility",
    playstyle: "Pairs well with longer-value setups when you care about shards.",
    effects: { shardChanceBonus: 0.005 },
  },
  {
    id: "resonator",
    name: "Resonator",
    summary: "Loot for price",
    description: "A straightforward trade: richer rewards in exchange for a more expensive activation.",
    tier: "magic",
    category: "reward",
    playstyle: "Use when you can comfortably bankroll stronger payouts.",
    effects: { rewardMultiplier: 0.35, costMultiplier: 0.2 },
  },
  {
    id: "calibrator",
    name: "Calibrator",
    summary: "Focused but slower",
    description: "More focused value at the cost of longer map time.",
    tier: "magic",
    category: "duration",
    playstyle: "Works best on focused maps or Ritual setups.",
    effects: { focusedRewardMultiplier: 0.4, durationMultiplier: 0.15 },
  },
  {
    id: "prismaticCore",
    name: "Prismatic Core",
    summary: "Shards over loot",
    description: "Leans away from raw rewards and toward shard pressure.",
    tier: "magic",
    category: "synergy",
    playstyle: "Great when prestige or shard growth matters more than stash value.",
    effects: { shardChanceBonus: 0.01, rewardMultiplier: -0.1 },
  },
  {
    id: "prospector",
    name: "Prospector",
    summary: "Spike chance",
    description: "Adds a shot at bonus rewards, but makes each run cost more.",
    tier: "magic",
    category: "utility",
    playstyle: "A swingier option for players who want upside without longer runs.",
    effects: { bonusRewardChance: 0.12, costMultiplier: 0.1 },
  },
  {
    id: "gildedFrame",
    name: "Gilded Frame",
    summary: "Heavy loot push",
    description: "Large raw reward gain with a meaningful price increase.",
    tier: "rare",
    category: "reward",
    playstyle: "Pure value play if your stash can absorb the entry cost.",
    effects: { rewardMultiplier: 0.5, costMultiplier: 0.3 },
  },
  {
    id: "eternalFocus",
    name: "Eternal Focus",
    summary: "Targeted jackpot",
    description: "Concentrates value into focused rewards with a premium activation cost.",
    tier: "rare",
    category: "reward",
    playstyle: "Choose this when your route is built around focused outputs.",
    effects: { focusedRewardMultiplier: 0.6, costMultiplier: 0.25 },
  },
  {
    id: "transcendentLens",
    name: "Transcendent Lens",
    summary: "All-in payout",
    description: "The most explosive broad payout option, but expensive and commitment-heavy.",
    tier: "premium",
    category: "reward",
    playstyle: "Best saved for premium maps or already-strong reward setups.",
    effects: { rewardMultiplier: 0.7, focusedRewardMultiplier: 0.5, costMultiplier: 0.4 },
  },
  {
    id: "mirrorResonator",
    name: "Mirror Resonator",
    summary: "Shard engine",
    description: "Converts some focused value into shard pressure while still improving broad rewards.",
    tier: "premium",
    category: "synergy",
    playstyle: "Excellent for mirror-oriented runs, prestige prep, and shard-focused planning.",
    effects: { shardChanceBonus: 0.02, rewardMultiplier: 0.35, focusedRewardMultiplier: -0.2 },
  },
];

export const deviceModMap: Record<string, DeviceModDefinition> = deviceModPool.reduce((acc, mod) => {
  acc[mod.id] = mod;
  return acc;
}, {} as Record<string, DeviceModDefinition>);

export const modLoadoutCostByTier: Record<DeviceModTier, Partial<Record<CurrencyId, number>>> = {
  normal: { alterationOrb: 5 },
  magic: { chaosOrb: 1 },
  rare: { regalOrb: 1 },
  premium: { exaltedOrb: 1 },
};

export function getModLoadoutCost(modId: string): Partial<Record<CurrencyId, number>> {
  const definition = deviceModMap[modId];
  if (!definition) return {};
  return modLoadoutCostByTier[definition.tier];
}

export function getLoadoutTotalCost(loadout: DeviceLoadout): Partial<Record<CurrencyId, number>> {
  const total: Partial<Record<CurrencyId, number>> = {};
  for (const modId of loadout.modIds) {
    const cost = getModLoadoutCost(modId);
    for (const [currencyId, amount] of Object.entries(cost)) {
      total[currencyId] = (total[currencyId] ?? 0) + (amount ?? 0);
    }
  }
  return total;
}

export function canAffordLoadout(currencies: CurrencyState, loadout: DeviceLoadout): boolean {
  const cost = getLoadoutTotalCost(loadout);
  return Object.entries(cost).every(([currencyId, amount]) => Math.floor(currencies[currencyId]) >= (amount ?? 0));
}

export function payLoadoutCost(currencies: CurrencyState, loadout: DeviceLoadout): CurrencyState {
  const cost = getLoadoutTotalCost(loadout);
  const next = { ...currencies };
  for (const [currencyId, amount] of Object.entries(cost)) {
    next[currencyId] -= amount ?? 0;
  }
  return next;
}

export function canAddModToLoadout(loadout: DeviceLoadout, modId: string): boolean {
  return loadout.modIds.length < LOADOUT_MAX_SLOTS && !loadout.modIds.includes(modId);
}

export function addModToLoadout(loadout: DeviceLoadout, modId: string): DeviceLoadout {
  if (!canAddModToLoadout(loadout, modId)) return loadout;
  return { modIds: [...loadout.modIds, modId] };
}

export function removeModFromLoadout(loadout: DeviceLoadout, modId: string): DeviceLoadout {
  return { modIds: loadout.modIds.filter((id) => id !== modId) };
}

export function resolveLoadoutEffects(loadout: DeviceLoadout): ResolvedDeviceEffects {
  const result: ResolvedDeviceEffects = {
    rewardMultiplier: 0,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0,
    bonusRewardChance: 0,
    shardChanceBonus: 0,
  };

  for (const modId of loadout.modIds) {
    const definition = deviceModMap[modId];
    if (!definition) continue;
    const effects = definition.effects;
    result.rewardMultiplier += effects.rewardMultiplier ?? 0;
    result.focusedRewardMultiplier += effects.focusedRewardMultiplier ?? 0;
    result.durationMultiplier += effects.durationMultiplier ?? 0;
    result.costMultiplier += effects.costMultiplier ?? 0;
    result.bonusRewardChance += effects.bonusRewardChance ?? 0;
    result.shardChanceBonus += effects.shardChanceBonus ?? 0;
  }

  return result;
}

export function resetDeviceModifiers(_device: MapDeviceState): MapDeviceState {
  return initialMapDeviceState;
}

export function getModTierColor(tier: DeviceModTier): string {
  switch (tier) {
    case "normal": return "#e0e0e0";
    case "magic": return "#8888ff";
    case "rare": return "#ffd700";
    case "premium": return "#ff8844";
  }
}

export function getModTierLabel(tier: DeviceModTier): string {
  switch (tier) {
    case "normal": return "Normal";
    case "magic": return "Magic";
    case "rare": return "Rare";
    case "premium": return "Premium";
  }
}

export function getModCategoryLabel(category: DeviceModCategory): string {
  switch (category) {
    case "reward": return "Reward";
    case "duration": return "Duration / Risk";
    case "utility": return "Utility";
    case "synergy": return "Special / Synergy";
  }
}

export function getModCategoryDescription(category: DeviceModCategory): string {
  switch (category) {
    case "reward": return "Boost payout directly, usually with a price or focus angle.";
    case "duration": return "Shift run pace, tempo, or time pressure.";
    case "utility": return "Smooth costs, shard odds, or payout consistency.";
    case "synergy": return "Sharper directional choices for focused, shard, or prestige plans.";
  }
}

export function getDeviceModDeltas(definition: DeviceModDefinition): DeviceModDelta[] {
  const deltas: DeviceModDelta[] = [
    { type: "reward", label: "Base rewards", value: definition.effects.rewardMultiplier ?? 0 },
    { type: "focusedReward", label: "Focused rewards", value: definition.effects.focusedRewardMultiplier ?? 0 },
    { type: "duration", label: "Run time", value: definition.effects.durationMultiplier ?? 0 },
    { type: "cost", label: "Map cost", value: definition.effects.costMultiplier ?? 0 },
    { type: "bonusReward", label: "Bonus reward chance", value: definition.effects.bonusRewardChance ?? 0 },
    { type: "shardChance", label: "Shard chance", value: definition.effects.shardChanceBonus ?? 0 }
  ];

  return deltas.filter((delta) => Math.abs(delta.value) > 0.0001);
}


