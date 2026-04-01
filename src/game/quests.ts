export type QuestId = string;

export type QuestCondition =
  | { type: "currencyAmount"; currencyId: string; amount: number }
  | { type: "generatorCount"; generatorId: string; amount: number }
  | { type: "productionRate"; currencyId: string; rate: number }
  | { type: "purchasedUpgradeCount"; count: number }
  | { type: "unlockedCurrencyCount"; count: number }
  | { type: "mapFragmentCount"; amount: number };

export type QuestReward =
  | { type: "mapFragment"; amount: number }
  | { type: "permanentClickBonus"; value: number }
  | { type: "permanentGeneratorSpeed"; value: number }
  | { type: "unlockFeature"; feature: string }
  | { type: "autoGenerator"; generatorId: string; amount: number };

export type QuestDefinition = {
  id: QuestId;
  title: string;
  condition: QuestCondition;
  rewards: QuestReward[];
  prerequisiteQuestId?: QuestId;
  hidden: boolean;
  sortOrder: number;
};

export type QuestState = {
  completedQuests: Record<QuestId, number>;
  activeQuestId: QuestId | null;
  questNotification: { questId: string; title: string; timestamp: number } | null;
  fragmentNotification: { timestamp: number } | null;
};

export const initialQuestState: QuestState = {
  completedQuests: {},
  activeQuestId: null,
  questNotification: null,
  fragmentNotification: null,
};

export const quests: QuestDefinition[] = [
  {
    id: "gatherFragments",
    title: "Gather 50 Fragments",
    condition: { type: "currencyAmount", currencyId: "fragmentOfWisdom", amount: 50 },
    rewards: [{ type: "autoGenerator", generatorId: "fragmentFarmer", amount: 1 }],
    hidden: false,
    sortOrder: 1,
  },
  {
    id: "ownFiveGenerators",
    title: "Own 5 Fragment Farmers",
    condition: { type: "generatorCount", generatorId: "fragmentFarmer", amount: 5 },
    rewards: [{ type: "permanentClickBonus", value: 0.25 }],
    prerequisiteQuestId: "gatherFragments",
    hidden: false,
    sortOrder: 2,
  },
  {
    id: "reachTenPerSecond",
    title: "Reach 10 Fragment/s",
    condition: { type: "productionRate", currencyId: "fragmentOfWisdom", rate: 10 },
    rewards: [{ type: "unlockFeature", feature: "upgrades" }],
    prerequisiteQuestId: "ownFiveGenerators",
    hidden: false,
    sortOrder: 3,
  },
  {
    id: "buyFirstUpgrade",
    title: "Buy your first upgrade",
    condition: { type: "purchasedUpgradeCount", count: 1 },
    rewards: [{ type: "permanentGeneratorSpeed", value: 0.15 }],
    prerequisiteQuestId: "reachTenPerSecond",
    hidden: false,
    sortOrder: 4,
  },
  {
    id: "unlockTransmutation",
    title: "Unlock Transmutation",
    condition: { type: "unlockedCurrencyCount", count: 2 },
    rewards: [{ type: "mapFragment", amount: 1 }],
    prerequisiteQuestId: "buyFirstUpgrade",
    hidden: false,
    sortOrder: 5,
  },
  {
    id: "threeCurrencies",
    title: "Have 3 currencies producing",
    condition: { type: "unlockedCurrencyCount", count: 3 },
    rewards: [{ type: "mapFragment", amount: 1 }],
    prerequisiteQuestId: "unlockTransmutation",
    hidden: true,
    sortOrder: 6,
  },
  {
    id: "collectMapFragments",
    title: "Collect 3 Map Fragments",
    condition: { type: "mapFragmentCount", amount: 3 },
    rewards: [
      { type: "unlockFeature", feature: "mapDevice" },
      { type: "mapFragment", amount: 1 },
    ],
    prerequisiteQuestId: "threeCurrencies",
    hidden: true,
    sortOrder: 7,
  },
];

export const questMap: Record<QuestId, QuestDefinition> = Object.fromEntries(
  quests.map((q) => [q.id, q]),
);

