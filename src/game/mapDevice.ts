import type { CurrencyId, CurrencyState } from "./currencies";

// ── Types ──

export type DeviceModTier = "normal" | "magic" | "rare" | "premium";

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
  description: string;
  tier: DeviceModTier;
  effects: DeviceModEffects;
};

export type ResolvedDeviceEffects = {
  rewardMultiplier: number;
  focusedRewardMultiplier: number;
  durationMultiplier: number;
  costMultiplier: number;
  bonusRewardChance: number;
  shardChanceBonus: number;
};

// ── Per-run Loadout ──

export const LOADOUT_MAX_SLOTS = 3;

/** Device loadout for a single map run. Consumed when the map starts. */
export type DeviceLoadout = {
  modIds: string[];
};

export const emptyDeviceLoadout: DeviceLoadout = { modIds: [] };

// Persistent device state — kept as an empty marker for save/prestige compatibility.
export type MapDeviceState = Record<string, never>;
export const initialMapDeviceState: MapDeviceState = {} as MapDeviceState;

// ── Modifier Pool ──

export const deviceModPool: DeviceModDefinition[] = [
  // Normal tier
  { id: "amplifier", name: "Amplifier", description: "+20% rewards", tier: "normal", effects: { rewardMultiplier: 0.20 } },
  { id: "concentrator", name: "Concentrator", description: "+25% focused rewards", tier: "normal", effects: { focusedRewardMultiplier: 0.25 } },
  { id: "accelerator", name: "Accelerator", description: "-15% duration", tier: "normal", effects: { durationMultiplier: -0.15 } },
  { id: "economist", name: "Economist", description: "-12% map cost", tier: "normal", effects: { costMultiplier: -0.12 } },
  { id: "fragmentLens", name: "Fragment Lens", description: "+0.5% shard chance", tier: "normal", effects: { shardChanceBonus: 0.005 } },

  // Magic tier
  { id: "resonator", name: "Resonator", description: "+35% rewards, +20% cost", tier: "magic", effects: { rewardMultiplier: 0.35, costMultiplier: 0.20 } },
  { id: "calibrator", name: "Calibrator", description: "+40% focused rewards, +15% duration", tier: "magic", effects: { focusedRewardMultiplier: 0.40, durationMultiplier: 0.15 } },
  { id: "prismaticCore", name: "Prismatic Core", description: "+1% shard chance, -10% rewards", tier: "magic", effects: { shardChanceBonus: 0.01, rewardMultiplier: -0.10 } },
  { id: "prospector", name: "Prospector", description: "12% bonus reward chance, +10% cost", tier: "magic", effects: { bonusRewardChance: 0.12, costMultiplier: 0.10 } },

  // Rare tier
  { id: "gildedFrame", name: "Gilded Frame", description: "+50% rewards, +30% cost", tier: "rare", effects: { rewardMultiplier: 0.50, costMultiplier: 0.30 } },
  { id: "eternalFocus", name: "Eternal Focus", description: "+60% focused, +25% cost", tier: "rare", effects: { focusedRewardMultiplier: 0.60, costMultiplier: 0.25 } },

  // Premium tier
  { id: "transcendentLens", name: "Transcendent Lens", description: "+70% rewards, +50% focused, +40% cost", tier: "premium", effects: { rewardMultiplier: 0.70, focusedRewardMultiplier: 0.50, costMultiplier: 0.40 } },
  { id: "mirrorResonator", name: "Mirror Resonator", description: "+2% shard, +35% rewards, -20% focused", tier: "premium", effects: { shardChanceBonus: 0.02, rewardMultiplier: 0.35, focusedRewardMultiplier: -0.20 } },
];

export const deviceModMap: Record<string, DeviceModDefinition> = deviceModPool.reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {} as Record<string, DeviceModDefinition>);

// ── Loadout Costs ──

/** Currency cost to include a mod in this run's loadout */
export const modLoadoutCostByTier: Record<DeviceModTier, Partial<Record<CurrencyId, number>>> = {
  normal: { alterationOrb: 5 },
  magic: { chaosOrb: 1 },
  rare: { regalOrb: 1 },
  premium: { exaltedOrb: 1 },
};

export function getModLoadoutCost(modId: string): Partial<Record<CurrencyId, number>> {
  const def = deviceModMap[modId];
  if (!def) return {};
  return modLoadoutCostByTier[def.tier];
}

export function getLoadoutTotalCost(loadout: DeviceLoadout): Partial<Record<CurrencyId, number>> {
  const total: Partial<Record<CurrencyId, number>> = {};
  for (const modId of loadout.modIds) {
    const cost = getModLoadoutCost(modId);
    for (const [cid, amt] of Object.entries(cost)) {
      total[cid as CurrencyId] = (total[cid as CurrencyId] ?? 0) + (amt ?? 0);
    }
  }
  return total;
}

export function canAffordLoadout(currencies: CurrencyState, loadout: DeviceLoadout): boolean {
  const cost = getLoadoutTotalCost(loadout);
  return Object.entries(cost).every(([cid, amt]) =>
    Math.floor(currencies[cid as CurrencyId]) >= (amt ?? 0),
  );
}

export function payLoadoutCost(currencies: CurrencyState, loadout: DeviceLoadout): CurrencyState {
  const cost = getLoadoutTotalCost(loadout);
  const next = { ...currencies };
  for (const [cid, amt] of Object.entries(cost)) {
    next[cid as CurrencyId] -= amt ?? 0;
  }
  return next;
}

// ── Loadout Management ──

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

// ── Effect Resolution ──

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
    const def = deviceModMap[modId];
    if (!def) continue;
    const e = def.effects;
    result.rewardMultiplier += e.rewardMultiplier ?? 0;
    result.focusedRewardMultiplier += e.focusedRewardMultiplier ?? 0;
    result.durationMultiplier += e.durationMultiplier ?? 0;
    result.costMultiplier += e.costMultiplier ?? 0;
    result.bonusRewardChance += e.bonusRewardChance ?? 0;
    result.shardChanceBonus += e.shardChanceBonus ?? 0;
  }
  return result;
}

// ── Prestige Reset (no-op, kept for compat) ──

export function resetDeviceModifiers(_device: MapDeviceState): MapDeviceState {
  return initialMapDeviceState;
}

// ── Display Helpers ──

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
