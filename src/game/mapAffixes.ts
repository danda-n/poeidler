// ── Map Affix System ──

export type AffixSlot = "prefix" | "suffix";

export type AffixDefinition = {
  id: string;
  name: string;
  description: string;
  slot: AffixSlot;
  tier: "normal" | "premium";
  rewardMultiplier: number;
  focusedRewardMultiplier: number;
  durationMultiplier: number;
  costMultiplier: number;
  shardChanceBonus: number;
};

// ── Affix Pool ──

export const affixPool: AffixDefinition[] = [
  // Prefixes — mostly upside
  {
    id: "bountiful",
    name: "Bountiful",
    description: "+40% rewards",
    slot: "prefix",
    tier: "normal",
    rewardMultiplier: 0.40,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0,
  },
  {
    id: "overflowing",
    name: "Overflowing",
    description: "+25% rewards, +15% focused rewards",
    slot: "prefix",
    tier: "normal",
    rewardMultiplier: 0.25,
    focusedRewardMultiplier: 0.15,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0,
  },
  {
    id: "swift",
    name: "Swift",
    description: "-25% duration",
    slot: "prefix",
    tier: "normal",
    rewardMultiplier: 0,
    focusedRewardMultiplier: 0,
    durationMultiplier: -0.25,
    costMultiplier: 0,
    shardChanceBonus: 0,
  },
  {
    id: "mirrored",
    name: "Mirrored",
    description: "+2% shard chance",
    slot: "prefix",
    tier: "normal",
    rewardMultiplier: 0,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0.02,
  },
  {
    id: "lucrative",
    name: "Lucrative",
    description: "+60% rewards, +30% cost",
    slot: "prefix",
    tier: "premium",
    rewardMultiplier: 0.60,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0.30,
    shardChanceBonus: 0,
  },

  // Suffixes — mixed or downside with upside
  {
    id: "ofPlenty",
    name: "of Plenty",
    description: "+20% rewards",
    slot: "suffix",
    tier: "normal",
    rewardMultiplier: 0.20,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0,
  },
  {
    id: "ofFocus",
    name: "of Focus",
    description: "+30% focused rewards",
    slot: "suffix",
    tier: "normal",
    rewardMultiplier: 0,
    focusedRewardMultiplier: 0.30,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0,
  },
  {
    id: "ofEndurance",
    name: "of Endurance",
    description: "+40% duration, +50% rewards",
    slot: "suffix",
    tier: "normal",
    rewardMultiplier: 0.50,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0.40,
    costMultiplier: 0,
    shardChanceBonus: 0,
  },
  {
    id: "ofThrift",
    name: "of Thrift",
    description: "-20% cost, -10% rewards",
    slot: "suffix",
    tier: "normal",
    rewardMultiplier: -0.10,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: -0.20,
    shardChanceBonus: 0,
  },
  {
    id: "ofReflection",
    name: "of Reflection",
    description: "+1.5% shard chance, -15% rewards",
    slot: "suffix",
    tier: "normal",
    rewardMultiplier: -0.15,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0.015,
  },
  {
    id: "ofOpulence",
    name: "of Opulence",
    description: "+35% rewards, +40% focused rewards",
    slot: "suffix",
    tier: "premium",
    rewardMultiplier: 0.35,
    focusedRewardMultiplier: 0.40,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0,
  },
];

export const affixMap: Record<string, AffixDefinition> = affixPool.reduce((acc, a) => {
  acc[a.id] = a;
  return acc;
}, {} as Record<string, AffixDefinition>);

// ── Affix Rolling ──

const normalPrefixes = affixPool.filter((a) => a.slot === "prefix" && a.tier === "normal");
const normalSuffixes = affixPool.filter((a) => a.slot === "suffix" && a.tier === "normal");
const premiumPrefixes = affixPool.filter((a) => a.slot === "prefix" && a.tier === "premium");
const premiumSuffixes = affixPool.filter((a) => a.slot === "suffix" && a.tier === "premium");
const allPrefixes = affixPool.filter((a) => a.slot === "prefix");
const allSuffixes = affixPool.filter((a) => a.slot === "suffix");

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomExcluding<T extends { id: string }>(arr: T[], excludeIds: Set<string>): T | null {
  const filtered = arr.filter((a) => !excludeIds.has(a.id));
  if (filtered.length === 0) return null;
  return pickRandom(filtered);
}

/** Roll 1 random normal affix (prefix or suffix equally weighted) */
export function rollOneNormalAffix(excludeIds: Set<string>): AffixDefinition | null {
  const pool = [...normalPrefixes, ...normalSuffixes].filter((a) => !excludeIds.has(a.id));
  if (pool.length === 0) return null;
  return pickRandom(pool);
}

/** Roll N random normal affixes ensuring no duplicates */
export function rollNormalAffixes(count: number, excludeIds: Set<string> = new Set()): AffixDefinition[] {
  const result: AffixDefinition[] = [];
  const used = new Set(excludeIds);
  for (let i = 0; i < count; i++) {
    const affix = rollOneNormalAffix(used);
    if (!affix) break;
    result.push(affix);
    used.add(affix.id);
  }
  return result;
}

/** Roll a premium affix (for Exalted Orb) */
export function rollPremiumAffix(excludeIds: Set<string>): AffixDefinition | null {
  const pool = [...premiumPrefixes, ...premiumSuffixes].filter((a) => !excludeIds.has(a.id));
  if (pool.length === 0) return null;
  return pickRandom(pool);
}

/** Roll one affix from a specific slot */
export function rollAffixForSlot(slot: AffixSlot, excludeIds: Set<string>, includePremium: boolean): AffixDefinition | null {
  const pool = includePremium
    ? (slot === "prefix" ? allPrefixes : allSuffixes)
    : (slot === "prefix" ? normalPrefixes : normalSuffixes);
  return pickRandomExcluding(pool, excludeIds);
}

// ── Affix Stat Resolution ──

export type ResolvedAffixStats = {
  rewardMultiplier: number;
  focusedRewardMultiplier: number;
  durationMultiplier: number;
  costMultiplier: number;
  shardChanceBonus: number;
};

export function resolveAffixStats(affixIds: string[]): ResolvedAffixStats {
  const stats: ResolvedAffixStats = {
    rewardMultiplier: 0,
    focusedRewardMultiplier: 0,
    durationMultiplier: 0,
    costMultiplier: 0,
    shardChanceBonus: 0,
  };

  affixIds.forEach((id) => {
    const affix = affixMap[id];
    if (!affix) return;
    stats.rewardMultiplier += affix.rewardMultiplier;
    stats.focusedRewardMultiplier += affix.focusedRewardMultiplier;
    stats.durationMultiplier += affix.durationMultiplier;
    stats.costMultiplier += affix.costMultiplier;
    stats.shardChanceBonus += affix.shardChanceBonus;
  });

  return stats;
}

export function getAffixCount(affixIds: string[]): { prefixes: number; suffixes: number } {
  let prefixes = 0;
  let suffixes = 0;
  affixIds.forEach((id) => {
    const affix = affixMap[id];
    if (!affix) return;
    if (affix.slot === "prefix") prefixes++;
    else suffixes++;
  });
  return { prefixes, suffixes };
}
