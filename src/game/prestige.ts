import {
  currencies,
  initialCurrencies,
  initialUnlockedCurrencies,
  type CurrencyId,
  type CurrencyState,
  type UnlockedCurrencyState,
} from "./currencies";
import { initialGeneratorsOwned, type GeneratorOwnedState } from "./generators";
import { initialPurchasedUpgrades, type PurchasedUpgradeState } from "./upgradeEngine";
import type { ActiveMapState } from "./maps";
import type { TalentPurchasedState } from "./talents";

// ── Balance Constants ──

export const PRESTIGE_BALANCE = {
  /** Minimum total equivalent fragment value to prestige */
  minimumValueForPrestige: 5000,
  /** Base formula: shards = floor(sqrt(totalValue / divisor)) */
  valueDivisor: 1000,
  /** Bonus shards per highest unlocked tier above tier 3 */
  tierBonusPerTier: 1,
  /** Minimum tier to get tier bonus */
  tierBonusMinTier: 4,
  /** Bonus shards per map completed this run */
  mapsCompletedBonus: 0.5,
  /** Cracked Mirror talent: +15% shards per rank */
  crackedMirrorPerRank: 0.15,
  /** Lingering Wealth talent: 2% currencies kept per rank */
  lingeringWealthPerRank: 0.02,
} as const;

// ── Prestige State ──

export type PrestigeState = {
  mirrorShards: number;
  totalMirrorShards: number;
  prestigeCount: number;
  mapsCompleted: number;
  lastMapFamily: string | null;
  lastMapFamilyStreak: number;
  lifetimeFragmentsProduced: number;
};

export const initialPrestigeState: PrestigeState = {
  mirrorShards: 0,
  totalMirrorShards: 0,
  prestigeCount: 0,
  mapsCompleted: 0,
  lastMapFamily: null,
  lastMapFamilyStreak: 0,
  lifetimeFragmentsProduced: 0,
};

// ── Prestige Helpers ──

export function getTotalCurrencyValue(currenciesState: CurrencyState): number {
  return currencies.reduce((total, def) => {
    return total + currenciesState[def.id] * def.baseValue;
  }, 0);
}

export function getHighestUnlockedTier(unlockedCurrencies: UnlockedCurrencyState): number {
  let highest = 1;
  currencies.forEach((def) => {
    if (unlockedCurrencies[def.id] && def.tier > highest) {
      highest = def.tier;
    }
  });
  return highest;
}

export function calculatePrestigeShards(
  currenciesState: CurrencyState,
  unlockedCurrencies: UnlockedCurrencyState,
  mapsCompleted: number,
  crackedMirrorRank: number,
): number {
  const totalValue = getTotalCurrencyValue(currenciesState);
  if (totalValue < PRESTIGE_BALANCE.minimumValueForPrestige) return 0;

  const baseShards = Math.floor(Math.sqrt(totalValue / PRESTIGE_BALANCE.valueDivisor));

  const highestTier = getHighestUnlockedTier(unlockedCurrencies);
  const tierBonus = Math.max(0, highestTier - PRESTIGE_BALANCE.tierBonusMinTier + 1) * PRESTIGE_BALANCE.tierBonusPerTier;

  const mapBonus = Math.floor(mapsCompleted * PRESTIGE_BALANCE.mapsCompletedBonus);

  const subtotal = baseShards + tierBonus + mapBonus;

  const crackedMirrorMultiplier = 1 + crackedMirrorRank * PRESTIGE_BALANCE.crackedMirrorPerRank;

  return Math.max(0, Math.floor(subtotal * crackedMirrorMultiplier));
}

export function canPrestige(
  currenciesState: CurrencyState,
): boolean {
  const totalValue = getTotalCurrencyValue(currenciesState);
  return totalValue >= PRESTIGE_BALANCE.minimumValueForPrestige;
}

export type PrestigeResult = {
  currencies: CurrencyState;
  generatorsOwned: GeneratorOwnedState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedCurrencies: UnlockedCurrencyState;
  activeMap: ActiveMapState;
  prestige: PrestigeState;
};

export function performPrestige(
  currenciesState: CurrencyState,
  unlockedCurrencies: UnlockedCurrencyState,
  prestige: PrestigeState,
  talentsPurchased: TalentPurchasedState,
): PrestigeResult | null {
  const crackedMirrorRank = talentsPurchased.crackedMirror ?? 0;
  const lingeringWealthRank = talentsPurchased.lingeringWealth ?? 0;

  const shardsGained = calculatePrestigeShards(
    currenciesState,
    unlockedCurrencies,
    prestige.mapsCompleted,
    crackedMirrorRank,
  );

  if (shardsGained <= 0) return null;

  // Lingering Wealth: keep a small % of lower currencies
  const keptCurrencies = { ...initialCurrencies };
  if (lingeringWealthRank > 0) {
    const keepPercent = lingeringWealthRank * PRESTIGE_BALANCE.lingeringWealthPerRank;
    // Only keep tier 1-4 currencies
    const keepableTiers = new Set<CurrencyId>(["fragmentOfWisdom", "transmutationOrb", "augmentationOrb", "alterationOrb"]);
    keepableTiers.forEach((currencyId) => {
      keptCurrencies[currencyId] = Math.floor(currenciesState[currencyId] * keepPercent);
    });
  }

  return {
    currencies: keptCurrencies,
    generatorsOwned: { ...initialGeneratorsOwned },
    purchasedUpgrades: { ...initialPurchasedUpgrades },
    unlockedCurrencies: { ...initialUnlockedCurrencies },
    activeMap: null,
    prestige: {
      mirrorShards: prestige.mirrorShards + shardsGained,
      totalMirrorShards: prestige.totalMirrorShards + shardsGained,
      prestigeCount: prestige.prestigeCount + 1,
      mapsCompleted: 0,
      lastMapFamily: null,
      lastMapFamilyStreak: 0,
      lifetimeFragmentsProduced: prestige.lifetimeFragmentsProduced,
    },
  };
}