export function isQuestCompleted(questState: QuestState, questId: QuestId): boolean {
  return questState.completedQuests[questId] !== undefined;
}

export function isQuestUnlocked(questState: QuestState, quest: QuestDefinition): boolean {
  if (!quest.prerequisiteQuestId) return true;
  return isQuestCompleted(questState, quest.prerequisiteQuestId);
}

export function isQuestVisible(questState: QuestState, quest: QuestDefinition): boolean {
  if (isQuestCompleted(questState, quest.id)) return true;
  if (!quest.hidden) return isQuestUnlocked(questState, quest);
  return isQuestUnlocked(questState, quest);
}

export function getNextAvailableQuest(questState: QuestState): QuestDefinition | null {
  return (
    quests
      .filter((q) => !isQuestCompleted(questState, q.id) && isQuestUnlocked(questState, q))
      .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null
  );
}

export function evaluateQuestCondition(
  condition: QuestCondition,
  currencies: Record<string, number>,
  generatorsOwned: Record<string, number>,
  currencyProduction: Record<string, number>,
  purchasedUpgrades: Record<string, number>,
  unlockedCurrencies: Record<string, boolean>,
  mapFragments: number,
): boolean {
  switch (condition.type) {
    case "currencyAmount":
      return (currencies[condition.currencyId] ?? 0) >= condition.amount;
    case "generatorCount":
      return (generatorsOwned[condition.generatorId] ?? 0) >= condition.amount;
    case "productionRate":
      return (currencyProduction[condition.currencyId] ?? 0) >= condition.rate;
    case "purchasedUpgradeCount": {
      const count = Object.values(purchasedUpgrades).filter((level) => level > 0).length;
      return count >= condition.count;
    }
    case "unlockedCurrencyCount": {
      const count = Object.values(unlockedCurrencies).filter(Boolean).length;
      return count >= condition.count;
    }
    case "mapFragmentCount":
      return mapFragments >= condition.amount;
  }
}

export function getQuestProgress(
  condition: QuestCondition,
  currencies: Record<string, number>,
  generatorsOwned: Record<string, number>,
  currencyProduction: Record<string, number>,
  purchasedUpgrades: Record<string, number>,
  unlockedCurrencies: Record<string, boolean>,
  mapFragments: number,
): { current: number; target: number } {
  switch (condition.type) {
    case "currencyAmount":
      return { current: Math.floor(currencies[condition.currencyId] ?? 0), target: condition.amount };
    case "generatorCount":
      return { current: generatorsOwned[condition.generatorId] ?? 0, target: condition.amount };
    case "productionRate":
      return { current: Math.round((currencyProduction[condition.currencyId] ?? 0) * 10) / 10, target: condition.rate };
    case "purchasedUpgradeCount":
      return { current: Object.values(purchasedUpgrades).filter((l) => l > 0).length, target: condition.count };
    case "unlockedCurrencyCount":
      return { current: Object.values(unlockedCurrencies).filter(Boolean).length, target: condition.count };
    case "mapFragmentCount":
      return { current: mapFragments, target: condition.amount };
  }
}

export function getQuestClickBonus(questState: QuestState): number {
  let bonus = 0;
  for (const quest of quests) {
    if (!isQuestCompleted(questState, quest.id)) continue;
    for (const reward of quest.rewards) {
      if (reward.type === "permanentClickBonus") bonus += reward.value;
    }
  }
  return bonus;
}

export function getQuestGeneratorSpeedBonus(questState: QuestState): number {
  let bonus = 0;
  for (const quest of quests) {
    if (!isQuestCompleted(questState, quest.id)) continue;
    for (const reward of quest.rewards) {
      if (reward.type === "permanentGeneratorSpeed") bonus += reward.value;
    }
  }
  return bonus;
}

export function getQuestUnlockedFeatures(questState: QuestState): Set<string> {
  const features = new Set<string>();
  for (const quest of quests) {
    if (!isQuestCompleted(questState, quest.id)) continue;
    for (const reward of quest.rewards) {
      if (reward.type === "unlockFeature") features.add(reward.feature);
    }
  }
  return features;
}
