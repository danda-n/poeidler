import {
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
  initialGeneratorsOwned,
  type GeneratorOwnedState,
} from "./generators";
import {
  applyUpgradeEffects,
  getMapRewardUpgradeBonus,
  getMapShardChanceUpgradeBonus,
  initialPurchasedUpgrades,
  initialUnlockedFeatures,
  type FeatureState,
  type PurchasedUpgradeState,
} from "./upgradeEngine";
import {
  type ActiveMapState,
  type MapCompletionResult,
  type QueuedMapSetup,
  type MapNotification,
  isMapComplete,
  baseMapMap,
  completeMap,
  applyMapRewards,
  getMapIncomeSnapshot,
  startMap,
} from "./maps";
import {
  initialPrestigeState,
  type PrestigeState,
} from "./prestige";
import {
  initialTalentsPurchased,
  getClickPowerBonus,
  getBreakpointBonus,
  getMapRewardBonus,
  getMapCostReduction,
  getMapSpeedBonus,
  type TalentPurchasedState,
} from "./talents";
import {
  initialMapDeviceState,
  resolveLoadoutEffects,
  type MapDeviceState,
} from "./mapDevice";

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

export function calculateCurrencyProduction(
  generatorsOwned: GeneratorOwnedState,
  currencyMultipliers: CurrencyMultipliers,
) {
  const currencyProduction = { ...initialCurrencyProduction };

  generators.forEach((generator) => {
    currencyProduction[generator.currency] +=
      generatorsOwned[generator.id] * generator.baseRate * currencyMultipliers[generator.currency];
  });

  return currencyProduction;
}

export function synchronizeGameState(gameState: GameState) {
  const { currencyMultipliers, unlockedFeatures, clickMultiplier } = applyUpgradeEffects(
    gameState.purchasedUpgrades,
    getBreakpointBonus(gameState.talentsPurchased),
  );

  const talentClickBonus = getClickPowerBonus(gameState.talentsPurchased);
  const adjustedClickMultiplier = clickMultiplier * (1 + talentClickBonus);

  const currencyProduction = calculateCurrencyProduction(gameState.generatorsOwned, currencyMultipliers);
  const unlockedCurrencies = unlockCurrencies(gameState.unlockedCurrencies, currencyProduction);

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

export function applyPassiveGeneration(
  currenciesState: CurrencyState,
  currencyProduction: CurrencyProduction,
  deltaTimeSeconds: number,
) {
  const nextCurrencies = { ...currenciesState };

  Object.entries(currencyProduction).forEach(([currencyId, rate]) => {
    if (rate <= 0) return;
    nextCurrencies[currencyId as keyof CurrencyState] += rate * deltaTimeSeconds;
  });

  return nextCurrencies;
}

export function runGameTick(gameState: GameState, deltaTimeSeconds: number) {
  let state = synchronizeGameState(gameState);
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
    const mapDef = baseMapMap[activeMap.craftedMap.baseMapId];
    if (mapDef) {
      const rewardBonus = getMapRewardBonus(state.talentsPurchased, prestige.lastMapFamilyStreak) + getMapRewardUpgradeBonus(state.purchasedUpgrades);
      const shardChanceBonus = getMapShardChanceUpgradeBonus(state.purchasedUpgrades);
      const result = completeMap(mapDef, activeMap, rewardBonus, shardChanceBonus);
      currencies = applyMapRewards(currencies, result);
      lastMapResult = result;
      mapNotification = { result, mapName: mapDef.name, timestamp: now };

      const isSameFamily = prestige.lastMapFamily === mapDef.family;
      prestige = {
        ...prestige,
        mirrorShards: prestige.mirrorShards + result.shardAmount,
        totalMirrorShards: prestige.totalMirrorShards + result.shardAmount,
        mapsCompleted: prestige.mapsCompleted + 1,
        lastMapFamily: mapDef.family,
        lastMapFamilyStreak: isSameFamily ? prestige.lastMapFamilyStreak + 1 : 1,
      };
    }
    activeMap = null;

    if (queuedMap) {
      const queuedMapDef = baseMapMap[queuedMap.baseMapId];
      if (queuedMapDef) {
        const costReduction = getMapCostReduction(state.talentsPurchased);
        const speedBonus = getMapSpeedBonus(state.talentsPurchased);
        const deviceEffects = resolveLoadoutEffects(queuedMap.deviceLoadout);
        const incomePerSecond = getMapIncomeSnapshot(state.currencyProduction);
        const startResult = startMap(currencies, queuedMapDef, queuedMap.craftedMap, costReduction, speedBonus, deviceEffects, incomePerSecond);
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
    unlockedCurrencies: unlockCurrencies(state.unlockedCurrencies, state.currencyProduction),
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
