import { currencyMap, formatCurrencyValue, getVisibleCurrencies, type CurrencyProduction, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import {
  getGeneratorCost,
  getGeneratorMilestoneBonus,
  getGeneratorOutputMultiplier,
  getNextGeneratorMilestone,
  generatorByCurrency,
  type GeneratorId,
  type GeneratorOwnedState,
} from "../game/generators";
import { CurrencyRow } from "./CurrencyRow";

type CurrencyPanelProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  generatorsOwned: GeneratorOwnedState;
  unlockedCurrencies: UnlockedCurrencyState;
  buyMaxEnabled: boolean;
  onBuyGenerator: (generatorId: GeneratorId) => void;
};

export function CurrencyPanel({
  currenciesState,
  currencyProduction,
  generatorsOwned,
  unlockedCurrencies,
  buyMaxEnabled,
  onBuyGenerator,
}: CurrencyPanelProps) {
  return (
    <div className="currency-list">
      {getVisibleCurrencies(unlockedCurrencies).map((currency) => {
        const generator = generatorByCurrency[currency.id];
        const generatorOwned = generator ? generatorsOwned[generator.id] : 0;
        const generatorCost = generator ? getGeneratorCost(generator.id, generatorOwned, 1) : null;
        const canAffordGenerator = generator
          ? Math.floor(currenciesState[generator.costCurrency]) >= (generatorCost ?? 0)
          : false;
        const generatorLabel = generator ? `${buyMaxEnabled ? "Max" : "+1"}` : undefined;
        const nextMilestone = generator ? getNextGeneratorMilestone(generatorOwned) : null;
        const milestoneBonus = generator ? getGeneratorMilestoneBonus(generatorOwned) : 0;
        const lineMultiplier = generator ? getGeneratorOutputMultiplier(generator, Math.max(1, generatorOwned)) : 1;
        const generatorTooltip = generator
          ? `${generator.label}\nOwned: ${generatorOwned}\nLine scaling: x${lineMultiplier.toFixed(2)}${milestoneBonus > 0 ? ` (${Math.round(milestoneBonus * 100)}% milestone)` : ""}\nRate: ${formatCurrencyValue(currencyProduction[currency.id])}/sec total\nCost: ${formatCurrencyValue(generatorCost ?? 0)} ${currencyMap[generator.costCurrency].shortLabel}${nextMilestone ? `\nNext milestone: ${nextMilestone} owned` : ""}`
          : undefined;

        return (
          <CurrencyRow
            key={currency.id}
            icon={currency.icon}
            name={currency.shortLabel}
            value={currenciesState[currency.id]}
            productionRate={currencyProduction[currency.id]}
            generatorLabel={generatorLabel}
            generatorDisabled={!canAffordGenerator}
            generatorTooltip={generatorTooltip}
            onBuyGenerator={generator ? () => onBuyGenerator(generator.id) : undefined}
          />
        );
      })}
    </div>
  );
}
