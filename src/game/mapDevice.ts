import type { CurrencyId, CurrencyState } from "./currencies";

// ── Types ──

export type DeviceModTier = "normal" | "magic" | "rare" | "premium";

export type DeviceModEffects = {
  rewardMultiplier?: number;
  focusedRewardMultiplier?: number;
  durationMultiplier?: number;
  costMultiplier?: number;
  craftRefundChance?: number;
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

export type DeviceModifier = {
  modId: string;
  quality: number; // 0.5–1.0, multiplies effect values
};

export type MapDeviceState = {
  sockets: number;  // 1–3
  links: number;    // 0 to sockets-1
  modifiers: (DeviceModifier | null)[]; // always length 3
};

export type ResolvedDeviceEffects = {
  rewardMultiplier: number;
  focusedRewardMultiplier: number;
  durationMultiplier: number;
  costMultiplier: number;
  craftRefundChance: number;
  bonusRewardChance: number;
  shardChanceBonus: number;
};

// ── Balance ──

export const DEVICE_BALANCE = {
  socketWeights: [30, 50, 20] as const, // chances for 1, 2, 3 sockets
  linkChance: 0.35,
  linkBonus: 0.20,
  qualityMin: 0.5,
  qualityMax: 1.0,
  divineQualityMin: 0.7,
  divineQualityMax: 1.0,
} as const;

// ── Modifier Pool ──

export const deviceModPool: DeviceModDefinition[] = [
  // Normal tier
  { id: "amplifier", name: "Amplifier", description: "+20% rewards", tier: "normal", effects: { rewardMultiplier: 0.20 } },
  { id: "concentrator", name: "Concentrator", description: "+25% focused rewards", tier: "normal", effects: { focusedRewardMultiplier: 0.25 } },
  { id: "accelerator", name: "Accelerator", description: "-15% duration", tier: "normal", effects: { durationMultiplier: -0.15 } },
  { id: "economist", name: "Economist", description: "-12% map cost", tier: "normal", effects: { costMultiplier: -0.12 } },
  { id: "scavenger", name: "Scavenger", description: "8% craft refund chance", tier: "normal", effects: { craftRefundChance: 0.08 } },
  { id: "fragmentLens", name: "Fragment Lens", description: "+0.5% shard chance", tier: "normal", effects: { shardChanceBonus: 0.005 } },

  // Magic tier
  { id: "resonator", name: "Resonator", description: "+35% rewards, +20% cost", tier: "magic", effects: { rewardMultiplier: 0.35, costMultiplier: 0.20 } },
  { id: "calibrator", name: "Calibrator", description: "+40% focused rewards, +15% duration", tier: "magic", effects: { focusedRewardMultiplier: 0.40, durationMultiplier: 0.15 } },
  { id: "prismaticCore", name: "Prismatic Core", description: "+1% shard chance, -10% rewards", tier: "magic", effects: { shardChanceBonus: 0.01, rewardMultiplier: -0.10 } },
  { id: "prospector", name: "Prospector", description: "12% bonus reward chance, +10% cost", tier: "magic", effects: { bonusRewardChance: 0.12, costMultiplier: 0.10 } },

  // Rare tier
  { id: "gildedFrame", name: "Gilded Frame", description: "+50% rewards, +30% cost", tier: "rare", effects: { rewardMultiplier: 0.50, costMultiplier: 0.30 } },
  { id: "eternalFocus", name: "Eternal Focus", description: "+60% focused, +25% cost", tier: "rare", effects: { focusedRewardMultiplier: 0.60, costMultiplier: 0.25 } },

  // Premium tier (Exalted/Divine)
  { id: "transcendentLens", name: "Transcendent Lens", description: "+70% rewards, +50% focused, +40% cost", tier: "premium", effects: { rewardMultiplier: 0.70, focusedRewardMultiplier: 0.50, costMultiplier: 0.40 } },
  { id: "mirrorResonator", name: "Mirror Resonator", description: "+2% shard, +35% rewards, -20% focused", tier: "premium", effects: { shardChanceBonus: 0.02, rewardMultiplier: 0.35, focusedRewardMultiplier: -0.20 } },
];

export const deviceModMap: Record<string, DeviceModDefinition> = deviceModPool.reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {} as Record<string, DeviceModDefinition>);

const modsByTier = (tier: DeviceModTier) => deviceModPool.filter((m) => m.tier === tier);

