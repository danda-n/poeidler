import {
  getTotalCurrencyValue,
  initialCurrencies,
  initialCurrencyMultipliers,
  initialCurrencyProduction,
  initialUnlockedCurrencies,
  unlockCurrencies,
  type CurrencyMultipliers,
  type CurrencyProduction,
  type CurrencyState,
  type UnlockedCurrencyState,
} from "./currencies";
import {
  generators,
  getGeneratorOutputMultiplier,
  initialGeneratorsOwned,
  type GeneratorOwnedState,
} from "./generators";
import {
  applyUpgradeEffects,
  augmentDeviceEffectsForUpgrades,
  getBaseMapRewardUpgradeBonus,
  getMapShardChanceUpgradeBonus,
  getMapSpeedUpgradeBonus,
  initialPurchasedUpgrades,
  initialUnlockedFeatures,
  type FeatureState,
  type PurchasedUpgradeState,
} from "./upgradeEngine";
import {
  applyMapRewards,
  completeMap,
  getEncounterAdjustedStreak,
  getEncounterChain,
  getEncounterRewardTags,
  getMapIncomeSnapshot,
  hasMapEncounter,
  isMapComplete,
  startMap,
  type ActiveMapState,
  type MapCompletionResult,
  type MapNotification,
  type QueuedMapSetup,
} from "./maps";
import { getBaseMap } from "./registry";
import { initialMapDeviceState, resolveLoadoutEffects, type MapDeviceState } from "./mapDevice";
import { initialPrestigeState, type PrestigeState } from "./prestige";
import {
  getBreakpointBonus,
  getClickPowerBonus,
  getEncounterRewardBonus,
  getEncounterSpeedBonus,
  getMapCostReduction,
  getMapRewardBonus,
  getMapSpeedBonus,
  initialTalentsPurchased,
  type TalentPurchasedState,
} from "./talents";

export type GameSettings = {
  version: string;
};

export type GameState = {
  currencies: CurrencyState;
  currencyProduction: CurrencyProduction;
  currencyMultipliers: CurrencyMultipliers;
  clickMultiplier: number;
  generatorsOwned: GeneratorOwnedState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedFeatures: FeatureState;
  unlockedCurrencies: UnlockedCurrencyState;
  settings: GameSettings;
  lastSaveTime: number | null;
  activeMap: ActiveMapState;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  lastMapResult: MapCompletionResult | null;
  mapDevice: MapDeviceState;
  queuedMap: QueuedMapSetup | null;
  mapNotification: MapNotification | null;
};

export const GAME_VERSION = "1.0.0";
export const TICK_RATE_MS = 100;

const NOTIFICATION_TTL_MS = 8000;

export function calculateCurrencyProduction(generatorsOwned: GeneratorOwnedState, currencyMultipliers: CurrencyMultipliers) {
  const currencyProduction = { ...initialCurrencyProduction };

  generators.forEach((generator) => {
    const owned = generatorsOwned[generator.id];
    if (owned <= 0) return;

    currencyProduction[generator.currency] += owned
      * generator.baseRate
      * currencyMultipliers[generator.currency]
      * getGeneratorOutputMultiplier(generator, owned);
  });

  return currencyProduction;
}

export function getRunStartMapBonuses(
  craftedMap: NonNullable<QueuedMapSetup["craftedMap"]>,
  prestige: PrestigeState,
  talentsPurchased: TalentPurchasedState,
  purchasedUpgrades: PurchasedUpgradeState,
) {
  const mapDef = getBaseMap(craftedMap.baseMapId);
  if (!mapDef) return { rewardBonus: 0, shardChanceBonus: 0, speedBonus: 0, encounterChain: 0 };

  const streakAtStart = prestige.lastMapFamily === mapDef.family ? prestige.lastMapFamilyStreak : 0;
  const adjustedStreak = getEncounterAdjustedStreak(craftedMap, streakAtStart);
  const hasEncounter = hasMapEncounter(craftedMap);
  const encounterChain = getEncounterChain(craftedMap, {
    mapsCompleted: prestige.mapsCompleted,
    totalMirrorShards: prestige.totalMirrorShards,
    prestigeCount: prestige.prestigeCount,
    lastEncounterId: prestige.lastEncounterId,
    lastEncounterStreak: prestige.lastEncounterStreak,
  });
  const expeditionChainRewardBonus = craftedMap.encounterId === "expedition" ? encounterChain * 0.06 : 0;
  const expeditionChainShardBonus = craftedMap.encounterId === "expedition" ? encounterChain * 0.0015 : 0;
  const rewardBonus =
    getMapRewardBonus(talentsPurchased, adjustedStreak)
    + getEncounterRewardBonus(talentsPurchased, hasEncounter)
    + expeditionChainRewardBonus
    + getBaseMapRewardUpgradeBonus(purchasedUpgrades, {
      tier: mapDef.tier,
      streak: adjustedStreak,
      totalMirrorShards: prestige.totalMirrorShards,
      encounterTags: getEncounterRewardTags(craftedMap),
      hasEncounter,
    });
  const shardChanceBonus = getMapShardChanceUpgradeBonus(purchasedUpgrades, prestige.totalMirrorShards, hasEncounter) + expeditionChainShardBonus;
  const speedBonus = getMapSpeedBonus(talentsPurchased) + getEncounterSpeedBonus(talentsPurchased, hasEncounter) + getMapSpeedUpgradeBonus(purchasedUpgrades);

  return { rewardBonus, shardChanceBonus, speedBonus, encounterChain };
}

