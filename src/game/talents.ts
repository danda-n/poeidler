export type TalentBranch = "cartography" | "economy" | "reflection";

export type TalentDefinition = {
  id: string;
  name: string;
  description: string;
  branch: TalentBranch;
  baseCost: number;
  costPerRank: number;
  maxRank: number;
  prerequisite?: string;
};

export type TalentPurchasedState = Record<string, number>;

export const talents: TalentDefinition[] = [
  {
    id: "surveyorsEye",
    name: "Surveyor's Eye",
    description: "Maps finish 5% faster per rank",
    branch: "cartography",
    baseCost: 3,
    costPerRank: 2,
    maxRank: 5,
  },
  {
    id: "hiddenStashes",
    name: "Hidden Stashes",
    description: "Maps grant 10% more rewards per rank",
    branch: "cartography",
    baseCost: 4,
    costPerRank: 3,
    maxRank: 5,
  },
  {
    id: "efficientRolling",
    name: "Efficient Rolling",
    description: "Maps cost 8% less per rank",
    branch: "cartography",
    baseCost: 5,
    costPerRank: 3,
    maxRank: 4,
  },
  {
    id: "pathMemory",
    name: "Path Memory",
    description: "Repeating the same map family grants +5% reward per streak (max 5 stacks)",
    branch: "cartography",
    baseCost: 8,
    costPerRank: 5,
    maxRank: 3,
    prerequisite: "hiddenStashes",
  },
  {
    id: "fieldReports",
    name: "Field Reports",
    description: "Maps with encounters grant 8% more rewards per rank",
    branch: "cartography",
    baseCost: 10,
    costPerRank: 6,
    maxRank: 3,
    prerequisite: "pathMemory",
  },
  {
    id: "hazardCharts",
    name: "Hazard Charts",
    description: "Maps with encounters finish 4% faster per rank",
    branch: "cartography",
    baseCost: 12,
    costPerRank: 7,
    maxRank: 3,
    prerequisite: "fieldReports",
  },
  {
    id: "firmHand",
    name: "Firm Hand",
    description: "Click power increased by 15% per rank",
    branch: "economy",
    baseCost: 2,
    costPerRank: 2,
    maxRank: 5,
  },
  {
    id: "bulkContracts",
    name: "Bulk Contracts",
    description: "Generator costs reduced by 5% per rank",
    branch: "economy",
    baseCost: 4,
    costPerRank: 3,
    maxRank: 5,
  },
  {
    id: "compoundingCraft",
    name: "Compounding Craft",
    description: "Breakpoint multipliers (every 25 levels) are 20% stronger per rank",
    branch: "economy",
    baseCost: 6,
    costPerRank: 4,
    maxRank: 3,
    prerequisite: "firmHand",
  },
  {
    id: "streamlinedConversion",
    name: "Streamlined Conversion",
    description: "Conversion gives 5% bonus output per rank",
    branch: "economy",
    baseCost: 5,
    costPerRank: 3,
    maxRank: 4,
  },
  {
    id: "crackedMirror",
    name: "Cracked Mirror",
    description: "Gain 15% more Mirror Shards on prestige per rank",
    branch: "reflection",
    baseCost: 5,
    costPerRank: 4,
    maxRank: 5,
  },
  {
    id: "lingeringWealth",
    name: "Lingering Wealth",
    description: "Keep 2% of lower-tier currencies on prestige per rank",
    branch: "reflection",
    baseCost: 8,
    costPerRank: 6,
    maxRank: 5,
    prerequisite: "crackedMirror",
  },
  {
    id: "echoingArchives",
    name: "Echoing Archives",
    description: "Encounter maps contribute 25% more prestige value per rank",
    branch: "reflection",
    baseCost: 11,
    costPerRank: 7,
    maxRank: 3,
    prerequisite: "lingeringWealth",
  },
];

export const talentMap: Record<string, TalentDefinition> = talents.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {} as Record<string, TalentDefinition>);

export const initialTalentsPurchased: TalentPurchasedState = talents.reduce((acc, t) => {
  acc[t.id] = 0;
  return acc;
}, {} as TalentPurchasedState);

