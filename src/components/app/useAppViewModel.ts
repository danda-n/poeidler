import { useMemo, useRef } from "react";
import { type PageId, type PageMeta } from "@/components/Sidebar";
import {
  fragmentCurrencyId,
  getTotalCurrencyValue,
  getTotalProductionValuePerSecond,
  getVisibleCurrencies,
} from "@/game/currencies";
import type { GameState } from "@/game/gameEngine";
import { generatorIds } from "@/game/generators";
import { canPrestige } from "@/game/prestige";
import { getAffordableUpgradeCount } from "@/game/upgradeEngine";
import { useGameStore } from "@/store/useGameStore";

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

function getTopStripState(currencies: GameState["currencies"], currencyProduction: GameState["currencyProduction"], unlockedCurrencies: GameState["unlockedCurrencies"]): TopStripState {
  const visibleCurrencies = getVisibleCurrencies(unlockedCurrencies);
  const wealthCandidates = visibleCurrencies.filter(
    (currency) =>
      currency.id === fragmentCurrencyId ||
      currencies[currency.id] > 0 ||
      currencyProduction[currency.id] > 0,
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
      amount: currencies[currency.id],
      productionRate: currencyProduction[currency.id],
    }));

  return {
    items,
    hiddenCount: Math.max(0, wealthCandidates.filter((currency) => currency.id !== fragmentCurrencyId).length - prioritizedHighTier.length),
    totalWealthValue: getTotalCurrencyValue(currencies),
    totalProductionValue: getTotalProductionValuePerSecond(currencyProduction),
  };
}

const BADGE_THROTTLE_MS = 1000;

export function useAppViewModel(): AppViewModel {
  const currencies = useGameStore((s) => s.currencies);
  const currencyProduction = useGameStore((s) => s.currencyProduction);
  const generatorsOwned = useGameStore((s) => s.generatorsOwned);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);
  const prestige = useGameStore((s) => s.prestige);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const activeMap = useGameStore((s) => s.activeMap);

  const badgeCacheRef = useRef<{ count: number; lastComputedAt: number; purchasedUpgrades: unknown }>({
    count: 0,
    lastComputedAt: 0,
    purchasedUpgrades: null,
  });

  const flags = useMemo(() => {
    const hasAnyGenerator = generatorIds.some((id) => generatorsOwned[id] > 0);
    const hasTier4 = unlockedCurrencies.alterationOrb;
    const hasPrestige =
      hasTier4 &&
      (prestige.prestigeCount > 0 || prestige.mapsCompleted >= 1 || currencies.jewellersOrb >= 1);
    const hasTalents = prestige.totalMirrorShards > 0;
    const canPrestigeNow = canPrestige(currencies);
    return { hasAnyGenerator, hasTier4, hasPrestige, hasTalents, canPrestigeNow };
  }, [generatorsOwned, unlockedCurrencies, prestige, currencies]);

  const topStripState = useMemo(
    () => getTopStripState(currencies, currencyProduction, unlockedCurrencies),
    [currencies, currencyProduction, unlockedCurrencies],
  );

  const pageMeta = useMemo(() => {
    const now = Date.now();
    const cache = badgeCacheRef.current;
    const upgradesChanged = cache.purchasedUpgrades !== purchasedUpgrades;
    const throttleExpired = now - cache.lastComputedAt >= BADGE_THROTTLE_MS;

    let affordableUpgradeCount = cache.count;
    if (upgradesChanged || throttleExpired) {
      affordableUpgradeCount = getAffordableUpgradeCount({
        currencies,
        purchasedUpgrades,
        unlockedCurrencies,
        prestige,
      });
      badgeCacheRef.current = { count: affordableUpgradeCount, lastComputedAt: now, purchasedUpgrades };
    }

    return {
      upgrades: affordableUpgradeCount > 0 ? { badge: String(affordableUpgradeCount), tone: "ready" as const } : undefined,
      mapDevice: activeMap ? { badge: "Live", tone: "active" as const } : flags.hasTier4 ? { badge: "Ready", tone: "active" as const } : undefined,
      progress: flags.canPrestigeNow ? { badge: "Ready", tone: "alert" as const } : flags.hasTalents ? { badge: "Talents", tone: "active" as const } : undefined,
    };
  }, [currencies, purchasedUpgrades, unlockedCurrencies, prestige, activeMap, flags.hasTier4, flags.hasTalents, flags.canPrestigeNow]);

  const unlockedPages = useMemo(
    () => ({
      upgrades: flags.hasAnyGenerator,
      mapDevice: flags.hasTier4,
      progress: flags.hasPrestige || flags.hasTalents,
    } satisfies Partial<Record<PageId, boolean>>),
    [flags.hasAnyGenerator, flags.hasTier4, flags.hasPrestige, flags.hasTalents],
  );

  const mapStatusLabel = activeMap ? "Map running" : flags.hasTier4 ? "Map device unlocked" : "Atlas locked";

  return {
    ...flags,
    unlockedPages,
    pageMeta,
    topStripState,
    mapStatusLabel,
  };
}
