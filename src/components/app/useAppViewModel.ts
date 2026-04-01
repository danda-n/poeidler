import { useMemo, useRef } from "react";
import { type PageId, type PageMeta } from "@/components/layout/NavRail";
import { generatorIds } from "@/game/generators";
import { canPrestige } from "@/game/prestige";
import { getAffordableUpgradeCount } from "@/game/upgradeEngine";
import { useGameStore } from "@/store/useGameStore";

type AppViewModel = {
  hasAnyGenerator: boolean;
  hasTier4: boolean;
  hasPrestige: boolean;
  hasTalents: boolean;
  canPrestigeNow: boolean;
  unlockedPages: Partial<Record<PageId, boolean>>;
  pageMeta: Partial<Record<PageId, PageMeta>>;
  mapStatusLabel: string;
};

const BADGE_THROTTLE_MS = 1000;

export function useAppViewModel(): AppViewModel {
  const currencies = useGameStore((s) => s.currencies);
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
    mapStatusLabel,
  };
}