export const talentBranches: TalentBranch[] = ["cartography", "economy", "reflection"];

export function getTalentsByBranch(branch: TalentBranch): TalentDefinition[] {
  return talents.filter((t) => t.branch === branch);
}

export function getTalentCost(talent: TalentDefinition, currentRank: number): number {
  return talent.baseCost + talent.costPerRank * currentRank;
}

export function canPurchaseTalent(
  talent: TalentDefinition,
  purchased: TalentPurchasedState,
  mirrorShards: number,
): boolean {
  const currentRank = purchased[talent.id] ?? 0;
  if (currentRank >= talent.maxRank) return false;

  if (talent.prerequisite) {
    const prereqRank = purchased[talent.prerequisite] ?? 0;
    if (prereqRank <= 0) return false;
  }

  const cost = getTalentCost(talent, currentRank);
  return mirrorShards >= cost;
}

export function isTalentAvailable(
  talent: TalentDefinition,
  purchased: TalentPurchasedState,
): boolean {
  const currentRank = purchased[talent.id] ?? 0;
  if (currentRank >= talent.maxRank) return false;

  if (talent.prerequisite) {
    const prereqRank = purchased[talent.prerequisite] ?? 0;
    if (prereqRank <= 0) return false;
  }

  return true;
}

export function purchaseTalent(
  talentId: string,
  purchased: TalentPurchasedState,
  mirrorShards: number,
): { purchased: TalentPurchasedState; mirrorShards: number } | null {
  const talent = talentMap[talentId];
  if (!talent) return null;
  if (!canPurchaseTalent(talent, purchased, mirrorShards)) return null;

  const currentRank = purchased[talentId] ?? 0;
  const cost = getTalentCost(talent, currentRank);

  return {
    purchased: { ...purchased, [talentId]: currentRank + 1 },
    mirrorShards: mirrorShards - cost,
  };
}

export function getMapSpeedBonus(purchased: TalentPurchasedState): number {
  return (purchased.surveyorsEye ?? 0) * 0.05;
}

export function getMapRewardBonus(purchased: TalentPurchasedState, streak: number): number {
  const hiddenStashes = (purchased.hiddenStashes ?? 0) * 0.10;
  const pathMemoryRank = purchased.pathMemory ?? 0;
  const pathMemoryBonus = pathMemoryRank > 0 ? Math.min(streak, 5) * 0.05 * pathMemoryRank : 0;
  return hiddenStashes + pathMemoryBonus;
}

export function getMapCostReduction(purchased: TalentPurchasedState): number {
  return (purchased.efficientRolling ?? 0) * 0.08;
}

export function getEncounterRewardBonus(purchased: TalentPurchasedState, hasEncounter: boolean): number {
  if (!hasEncounter) return 0;
  return (purchased.fieldReports ?? 0) * 0.08;
}

export function getEncounterSpeedBonus(purchased: TalentPurchasedState, hasEncounter: boolean): number {
  if (!hasEncounter) return 0;
  return (purchased.hazardCharts ?? 0) * 0.04;
}

export function getEncounterPrestigeBonus(purchased: TalentPurchasedState): number {
  return (purchased.echoingArchives ?? 0) * 0.25;
}

export function getClickPowerBonus(purchased: TalentPurchasedState): number {
  return (purchased.firmHand ?? 0) * 0.15;
}

export function getGeneratorCostReduction(purchased: TalentPurchasedState): number {
  return (purchased.bulkContracts ?? 0) * 0.05;
}

export function getBreakpointBonus(purchased: TalentPurchasedState): number {
  return (purchased.compoundingCraft ?? 0) * 0.20;
}

export function getConversionBonus(purchased: TalentPurchasedState): number {
  return (purchased.streamlinedConversion ?? 0) * 0.05;
}

export function getBranchLabel(branch: TalentBranch): string {
  switch (branch) {
    case "cartography": return "Cartography";
    case "economy": return "Economy";
    case "reflection": return "Reflection";
  }
}

export function getBranchIcon(branch: TalentBranch): string {
  switch (branch) {
    case "cartography": return "\u{1F5FA}";
    case "economy": return "\u{1F4B0}";
    case "reflection": return "\u{1FA9E}";
  }
}
