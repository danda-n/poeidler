import { applyPassiveGeneration, createInitialGameState, GAME_VERSION, synchronizeGameState, type GameState } from "./gameEngine";

export const SAVE_KEY = "poe-idle-save";
export const AUTOSAVE_INTERVAL_MS = 5000;
const MAX_OFFLINE_PROGRESS_MS = 8 * 60 * 60 * 1000;

type SavePayload = {
  currencies: GameState["currencies"];
  generatorsOwned: GameState["generatorsOwned"];
  purchasedUpgrades: GameState["purchasedUpgrades"];
  unlockedCurrencies: GameState["unlockedCurrencies"];
  settings: GameState["settings"];
  lastSaveTime: number;
};

function isSavePayload(payload: unknown): payload is SavePayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.currencies === "object" && candidate.currencies !== null &&
    typeof candidate.generatorsOwned === "object" && candidate.generatorsOwned !== null &&
    typeof candidate.purchasedUpgrades === "object" && candidate.purchasedUpgrades !== null &&
    typeof candidate.lastSaveTime === "number"
  );
}

export function saveGameState(gameState: GameState, timestamp = Date.now()) {
  const payload: SavePayload = {
    currencies: gameState.currencies,
    generatorsOwned: gameState.generatorsOwned,
    purchasedUpgrades: gameState.purchasedUpgrades,
    unlockedCurrencies: gameState.unlockedCurrencies,
    settings: gameState.settings,
    lastSaveTime: timestamp,
  };

  window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  return timestamp;
}

export function loadGameState() {
  const initialState = createInitialGameState();
  const rawSave = window.localStorage.getItem(SAVE_KEY);

  if (!rawSave) {
    return initialState;
  }

  try {
    const parsedSave = JSON.parse(rawSave) as unknown;

    if (!isSavePayload(parsedSave)) {
      return initialState;
    }

    const savePayload = parsedSave as SavePayload;
    const now = Date.now();
    const elapsedMilliseconds = Math.max(0, Math.min(now - savePayload.lastSaveTime, MAX_OFFLINE_PROGRESS_MS));
    const elapsedSeconds = elapsedMilliseconds / 1000;

    const nextState = synchronizeGameState({
      ...initialState,
      currencies: {
        ...initialState.currencies,
        ...savePayload.currencies,
      },
      generatorsOwned: {
        ...initialState.generatorsOwned,
        ...savePayload.generatorsOwned,
      },
      purchasedUpgrades: {
        ...initialState.purchasedUpgrades,
        ...savePayload.purchasedUpgrades,
      },
      unlockedCurrencies: {
        ...initialState.unlockedCurrencies,
        ...savePayload.unlockedCurrencies,
      },
      settings: {
        version: GAME_VERSION,
      },
      lastSaveTime: savePayload.lastSaveTime,
    });

    nextState.currencies = applyPassiveGeneration(nextState.currencies, nextState.currencyProduction, elapsedSeconds);
    return synchronizeGameState(nextState);
  } catch {
    return initialState;
  }
}

export function clearSavedGame() {
  window.localStorage.removeItem(SAVE_KEY);
}
