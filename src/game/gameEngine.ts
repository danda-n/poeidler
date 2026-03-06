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
import { autoConvertCurrencies } from "./conversionEngine";

export type GameSettings = {
  version: string;
};

export type GameState = {
  currencies: CurrencyState;
  currencyProduction: CurrencyProduction;
  currencyMultipliers: CurrencyMultipliers;
  generatorsOwned: GeneratorOwnedState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedFeatures: FeatureState;
  unlockedCurrencies: UnlockedCurrencyState;
  settings: GameSettings;
  lastSaveTime: number | null;
};

export const GAME_VERSION = "0.4.1";
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
  const { currencyMultipliers, unlockedFeatures } = applyUpgradeEffects(gameState.purchasedUpgrades);
  const currencyProduction = calculateCurrencyProduction(gameState.generatorsOwned, currencyMultipliers);
  const unlockedCurrencies = unlockCurrencies(gameState.unlockedCurrencies, currencyProduction);

  return {
    ...gameState,
    currencyMultipliers,
    unlockedFeatures,
    currencyProduction,
    unlockedCurrencies,
  };
}

export function createInitialGameState(): GameState {
  return synchronizeGameState({
    currencies: { ...initialCurrencies },
    currencyProduction: { ...initialCurrencyProduction },
    currencyMultipliers: { ...initialCurrencyMultipliers },
    generatorsOwned: { ...initialGeneratorsOwned },
    purchasedUpgrades: { ...initialPurchasedUpgrades },
    unlockedFeatures: { ...initialUnlockedFeatures },
    unlockedCurrencies: { ...initialUnlockedCurrencies },
    settings: { version: GAME_VERSION },
    lastSaveTime: null,
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
  const synchronizedState = synchronizeGameState(gameState);
  const currenciesWithProduction = applyPassiveGeneration(
    synchronizedState.currencies,
    synchronizedState.currencyProduction,
    deltaTimeSeconds,
  );

  return synchronizeGameState({
    ...synchronizedState,
    currencies: autoConvertCurrencies(
      currenciesWithProduction,
      synchronizedState.purchasedUpgrades,
      synchronizedState.generatorsOwned,
      synchronizedState.unlockedFeatures,
      synchronizedState.unlockedCurrencies,
    ),
  });
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
