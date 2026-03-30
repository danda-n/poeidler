import type { StateCreator } from "zustand";
import type { GameStore } from "@/store/gameStore";
import { synchronizeGameState } from "@/game/gameEngine";
import { generatorMap, getGeneratorCost, getMaxAffordableGeneratorPurchases, type GeneratorId } from "@/game/generators";
import { getGeneratorCostReduction } from "@/game/talents";
import {
  getGeneratorCostReductionUpgradeBonus,
  purchaseGenerator,
  purchaseUpgrade,
  type UpgradeId,
} from "@/game/upgradeEngine";

export type EconomyActions = {
  buyUpgrade: (upgradeId: UpgradeId) => void;
  buyGenerator: (generatorId: GeneratorId) => void;
};

export const createEconomySlice: StateCreator<GameStore, [], [], { actions: EconomyActions }> = (set) => ({
  actions: {
    buyUpgrade: (upgradeId: UpgradeId) => {
      set((state) => {
        const result = synchronizeGameState(purchaseUpgrade(state, upgradeId));
        return { ...result };
      });
    },

    buyGenerator: (generatorId: GeneratorId) => {
      set((state) => {
        const generator = generatorMap[generatorId];
        const costReduction = getGeneratorCostReduction(state.talentsPurchased) + getGeneratorCostReductionUpgradeBonus(state.purchasedUpgrades);

        if (state.unlockedFeatures.buyMax) {
          let quantity = 0;
          let runningCost = 0;
          const available = Math.floor(state.currencies[generator.costCurrency]);
          const owned = state.generatorsOwned[generatorId];

          while (true) {
            const rawCost = getGeneratorCost(generatorId, owned + quantity, 1);
            const reducedCost = Math.ceil(rawCost * Math.max(0.2, 1 - costReduction));
            if (runningCost + reducedCost > available) break;
            runningCost += reducedCost;
            quantity += 1;
          }

          if (quantity <= 0) return state;

          return synchronizeGameState({
            ...state,
            currencies: {
              ...state.currencies,
              [generator.costCurrency]: state.currencies[generator.costCurrency] - runningCost,
            },
            generatorsOwned: {
              ...state.generatorsOwned,
              [generatorId]: state.generatorsOwned[generatorId] + quantity,
            },
          });
        }

        if (costReduction > 0) {
          const owned = state.generatorsOwned[generatorId];
          const rawCost = getGeneratorCost(generatorId, owned, 1);
          const reducedCost = Math.ceil(rawCost * Math.max(0.2, 1 - costReduction));

          if (Math.floor(state.currencies[generator.costCurrency]) < reducedCost) {
            return state;
          }

          return synchronizeGameState({
            ...state,
            currencies: {
              ...state.currencies,
              [generator.costCurrency]: state.currencies[generator.costCurrency] - reducedCost,
            },
            generatorsOwned: {
              ...state.generatorsOwned,
              [generatorId]: owned + 1,
            },
          });
        }

        const availableCurrency = Math.floor(state.currencies[generator.costCurrency]);
        const quantity = state.unlockedFeatures.buyMax
          ? getMaxAffordableGeneratorPurchases(generatorId, state.generatorsOwned[generatorId], availableCurrency)
          : 1;

        return synchronizeGameState(purchaseGenerator(state, generatorId, quantity));
      });
    },
  },
});
