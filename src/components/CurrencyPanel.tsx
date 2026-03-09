import { currencyMap, formatCurrencyValue, getVisibleCurrencies, type CurrencyProduction, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import { generatorByCurrency, getGeneratorCost, type GeneratorId, type GeneratorOwnedState } from "../game/generators";
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
    <div className="currency-list">
      {getVisibleCurrencies(unlockedCurrencies).map((currency) => {
        const generator = generatorByCurrency[currency.id];
        const generatorOwned = generator ? generatorsOwned[generator.id] : 0;
        const generatorCost = generator ? getGeneratorCost(generator.id, generatorOwned, 1) : null;
        const canAffordGenerator = generator
          ? Math.floor(currenciesState[generator.costCurrency]) >= (generatorCost ?? 0)
          : false;
        const generatorLabel = generator
          ? `${buyMaxEnabled ? "Max" : "+1"} ${generator.label}`
          : undefined;
        const generatorMeta = generator
          ? `${generatorOwned} owned | ${formatCurrencyValue(generatorCost ?? 0)} ${currencyMap[generator.costCurrency].shortLabel}`
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
    </div>
  );
}

export default CurrencyPanel;
