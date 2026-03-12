import {
  currencies,
  getTotalCurrencyValue,
  initialCurrencies,
  initialUnlockedCurrencies,
  type CurrencyId,
  type CurrencyState,
  type UnlockedCurrencyState,
} from "./currencies";
import { initialGeneratorsOwned, type GeneratorOwnedState } from "./generators";
import {
  getEncounterPrestigeUpgradeBonus,
  getPrestigeShardUpgradeBonus,
  initialPurchasedUpgrades,
  type PurchasedUpgradeState,
} from "./upgradeEngine";
import type { ActiveMapState, MapEncounterId } from "./maps";
import { getEncounterPrestigeBonus, type TalentPurchasedState } from "./talents";
import { resetDeviceModifiers, type MapDeviceState } from "./mapDevice";

export const PRESTIGE_BALANCE = {
  minimumValueForPrestige: 5000,
  valueDivisor: 650,
  tierBonusPerTier: 2,
  tierBonusMinTier: 4,
  mapsCompletedBonus: 1.0,
  encounterMapsBonus: 1.5,
  crackedMirrorPerRank: 0.15,
  lingeringWealthPerRank: 0.02,
} as const;

export type PrestigeState = {
  mirrorShards: number;
  totalMirrorShards: number;
  prestigeCount: number;
  mapsCompleted: number;
  encounterMapsCompleted: number;
  lastMapFamily: string | null;
  lastMapFamilyStreak: number;
  lastEncounterId: MapEncounterId | null;
  lastEncounterStreak: number;
  lifetimeFragmentsProduced: number;
};

export const initialPrestigeState: PrestigeState = {
  mirrorShards: 0,
  totalMirrorShards: 0,
  prestigeCount: 0,
  mapsCompleted: 0,
  encounterMapsCompleted: 0,
  lastMapFamily: null,
  lastMapFamilyStreak: 0,
  lastEncounterId: null,
  lastEncounterStreak: 0,
  lifetimeFragmentsProduced: 0,
};

export function getHighestUnlockedTier(unlockedCurrencies: UnlockedCurrencyState): number {
  let highest = 1;
  currencies.forEach((currency) => {
    if (unlockedCurrencies[currency.id] && currency.tier > highest) highest = currency.tier;
  });
  return highest;
}

export function calculatePrestigeShards(
  currenciesState: CurrencyState,
  unlockedCurrencies: UnlockedCurrencyState,
  mapsCompleted: number,
  encounterMapsCompleted: number,
  crackedMirrorRank: number,
  encounterBonusMultiplier = 0,
) {
  const totalValue = getTotalCurrencyValue(currenciesState);
  if (totalValue < PRESTIGE_BALANCE.minimumValueForPrestige) return 0;

  const baseShards = Math.floor(Math.sqrt(totalValue / PRESTIGE_BALANCE.valueDivisor));
  const highestTier = getHighestUnlockedTier(unlockedCurrencies);
  const tierBonus = Math.max(0, highestTier - PRESTIGE_BALANCE.tierBonusMinTier + 1) * PRESTIGE_BALANCE.tierBonusPerTier;
  const mapBonus = Math.floor(mapsCompleted * PRESTIGE_BALANCE.mapsCompletedBonus);
  const encounterBonusBase = Math.floor(encounterMapsCompleted * PRESTIGE_BALANCE.encounterMapsBonus);
  const encounterBonus = Math.floor(encounterBonusBase * Math.max(0, 1 + encounterBonusMultiplier));
  const subtotal = baseShards + tierBonus + mapBonus + encounterBonus;
  const crackedMirrorMultiplier = 1 + crackedMirrorRank * PRESTIGE_BALANCE.crackedMirrorPerRank;

  return Math.max(0, Math.floor(subtotal * crackedMirrorMultiplier));
}

export function canPrestige(currenciesState: CurrencyState): boolean {
  return getTotalCurrencyValue(currenciesState) >= PRESTIGE_BALANCE.minimumValueForPrestige;
}

export type PrestigeResult = {
  currencies: CurrencyState;
  generatorsOwned: GeneratorOwnedState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedCurrencies: UnlockedCurrencyState;
  activeMap: ActiveMapState;
  prestige: PrestigeState;
  mapDevice: MapDeviceState;
};

export function performPrestige(
  currenciesState: CurrencyState,
  unlockedCurrencies: UnlockedCurrencyState,
  prestige: PrestigeState,
  talentsPurchased: TalentPurchasedState,
  purchasedUpgrades: PurchasedUpgradeState,
  mapDevice: MapDeviceState,
): PrestigeResult | null {
  const crackedMirrorRank = talentsPurchased.crackedMirror ?? 0;
  const lingeringWealthRank = talentsPurchased.lingeringWealth ?? 0;
  const encounterBonusMultiplier = getEncounterPrestigeBonus(talentsPurchased) + getEncounterPrestigeUpgradeBonus(purchasedUpgrades);

  const baseShards = calculatePrestigeShards(
    currenciesState,
    unlockedCurrencies,
    prestige.mapsCompleted,
    prestige.encounterMapsCompleted,
    crackedMirrorRank,
    encounterBonusMultiplier,
  );
  const shardUpgradeMultiplier = 1 + getPrestigeShardUpgradeBonus(purchasedUpgrades);
  const shardsGained = Math.max(0, Math.floor(baseShards * shardUpgradeMultiplier));

  if (shardsGained <= 0) return null;

  const keptCurrencies = { ...initialCurrencies };
  if (lingeringWealthRank > 0) {
    const keepPercent = lingeringWealthRank * PRESTIGE_BALANCE.lingeringWealthPerRank;
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
      encounterMapsCompleted: 0,
      lastMapFamily: null,
      lastMapFamilyStreak: 0,
      lastEncounterId: null,
      lastEncounterStreak: 0,
      lifetimeFragmentsProduced: prestige.lifetimeFragmentsProduced,
    },
    mapDevice: resetDeviceModifiers(mapDevice),
  };
}
