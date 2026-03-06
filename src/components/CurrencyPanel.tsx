import { currencyMap, formatCurrencyValue, getVisibleCurrencies, type CurrencyProduction, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import { generatorMap, getGeneratorCost, type GeneratorId, type GeneratorOwnedState } from "../game/generators";
import CurrencyRow from "./CurrencyRow";

type CurrencyPanelProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  generatorsOwned: GeneratorOwnedState;
  unlockedCurrencies: UnlockedCurrencyState;
  buyMaxEnabled: boolean;
  onBuyGenerator: (generatorId: GeneratorId) => void;
};

function CurrencyPanel({
  currenciesState,
  currencyProduction,
  generatorsOwned,
  unlockedCurrencies,
  buyMaxEnabled,
  onBuyGenerator,
}: CurrencyPanelProps) {
  return (
    <div className="currency-list compact-list">
      {getVisibleCurrencies(unlockedCurrencies).map((currency) => {
        const generator = Object.values(generatorMap).find((entry) => entry.currency === currency.id);
        const generatorOwned = generator ? generatorsOwned[generator.id] : 0;
        const generatorCost = generator ? getGeneratorCost(generator.id, generatorOwned, 1) : null;
        const canAffordGenerator = generator
          ? Math.floor(currenciesState[generator.costCurrency]) >= (generatorCost ?? 0)
          : false;
        const generatorLabel = generator
          ? `${buyMaxEnabled ? "Max" : "+1"} ${generator.label}`
          : undefined;
        const generatorMeta = generator
          ? `${generatorOwned} owned | ${generatorCost} ${currencyMap[generator.costCurrency].shortLabel}`
          : undefined;

        return (
          <CurrencyRow
            key={currency.id}
            icon={currency.icon}
            name={currency.label}
            value={currenciesState[currency.id]}
            productionRate={currencyProduction[currency.id]}
            actionLabel={generatorLabel}
            actionMeta={generatorMeta}
            actionDisabled={!canAffordGenerator}
            onAction={generator ? () => onBuyGenerator(generator.id) : undefined}
          />
        );
      })}
      <div className="currency-summary compact-summary">
        <span>Total Passive Generation</span>
        <strong>{formatCurrencyValue(currencyProduction.fragmentOfWisdom)} Fragment / sec</strong>
      </div>
    </div>
  );
}

export default CurrencyPanel;
