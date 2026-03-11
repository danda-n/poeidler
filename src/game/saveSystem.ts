import { applyPassiveGeneration, createInitialGameState, GAME_VERSION, synchronizeGameState, type GameState } from "./gameEngine";
import { isMapComplete, baseMapMap, completeMap, applyMapRewards, startMap, hydrateCraftedMap, getMapIncomeSnapshot, type QueuedMapSetup } from "./maps";
import { initialPrestigeState } from "./prestige";
import { initialTalentsPurchased, getMapRewardBonus, getMapCostReduction, getMapSpeedBonus } from "./talents";
import {
  augmentDeviceEffectsForUpgrades,
  getBaseMapRewardUpgradeBonus,
  getMapShardChanceUpgradeBonus,
} from "./upgradeEngine";
import { initialMapDeviceState, type MapDeviceState, resolveLoadoutEffects, emptyDeviceLoadout } from "./mapDevice";

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
  mapDevice?: MapDeviceState;
  queuedMap?: QueuedMapSetup;
};

function isSavePayload(payload: unknown): payload is SavePayload {
  if (!payload || typeof payload !== "object") return false;
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
    mapDevice: gameState.mapDevice,
    queuedMap: gameState.queuedMap ?? undefined,
  };

  window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  return timestamp;
}

const emptyDeviceEffects = {
  rewardMultiplier: 0,
  focusedRewardMultiplier: 0,
  durationMultiplier: 0,
  costMultiplier: 0,
  bonusRewardChance: 0,
  shardChanceBonus: 0,
};

function resolveLoadStateMapCompletion(nextState: ReturnType<typeof synchronizeGameState>, now: number): typeof nextState {
  if (!nextState.activeMap || !isMapComplete(nextState.activeMap, now)) return nextState;

  const mapDef = baseMapMap[nextState.activeMap.craftedMap.baseMapId];
  if (!mapDef) return { ...nextState, activeMap: null };

  const currentStreak = nextState.prestige.lastMapFamily === mapDef.family ? nextState.prestige.lastMapFamilyStreak : 0;
  const rewardBonus = getMapRewardBonus(nextState.talentsPurchased, currentStreak) + getBaseMapRewardUpgradeBonus(nextState.purchasedUpgrades, {
    tier: mapDef.tier,
    streak: currentStreak,
    totalMirrorShards: nextState.prestige.totalMirrorShards,
  });
  const shardChanceBonus = getMapShardChanceUpgradeBonus(nextState.purchasedUpgrades, nextState.prestige.totalMirrorShards);
  const result = completeMap(mapDef, nextState.activeMap, rewardBonus, shardChanceBonus);
  let currencies = applyMapRewards(nextState.currencies, result);

  const isSameFamily = nextState.prestige.lastMapFamily === mapDef.family;
  const updatedPrestige = {
    ...nextState.prestige,
    mirrorShards: nextState.prestige.mirrorShards + result.shardAmount,
    totalMirrorShards: nextState.prestige.totalMirrorShards + result.shardAmount,
    mapsCompleted: nextState.prestige.mapsCompleted + 1,
    lastMapFamily: mapDef.family,
    lastMapFamilyStreak: isSameFamily ? nextState.prestige.lastMapFamilyStreak + 1 : 1,
  };

  let activeMap = null;
  let queuedMap = nextState.queuedMap;

  if (queuedMap) {
    const queuedMapDef = baseMapMap[queuedMap.baseMapId];
    if (queuedMapDef) {
      const costReduction = getMapCostReduction(nextState.talentsPurchased);
      const speedBonus = getMapSpeedBonus(nextState.talentsPurchased);
      const deviceEffects = augmentDeviceEffectsForUpgrades(
        resolveLoadoutEffects(queuedMap.deviceLoadout),
        nextState.purchasedUpgrades,
        true,
      );
      const incomePerSecond = getMapIncomeSnapshot(nextState.currencyProduction);
      const startResult = startMap(currencies, queuedMapDef, queuedMap.craftedMap, costReduction, speedBonus, deviceEffects, incomePerSecond);
      if (startResult) {
        currencies = startResult.currencies;
        activeMap = startResult.activeMap;

        if (activeMap && isMapComplete(activeMap, now)) {
          const queuedDef = baseMapMap[activeMap.craftedMap.baseMapId];
          if (queuedDef) {
            const queuedStreak = updatedPrestige.lastMapFamily === queuedDef.family ? updatedPrestige.lastMapFamilyStreak : 0;
            const qRewardBonus = getMapRewardBonus(nextState.talentsPurchased, queuedStreak) + getBaseMapRewardUpgradeBonus(nextState.purchasedUpgrades, {
              tier: queuedDef.tier,
              streak: queuedStreak,
              totalMirrorShards: updatedPrestige.totalMirrorShards,
            });
            const qShardChanceBonus = getMapShardChanceUpgradeBonus(nextState.purchasedUpgrades, updatedPrestige.totalMirrorShards);
            const qResult = completeMap(queuedDef, activeMap, qRewardBonus, qShardChanceBonus);
            currencies = applyMapRewards(currencies, qResult);
            const isSameFamilyQ = updatedPrestige.lastMapFamily === queuedDef.family;
            updatedPrestige.mirrorShards += qResult.shardAmount;
            updatedPrestige.totalMirrorShards += qResult.shardAmount;
            updatedPrestige.mapsCompleted += 1;
            updatedPrestige.lastMapFamily = queuedDef.family;
            updatedPrestige.lastMapFamilyStreak = isSameFamilyQ ? updatedPrestige.lastMapFamilyStreak + 1 : 1;
            activeMap = null;
          }
        }
      }
    }
    queuedMap = null;
  }

  return {
    ...nextState,
    currencies,
    prestige: updatedPrestige,
    activeMap,
    queuedMap,
    lastMapResult: result,
  };
}

