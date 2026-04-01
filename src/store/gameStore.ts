import { createStore } from "zustand/vanilla";
import { type GameState, runGameTick, TICK_RATE_MS } from "@/game/gameEngine";
import { loadGameState, saveGameState, AUTOSAVE_INTERVAL_MS } from "@/game/saveSystem";
import { createCurrencySlice, type CurrencyActions } from "@/store/slices/currencySlice";
import { createEconomySlice, type EconomyActions } from "@/store/slices/economySlice";
import { createMapSlice, type MapActions } from "@/store/slices/mapSlice";
import { createPrestigeSlice, type PrestigeActions } from "@/store/slices/prestigeSlice";
import { createSystemSlice, type SystemActions } from "@/store/slices/systemSlice";
import { createQuestSlice, type QuestActions } from "@/store/slices/questSlice";

export type GameActions = CurrencyActions & EconomyActions & MapActions & PrestigeActions & SystemActions & QuestActions;

export type GameStore = GameState & { actions: GameActions };

export const gameStore = createStore<GameStore>()((...args) => {

  const currency = createCurrencySlice(...args);
  const economy = createEconomySlice(...args);
  const map = createMapSlice(...args);
  const prestige = createPrestigeSlice(...args);
  const system = createSystemSlice(...args);
  const quest = createQuestSlice(...args);

  return {
    ...loadGameState(),
    actions: {
      ...currency.actions,
      ...economy.actions,
      ...map.actions,
      ...prestige.actions,
      ...system.actions,
      ...quest.actions,
    },
  };
});

// ── Game loop ──

let gameLoopCleanup: (() => void) | null = null;
let autosaveCleanup: (() => void) | null = null;

export function startStoreGameLoop() {
  if (gameLoopCleanup) return;

  let lastTickTime = Date.now();

  const intervalId = window.setInterval(() => {
    const now = Date.now();
    const deltaTimeSeconds = (now - lastTickTime) / 1000;
    lastTickTime = now;

    const currentState = gameStore.getState();
    const nextState = runGameTick(currentState, deltaTimeSeconds);
    if (nextState !== currentState) {
      gameStore.setState(nextState);
    }
  }, TICK_RATE_MS);

  gameLoopCleanup = () => window.clearInterval(intervalId);
}

export function startStoreAutosave() {
  if (autosaveCleanup) return;

  const intervalId = window.setInterval(() => {
    const state = gameStore.getState();
    const saveTimestamp = saveGameState(state);
    if (state.lastSaveTime !== saveTimestamp) {
      gameStore.setState({ lastSaveTime: saveTimestamp });
    }
  }, AUTOSAVE_INTERVAL_MS);

  const handleBeforeUnload = () => {
    saveGameState(gameStore.getState());
  };
  window.addEventListener("beforeunload", handleBeforeUnload);

  autosaveCleanup = () => {
    window.clearInterval(intervalId);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}

export function stopStoreGameLoop() {
  gameLoopCleanup?.();
  gameLoopCleanup = null;
  autosaveCleanup?.();
  autosaveCleanup = null;
}