type SyncCache = {
  purchasedUpgrades: PurchasedUpgradeState;
  generatorsOwned: GeneratorOwnedState;
  talentsPurchased: TalentPurchasedState;
  unlockedCurrenciesIn: UnlockedCurrencyState;
  currencyMultipliers: CurrencyMultipliers;
  unlockedFeatures: FeatureState;
  clickMultiplier: number;
  currencyProduction: CurrencyProduction;
  unlockedCurrencies: UnlockedCurrencyState;
};

let syncCache: SyncCache | null = null;

export function synchronizeGameState(gameState: GameState) {
  if (
    syncCache
    && syncCache.purchasedUpgrades === gameState.purchasedUpgrades
    && syncCache.generatorsOwned === gameState.generatorsOwned
    && syncCache.talentsPurchased === gameState.talentsPurchased
    && syncCache.unlockedCurrenciesIn === gameState.unlockedCurrencies
  ) {
    return {
      ...gameState,
      currencyMultipliers: syncCache.currencyMultipliers,
      unlockedFeatures: syncCache.unlockedFeatures,
      clickMultiplier: syncCache.clickMultiplier,
      currencyProduction: syncCache.currencyProduction,
      unlockedCurrencies: syncCache.unlockedCurrencies,
    };
  }

  const { currencyMultipliers, unlockedFeatures, clickMultiplier } = applyUpgradeEffects(
    gameState.purchasedUpgrades,
    getBreakpointBonus(gameState.talentsPurchased),
  );

  const talentClickBonus = getClickPowerBonus(gameState.talentsPurchased);
  const adjustedClickMultiplier = clickMultiplier * (1 + talentClickBonus);
  const currencyProduction = calculateCurrencyProduction(gameState.generatorsOwned, currencyMultipliers);
  const unlockedCurrencies = unlockCurrencies(gameState.unlockedCurrencies, currencyProduction);

  syncCache = {
    purchasedUpgrades: gameState.purchasedUpgrades,
    generatorsOwned: gameState.generatorsOwned,
    talentsPurchased: gameState.talentsPurchased,
    unlockedCurrenciesIn: gameState.unlockedCurrencies,
    currencyMultipliers,
    unlockedFeatures,
    clickMultiplier: adjustedClickMultiplier,
    currencyProduction,
    unlockedCurrencies,
  };

  return {
    ...gameState,
    currencyMultipliers,
    unlockedFeatures,
    clickMultiplier: adjustedClickMultiplier,
    currencyProduction,
    unlockedCurrencies,
  };
}

export function createInitialGameState(): GameState {
  return synchronizeGameState({
    currencies: { ...initialCurrencies },
    currencyProduction: { ...initialCurrencyProduction },
    currencyMultipliers: { ...initialCurrencyMultipliers },
    clickMultiplier: 1,
    generatorsOwned: { ...initialGeneratorsOwned },
    purchasedUpgrades: { ...initialPurchasedUpgrades },
    unlockedFeatures: { ...initialUnlockedFeatures },
    unlockedCurrencies: { ...initialUnlockedCurrencies },
    settings: { version: GAME_VERSION },
    lastSaveTime: null,
    activeMap: null,
    prestige: { ...initialPrestigeState },
    talentsPurchased: { ...initialTalentsPurchased },
    lastMapResult: null,
    mapDevice: { ...initialMapDeviceState },
    queuedMap: null,
    mapNotification: null,
  });
}

