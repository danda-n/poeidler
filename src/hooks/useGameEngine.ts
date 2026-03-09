import { useEffect, useRef, useState } from "react";
import { convertCurrency } from "../game/conversionEngine";
import { fragmentCurrencyId, type CurrencyId } from "../game/currencies";
import { generatorMap, getMaxAffordableGeneratorPurchases, type GeneratorId } from "../game/generators";
import { createInitialGameState, startGameEngine, synchronizeGameState, type GameState } from "../game/gameEngine";
import { AUTOSAVE_INTERVAL_MS, clearSavedGame, loadGameState, saveGameState } from "../game/saveSystem";
import { getClickPower, purchaseGenerator, purchaseUpgrade, type UpgradeId } from "../game/upgradeEngine";

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => startGameEngine(setGameState), []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setGameState((currentState) => {
        const saveTimestamp = saveGameState(currentState);
        return {
          ...currentState,
          lastSaveTime: saveTimestamp,
        };
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameState(gameStateRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function generateFragment() {
    setGameState((currentState) => {
      const power = getClickPower(currentState.currencyProduction[fragmentCurrencyId], currentState.clickMultiplier);
      return {
        ...currentState,
        currencies: {
          ...currentState.currencies,
          [fragmentCurrencyId]: currentState.currencies[fragmentCurrencyId] + power,
        },
      };
    });
  }

  function manualConvert(fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) {
    setGameState((currentState) => ({
      ...currentState,
      currencies: convertCurrency(currentState.currencies, fromCurrencyId, toCurrencyId),
    }));
  }

  function buyUpgrade(upgradeId: UpgradeId) {
    setGameState((currentState) => synchronizeGameState(purchaseUpgrade(currentState, upgradeId)));
  }

  function buyGenerator(generatorId: GeneratorId) {
    setGameState((currentState) => {
      const generator = generatorMap[generatorId];
      const availableCurrency = Math.floor(currentState.currencies[generator.costCurrency]);
      const quantity = currentState.unlockedFeatures.buyMax
        ? getMaxAffordableGeneratorPurchases(generatorId, currentState.generatorsOwned[generatorId], availableCurrency)
        : 1;

      return synchronizeGameState(purchaseGenerator(currentState, generatorId, quantity));
    });
  }

  function resetSave() {
    clearSavedGame();
    setGameState(createInitialGameState());
  }

  return {
    gameState,
    actions: {
      generateFragment,
      manualConvert,
      buyUpgrade,
      buyGenerator,
      resetSave,
    },
  };
}
