import type { StateCreator } from "zustand";
import type { GameStore } from "@/store/gameStore";
import { convertCurrency } from "@/game/conversionEngine";
import { fragmentCurrencyId, type CurrencyId } from "@/game/currencies";
import { getConversionBonus } from "@/game/talents";
import { getClickPower, getConversionOutputUpgradeBonus } from "@/game/upgradeEngine";

export type CurrencyActions = {
  generateFragment: () => void;
  manualConvert: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => void;
};

export const createCurrencySlice: StateCreator<GameStore, [], [], { actions: CurrencyActions }> = (set) => ({
  actions: {
    generateFragment: () => {
      set((state) => {
        const power = getClickPower(state.currencyProduction[fragmentCurrencyId], state.clickMultiplier);
        return {
          currencies: {
            ...state.currencies,
            [fragmentCurrencyId]: state.currencies[fragmentCurrencyId] + power,
          },
        };
      });
    },

    manualConvert: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => {
      set((state) => {
        const talentBonus = getConversionBonus(state.talentsPurchased);
        const upgradeBonus = getConversionOutputUpgradeBonus(state.purchasedUpgrades);
        const converted = convertCurrency(state.currencies, fromCurrencyId, toCurrencyId);
        const totalBonus = talentBonus + upgradeBonus;

        if (totalBonus > 0 && converted !== state.currencies) {
          return {
            currencies: {
              ...converted,
              [toCurrencyId]: converted[toCurrencyId] + totalBonus,
            },
          };
        }

        return { currencies: converted };
      });
    },
  },
});