export function loadGameState() {
  const initialState = createInitialGameState();
  const rawSave = window.localStorage.getItem(SAVE_KEY);

  if (!rawSave) return initialState;

  try {
    const parsedSave = JSON.parse(rawSave) as unknown;
    if (!isSavePayload(parsedSave)) return initialState;

    const savePayload = parsedSave as SavePayload;
    const now = Date.now();
    const elapsedMilliseconds = Math.max(0, Math.min(now - savePayload.lastSaveTime, MAX_OFFLINE_PROGRESS_MS));
    const elapsedSeconds = elapsedMilliseconds / 1000;

    const savedPrestige = savePayload.prestige ? { ...initialPrestigeState, ...savePayload.prestige } : { ...initialPrestigeState };
    const savedTalents = savePayload.talentsPurchased
      ? { ...initialTalentsPurchased, ...savePayload.talentsPurchased }
      : { ...initialTalentsPurchased };

    const savedDevice: MapDeviceState = initialMapDeviceState;

    let savedActiveMap = savePayload.activeMap ?? null;
    if (savedActiveMap) {
      const craftedMap = hydrateCraftedMap(savedActiveMap.craftedMap);
      if (!craftedMap) {
        savedActiveMap = null;
      } else {
        savedActiveMap = {
          ...savedActiveMap,
          craftedMap,
          deviceEffects: savedActiveMap.deviceEffects ?? emptyDeviceEffects,
          incomePerSecond: typeof savedActiveMap.incomePerSecond === "number" ? savedActiveMap.incomePerSecond : 0,
        };
      }
    }

    let savedQueuedMap: QueuedMapSetup | null = savePayload.queuedMap ?? null;
    if (savedQueuedMap) {
      const craftedMap = hydrateCraftedMap(savedQueuedMap.craftedMap);
      if (!savedQueuedMap.baseMapId || !craftedMap) {
        savedQueuedMap = null;
      } else {
        savedQueuedMap = {
          ...savedQueuedMap,
          craftedMap,
          deviceLoadout: savedQueuedMap.deviceLoadout ?? emptyDeviceLoadout,
        };
      }
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
      mapDevice: savedDevice,
      queuedMap: savedQueuedMap,
      mapNotification: null,
    });

    if (nextState.activeMap && nextState.activeMap.incomePerSecond <= 0) {
      nextState = {
        ...nextState,
        activeMap: {
          ...nextState.activeMap,
          incomePerSecond: getMapIncomeSnapshot(nextState.currencyProduction),
        },
      };
    }

    nextState = resolveLoadStateMapCompletion(nextState, now);
    nextState.currencies = applyPassiveGeneration(nextState.currencies, nextState.currencyProduction, elapsedSeconds);
    return synchronizeGameState(nextState);
  } catch {
    return initialState;
  }
}

export function clearSavedGame() {
  window.localStorage.removeItem(SAVE_KEY);
}
