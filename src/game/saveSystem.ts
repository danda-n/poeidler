import { applyPassiveGeneration, createInitialGameState, GAME_VERSION, synchronizeGameState, type GameState } from "./gameEngine";
import { isMapComplete, baseMapMap, completeMap, applyMapRewards } from "./maps";
import { initialPrestigeState } from "./prestige";
import { initialTalentsPurchased, getMapRewardBonus } from "./talents";

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
  activeMap?: GameState["activeMap"];
  prestige?: GameState["prestige"];
  talentsPurchased?: GameState["talentsPurchased"];
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
    activeMap: gameState.activeMap,
    prestige: gameState.prestige,
    talentsPurchased: gameState.talentsPurchased,
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

    // Migrate prestige and talents with safe defaults
    const savedPrestige = savePayload.prestige
      ? { ...initialPrestigeState, ...savePayload.prestige }
      : { ...initialPrestigeState };
    const savedTalents = savePayload.talentsPurchased
      ? { ...initialTalentsPurchased, ...savePayload.talentsPurchased }
      : { ...initialTalentsPurchased };

    // Migrate activeMap: old saves may have mapId instead of craftedMap — discard them safely
    let savedActiveMap = savePayload.activeMap ?? null;
    if (savedActiveMap && !savedActiveMap.craftedMap) {
      savedActiveMap = null;
    }

    let nextState = synchronizeGameState({
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
      activeMap: savedActiveMap,
      prestige: savedPrestige,
      talentsPurchased: savedTalents,
    });

    // Handle offline map completion
    if (nextState.activeMap && isMapComplete(nextState.activeMap, now)) {
      const mapDef = baseMapMap[nextState.activeMap.craftedMap.baseMapId];
      if (mapDef) {
        const rewardBonus = getMapRewardBonus(nextState.talentsPurchased, nextState.prestige.lastMapFamilyStreak);
        const result = completeMap(mapDef, nextState.activeMap.craftedMap, rewardBonus);
        nextState.currencies = applyMapRewards(nextState.currencies, result);

        const isSameFamily = nextState.prestige.lastMapFamily === mapDef.family;
        nextState = {
          ...nextState,
          prestige: {
            ...nextState.prestige,
            mirrorShards: nextState.prestige.mirrorShards + result.shardAmount,
            totalMirrorShards: nextState.prestige.totalMirrorShards + result.shardAmount,
            mapsCompleted: nextState.prestige.mapsCompleted + 1,
            lastMapFamily: mapDef.family,
            lastMapFamilyStreak: isSameFamily ? nextState.prestige.lastMapFamilyStreak + 1 : 1,
          },
          activeMap: null,
          lastMapResult: result,
        };
      } else {
        nextState = { ...nextState, activeMap: null };
      }
    }

    nextState.currencies = applyPassiveGeneration(nextState.currencies, nextState.currencyProduction, elapsedSeconds);
    return synchronizeGameState(nextState);
  } catch {
    return initialState;
  }
}

export function clearSavedGame() {
  window.localStorage.removeItem(SAVE_KEY);
}