// ── Initial State ──

export const initialMapDeviceState: MapDeviceState = {
  sockets: 1,
  links: 0,
  modifiers: [null, null, null],
};

// ── Helpers ──

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function rollQuality(): number {
  return randRange(DEVICE_BALANCE.qualityMin, DEVICE_BALANCE.qualityMax);
}

function rollDivineQuality(): number {
  return randRange(DEVICE_BALANCE.divineQualityMin, DEVICE_BALANCE.divineQualityMax);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollRandomMod(tier: DeviceModTier): DeviceModifier {
  const pool = modsByTier(tier);
  const mod = pickRandom(pool);
  return { modId: mod.id, quality: rollQuality() };
}

// ── Resolve Effects ──

export function resolveDeviceEffects(device: MapDeviceState): ResolvedDeviceEffects {
  const result: ResolvedDeviceEffects = {
    rewardMultiplier: 0,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0,
    craftRefundChance: 0,
    bonusRewardChance: 0,
    shardChanceBonus: 0,
  };

  for (let i = 0; i < device.sockets; i++) {
    const mod = device.modifiers[i];
    if (!mod) continue;

    const def = deviceModMap[mod.modId];
    if (!def) continue;

    // Link bonus: count how many links this socket participates in
    let linkCount = 0;
    if (i > 0 && device.links >= i) linkCount++;
    if (i < device.sockets - 1 && device.links >= i + 1) linkCount++;
    const effectiveness = mod.quality * (1 + linkCount * DEVICE_BALANCE.linkBonus);

    const e = def.effects;
    result.rewardMultiplier += (e.rewardMultiplier ?? 0) * effectiveness;
    result.focusedRewardMultiplier += (e.focusedRewardMultiplier ?? 0) * effectiveness;
    result.durationMultiplier += (e.durationMultiplier ?? 0) * effectiveness;
    result.costMultiplier += (e.costMultiplier ?? 0) * effectiveness;
    result.craftRefundChance += (e.craftRefundChance ?? 0) * effectiveness;
    result.bonusRewardChance += (e.bonusRewardChance ?? 0) * effectiveness;
    result.shardChanceBonus += (e.shardChanceBonus ?? 0) * effectiveness;
  }

  return result;
}

// ── Device Actions ──

export type DeviceAction = "jeweller" | "fusing" | "chaos" | "alchemy" | "regal" | "exalt" | "divine";

export const deviceActionCosts: Record<DeviceAction, Partial<Record<CurrencyId, number>>> = {
  jeweller: { jewellersOrb: 5 },
  fusing: { fusingOrb: 8 },
  chaos: { chaosOrb: 1 },
  alchemy: { alchemyOrb: 1 },
  regal: { regalOrb: 1 },
  exalt: { exaltedOrb: 1 },
  divine: { divineOrb: 1 },
};

export const deviceActionLabels: Record<DeviceAction, string> = {
  jeweller: "Jeweller",
  fusing: "Fusing",
  chaos: "Chaos",
  alchemy: "Alchemy",
  regal: "Regal",
  exalt: "Exalt",
  divine: "Divine",
};

export const deviceActionDescriptions: Record<DeviceAction, string> = {
  jeweller: "Reroll socket count (1-3)",
  fusing: "Reroll links between sockets",
  chaos: "Fill all sockets with random normal mods",
  alchemy: "Upgrade one normal mod to magic",
  regal: "Upgrade one non-rare mod to rare",
  exalt: "Set one socket to a premium mod",
  divine: "Reroll all mod quality with premium range",
};

export function canAffordDeviceAction(currencies: CurrencyState, action: DeviceAction): boolean {
  const cost = deviceActionCosts[action];
  return Object.entries(cost).every(([cid, amount]) =>
    Math.floor(currencies[cid as CurrencyId]) >= (amount ?? 0),
  );
}

export function payDeviceActionCost(currencies: CurrencyState, action: DeviceAction): CurrencyState {
  const cost = deviceActionCosts[action];
  const next = { ...currencies };
  Object.entries(cost).forEach(([cid, amount]) => {
    next[cid as CurrencyId] -= amount ?? 0;
  });
  return next;
}

export function isDeviceActionAvailable(device: MapDeviceState, action: DeviceAction): boolean {
  switch (action) {
    case "jeweller":
    case "fusing":
    case "chaos":
      return true;
    case "alchemy": {
      // Need at least one normal-tier modifier in active sockets
      for (let i = 0; i < device.sockets; i++) {
        const mod = device.modifiers[i];
        if (mod && deviceModMap[mod.modId]?.tier === "normal") return true;
      }
      return false;
    }
    case "regal": {
      // Need at least one normal or magic modifier
      for (let i = 0; i < device.sockets; i++) {
        const mod = device.modifiers[i];
        if (!mod) continue;
        const tier = deviceModMap[mod.modId]?.tier;
        if (tier === "normal" || tier === "magic") return true;
      }
      return false;
    }
    case "exalt":
      // Need at least one socket (always true with sockets >= 1)
      return device.sockets >= 1;
    case "divine": {
      // Need at least one modifier
      for (let i = 0; i < device.sockets; i++) {
        if (device.modifiers[i]) return true;
      }
      return false;
    }
  }
}

export function getAvailableDeviceActions(device: MapDeviceState): DeviceAction[] {
  const all: DeviceAction[] = ["jeweller", "fusing", "chaos", "alchemy", "regal", "exalt", "divine"];
  return all.filter((a) => isDeviceActionAvailable(device, a));
}

// ── Apply Device Actions ──

function rollSocketCount(): number {
  const r = Math.random() * 100;
  if (r < DEVICE_BALANCE.socketWeights[0]) return 1;
  if (r < DEVICE_BALANCE.socketWeights[0] + DEVICE_BALANCE.socketWeights[1]) return 2;
  return 3;
}

function rollLinks(sockets: number): number {
  let links = 0;
  for (let i = 1; i < sockets; i++) {
    if (Math.random() < DEVICE_BALANCE.linkChance) links = i;
    else break;
  }
  return links;
}

export function applyDeviceAction(device: MapDeviceState, action: DeviceAction): MapDeviceState {
  const next = { ...device, modifiers: [...device.modifiers] };

  switch (action) {
    case "jeweller": {
      const newSockets = rollSocketCount();
      next.sockets = newSockets;
      // Clear modifiers in lost sockets
      for (let i = newSockets; i < 3; i++) {
        next.modifiers[i] = null;
      }
      // Adjust links
      next.links = Math.min(next.links, Math.max(0, newSockets - 1));
      return next;
    }
    case "fusing": {
      next.links = rollLinks(next.sockets);
      return next;
    }
    case "chaos": {
      for (let i = 0; i < next.sockets; i++) {
        next.modifiers[i] = rollRandomMod("normal");
      }
      return next;
    }
    case "alchemy": {
      // Find normal-tier mods and upgrade one randomly
      const candidates: number[] = [];
      for (let i = 0; i < next.sockets; i++) {
        const mod = next.modifiers[i];
        if (mod && deviceModMap[mod.modId]?.tier === "normal") candidates.push(i);
      }
      if (candidates.length === 0) return next;
      const idx = pickRandom(candidates);
      next.modifiers[idx] = rollRandomMod("magic");
      return next;
    }
    case "regal": {
      // Upgrade one normal/magic mod to rare
      const candidates: number[] = [];
      for (let i = 0; i < next.sockets; i++) {
        const mod = next.modifiers[i];
        if (!mod) continue;
        const tier = deviceModMap[mod.modId]?.tier;
        if (tier === "normal" || tier === "magic") candidates.push(i);
      }
      if (candidates.length === 0) return next;
      const idx = pickRandom(candidates);
      next.modifiers[idx] = rollRandomMod("rare");
      return next;
    }
    case "exalt": {
      // Set one random socket to premium
      const idx = Math.floor(Math.random() * next.sockets);
      next.modifiers[idx] = rollRandomMod("premium");
      return next;
    }
    case "divine": {
      // Reroll quality on all existing mods with premium range
      for (let i = 0; i < next.sockets; i++) {
        const mod = next.modifiers[i];
        if (mod) {
          next.modifiers[i] = { ...mod, quality: rollDivineQuality() };
        }
      }
      return next;
    }
  }
}

// ── Prestige Reset ──

export function resetDeviceModifiers(device: MapDeviceState): MapDeviceState {
  return {
    sockets: device.sockets,
    links: device.links,
    modifiers: [null, null, null],
  };
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

export function formatQuality(quality: number): string {
  return `${Math.round(quality * 100)}%`;
}