export function applyPassiveGeneration(currenciesState: CurrencyState, currencyProduction: CurrencyProduction, deltaTimeSeconds: number) {
  const nextCurrencies = { ...currenciesState };

  Object.entries(currencyProduction).forEach(([currencyId, rate]) => {
    if (rate <= 0) return;
    nextCurrencies[currencyId] += rate * deltaTimeSeconds;
  });

  return nextCurrencies;
}

export function runGameTick(gameState: GameState, deltaTimeSeconds: number) {
  const state = synchronizeGameState(gameState);
  let currencies = applyPassiveGeneration(state.currencies, state.currencyProduction, deltaTimeSeconds);

  const fragmentProduced = state.currencyProduction.fragmentOfWisdom * deltaTimeSeconds;
  let prestige = state.prestige;
  if (fragmentProduced > 0) {
    prestige = {
      ...prestige,
      lifetimeFragmentsProduced: prestige.lifetimeFragmentsProduced + fragmentProduced,
    };
  }

  const now = Date.now();
  let activeMap = state.activeMap;
  let lastMapResult = state.lastMapResult;
  let queuedMap = state.queuedMap;
  let mapNotification = state.mapNotification;

  if (mapNotification && now - mapNotification.timestamp > NOTIFICATION_TTL_MS) {
    mapNotification = null;
  }

  if (activeMap && isMapComplete(activeMap, now)) {
    const mapDef = getBaseMap(activeMap.craftedMap.baseMapId);
    if (mapDef) {
      const result = completeMap(mapDef, activeMap);
      currencies = applyMapRewards(currencies, result);
      lastMapResult = result;
      mapNotification = { result, mapName: mapDef.name, timestamp: now };

      const isSameFamily = prestige.lastMapFamily === mapDef.family;
      const isSameEncounter = result.encounterId !== null && prestige.lastEncounterId === result.encounterId;
      prestige = {
        ...prestige,
        mirrorShards: prestige.mirrorShards + result.shardAmount,
        totalMirrorShards: prestige.totalMirrorShards + result.shardAmount,
        mapsCompleted: prestige.mapsCompleted + 1,
        encounterMapsCompleted: prestige.encounterMapsCompleted + (result.encounterId ? 1 : 0),
        lastMapFamily: mapDef.family,
        lastMapFamilyStreak: isSameFamily ? prestige.lastMapFamilyStreak + 1 : 1,
        lastEncounterId: result.encounterId,
        lastEncounterStreak: result.encounterId ? (isSameEncounter ? prestige.lastEncounterStreak + 1 : 1) : 0,
      };
    }
    activeMap = null;

    if (queuedMap) {
      const queuedMapDef = getBaseMap(queuedMap.baseMapId);
      if (queuedMapDef) {
        const costReduction = getMapCostReduction(state.talentsPurchased);
        const { rewardBonus, shardChanceBonus, speedBonus, encounterChain } = getRunStartMapBonuses(
          queuedMap.craftedMap,
          prestige,
          state.talentsPurchased,
          state.purchasedUpgrades,
        );
        const deviceEffects = augmentDeviceEffectsForUpgrades(
          resolveLoadoutEffects(queuedMap.deviceLoadout),
          state.purchasedUpgrades,
          true,
        );
        const incomePerSecond = getMapIncomeSnapshot(state.currencyProduction);
        const wealthValue = getTotalCurrencyValue(currencies);
        const startResult = startMap(
          currencies,
          queuedMapDef,
          queuedMap.craftedMap,
          costReduction,
          speedBonus,
          deviceEffects,
          incomePerSecond,
          wealthValue,
          rewardBonus,
          shardChanceBonus,
          encounterChain,
        );
        if (startResult) {
          currencies = startResult.currencies;
          activeMap = startResult.activeMap;
        }
      }
      queuedMap = null;
    }
  }

  return {
    ...state,
    currencies,
    activeMap,
    prestige,
    lastMapResult,
    queuedMap,
    mapNotification,
  };
}

export function startGameEngine(updateState: (updater: (currentState: GameState) => GameState) => void) {
  let lastTickTime = Date.now();

  const intervalId = window.setInterval(() => {
    const now = Date.now();
    const deltaTimeSeconds = (now - lastTickTime) / 1000;
    lastTickTime = now;

    updateState((currentState) => runGameTick(currentState, deltaTimeSeconds));
  }, TICK_RATE_MS);

  return () => window.clearInterval(intervalId);
}
