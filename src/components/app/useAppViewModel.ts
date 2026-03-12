import { useMemo } from "react";
import { type PageId, type PageMeta } from "@/components/Sidebar";
import {
  fragmentCurrencyId,
  getTotalCurrencyValue,
  getTotalProductionValuePerSecond,
  getVisibleCurrencies,
} from "@/game/currencies";
import { type GameState } from "@/game/gameEngine";
import { generatorIds } from "@/game/generators";
import { canPrestige } from "@/game/prestige";
import { getAffordableUpgradeCount } from "@/game/upgradeEngine";

export const pageCopy: Record<PageId, { title: string; description: string }> = {
  home: {
    title: "Currency",
    description: "Run the core loop, monitor your stash, and keep the next few economy actions in one focused screen.",
  },
  upgrades: {
    title: "Upgrades",
    description: "Spend into production, routing, and long-term value once the base economy is online.",
  },
  mapDevice: {
    title: "Maps",
    description: "Choose a map, tune the device, and queue runs without crowding the rest of the game.",
  },
  progress: {
    title: "Progress",
    description: "Check run milestones, prestige readiness, and talent investments in one long-term screen.",
  },
};

type TopStripState = {
  items: Array<{
    id: string;
    label: string;
    icon: string;
    amount: number;
    productionRate: number;
  }>;
  hiddenCount: number;
  totalWealthValue: number;
  totalProductionValue: number;
};

type AppViewModel = {
  hasAnyGenerator: boolean;
  hasTier4: boolean;
  hasPrestige: boolean;
  hasTalents: boolean;
  canPrestigeNow: boolean;
  unlockedPages: Partial<Record<PageId, boolean>>;
  pageMeta: Partial<Record<PageId, PageMeta>>;
  topStripState: TopStripState;
  mapStatusLabel: string;
};

function getTopStripState(gameState: GameState): TopStripState {
  const visibleCurrencies = getVisibleCurrencies(gameState.unlockedCurrencies);
  const wealthCandidates = visibleCurrencies.filter(
    (currency) =>
      currency.id === fragmentCurrencyId ||
      gameState.currencies[currency.id] > 0 ||
      gameState.currencyProduction[currency.id] > 0,
  );
  const prioritizedHighTier = wealthCandidates
    .filter((currency) => currency.id !== fragmentCurrencyId)
    .sort((left, right) => right.tier - left.tier)
    .slice(0, 4);
  const priorityIds = new Set([fragmentCurrencyId, ...prioritizedHighTier.map((currency) => currency.id)]);
  const items = visibleCurrencies
    .filter((currency) => priorityIds.has(currency.id))
    .sort((left, right) => left.tier - right.tier)
    .map((currency) => ({
      id: currency.id,
      label: currency.shortLabel,
      icon: currency.icon,
      amount: gameState.currencies[currency.id],
      productionRate: gameState.currencyProduction[currency.id],
    }));

  return {
    items,
    hiddenCount: Math.max(0, wealthCandidates.filter((currency) => currency.id !== fragmentCurrencyId).length - prioritizedHighTier.length),
    totalWealthValue: getTotalCurrencyValue(gameState.currencies),
    totalProductionValue: getTotalProductionValuePerSecond(gameState.currencyProduction),
  };
}

function getUnlockedPages(gameState: GameState, hasAnyGenerator: boolean, hasTier4: boolean, hasPrestige: boolean, hasTalents: boolean) {
  return {
    upgrades: hasAnyGenerator,
    mapDevice: hasTier4,
    progress: hasPrestige || hasTalents,
  } satisfies Partial<Record<PageId, boolean>>;
}

function getPageMeta(
  gameState: GameState,
  hasTier4: boolean,
  hasTalents: boolean,
  canPrestigeNow: boolean,
): Partial<Record<PageId, PageMeta>> {
  const affordableUpgradeCount = getAffordableUpgradeCount({
    currencies: gameState.currencies,
    purchasedUpgrades: gameState.purchasedUpgrades,
    unlockedCurrencies: gameState.unlockedCurrencies,
    prestige: gameState.prestige,
  });

  return {
    upgrades: affordableUpgradeCount > 0 ? { badge: String(affordableUpgradeCount), tone: "ready" } : undefined,
    mapDevice: gameState.activeMap ? { badge: "Live", tone: "active" } : hasTier4 ? { badge: "Ready", tone: "active" } : undefined,
    progress: canPrestigeNow ? { badge: "Ready", tone: "alert" } : hasTalents ? { badge: "Talents", tone: "active" } : undefined,
  };
}

export function useAppViewModel(gameState: GameState): AppViewModel {
  return useMemo(() => {
    const hasAnyGenerator = generatorIds.some((id) => gameState.generatorsOwned[id] > 0);
    const hasTier4 = gameState.unlockedCurrencies.alterationOrb;
    const hasPrestige =
      hasTier4 &&
      (gameState.prestige.prestigeCount > 0 || gameState.prestige.mapsCompleted >= 1 || gameState.currencies.jewellersOrb >= 1);
    const hasTalents = gameState.prestige.totalMirrorShards > 0;
    const canPrestigeNow = canPrestige(gameState.currencies);
    const unlockedPages = getUnlockedPages(gameState, hasAnyGenerator, hasTier4, hasPrestige, hasTalents);

    return {
      hasAnyGenerator,
      hasTier4,
      hasPrestige,
      hasTalents,
      canPrestigeNow,
      unlockedPages,
      pageMeta: getPageMeta(gameState, hasTier4, hasTalents, canPrestigeNow),
      topStripState: getTopStripState(gameState),
      mapStatusLabel: gameState.activeMap ? "Map running" : hasTier4 ? "Map device unlocked" : "Atlas locked",
    };
  }, [gameState]);
}
