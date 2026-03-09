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
  initialPurchasedUpgrades,
  initialUnlockedFeatures,
  type FeatureState,
  type PurchasedUpgradeState,
} from "./upgradeEngine";
import {
  type ActiveMapState,
  isMapComplete,
  mapMap,
  completeMap,
  applyMapRewards,
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
};

export const GAME_VERSION = "0.8.0";
export const TICK_RATE_MS = 100;

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

  // Apply talent click power bonus
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
  });
}

export function applyPassiveGeneration(
  currenciesState: CurrencyState,
  currencyProduction: CurrencyProduction,
  deltaTimeSeconds: number,
) {
  const nextCurrencies = { ...currenciesState };

  Object.entries(currencyProduction).forEach(([currencyId, rate]) => {
    if (rate <= 0) {
      return;
    }

    nextCurrencies[currencyId as keyof CurrencyState] += rate * deltaTimeSeconds;
  });

  return nextCurrencies;
}

export function runGameTick(gameState: GameState, deltaTimeSeconds: number) {
  let state = synchronizeGameState(gameState);
  let currencies = applyPassiveGeneration(
    state.currencies,
    state.currencyProduction,
    deltaTimeSeconds,
  );

  // Track lifetime fragment production
  const fragmentProduced = state.currencyProduction.fragmentOfWisdom * deltaTimeSeconds;
  let prestige = state.prestige;
  if (fragmentProduced > 0) {
    prestige = {
      ...prestige,
      lifetimeFragmentsProduced: prestige.lifetimeFragmentsProduced + fragmentProduced,
    };
  }

  // Check map completion
  let activeMap = state.activeMap;
  if (activeMap && isMapComplete(activeMap, Date.now())) {
    const mapDef = mapMap[activeMap.mapId];
    if (mapDef) {
      const rewardBonus = getMapRewardBonus(state.talentsPurchased, prestige.lastMapFamilyStreak);
      const shardMultiplier = 1;
      const result = completeMap(mapDef, rewardBonus, shardMultiplier);
      currencies = applyMapRewards(currencies, result);

      const isSameFamily = prestige.lastMapFamily === mapDef.family;
      prestige = {
        ...prestige,
        mirrorShards: prestige.mirrorShards + result.shardReward,
        totalMirrorShards: prestige.totalMirrorShards + result.shardReward,
        mapsCompleted: prestige.mapsCompleted + 1,
        lastMapFamily: mapDef.family,
        lastMapFamilyStreak: isSameFamily ? prestige.lastMapFamilyStreak + 1 : 1,
      };
    }
    activeMap = null;
  }

  return {
    ...state,
    currencies,
    activeMap,
    prestige,
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
