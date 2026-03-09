import { currencyMap, formatCurrencyValue, getVisibleCurrencies, type CurrencyProduction, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import { generatorByCurrency, getGeneratorCost, type GeneratorId, type GeneratorOwnedState } from "../game/generators";
import { canAffordCost, getUpgradeCost, getUpgradeBreakpointMultiplier, productionUpgradeByCurrency, type PurchasedUpgradeState, type UpgradeId } from "../game/upgradeEngine";
import CurrencyRow from "./CurrencyRow";

type CurrencyPanelProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  generatorsOwned: GeneratorOwnedState;
  unlockedCurrencies: UnlockedCurrencyState;
  buyMaxEnabled: boolean;
  purchasedUpgrades: PurchasedUpgradeState;
  onBuyGenerator: (generatorId: GeneratorId) => void;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

function CurrencyPanel({
  currenciesState,
  currencyProduction,
  generatorsOwned,
  unlockedCurrencies,
  buyMaxEnabled,
  purchasedUpgrades,
  onBuyGenerator,
  onBuyUpgrade,
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
          ? `${buyMaxEnabled ? "Max" : "+1"}`
          : undefined;
        const generatorTooltip = generator
          ? `${generator.label}\nOwned: ${generatorOwned}\nRate: ${generator.baseRate}/sec each\nCost: ${formatCurrencyValue(generatorCost ?? 0)} ${currencyMap[generator.costCurrency].shortLabel}`
          : undefined;

        const prodUpgrade = productionUpgradeByCurrency[currency.id];
        let upgradeLabel: string | undefined;
        let upgradeDisabled = true;
        let upgradeTooltip: string | undefined;
        let onUpgrade: (() => void) | undefined;

        if (prodUpgrade) {
          const level = purchasedUpgrades[prodUpgrade.id as UpgradeId];
          const cost = getUpgradeCost(prodUpgrade.id as UpgradeId, level);
          const affordable = canAffordCost(currenciesState, cost);
          const costLabel = Object.entries(cost)
            .map(([cid, amt]) => `${formatCurrencyValue(amt ?? 0)} ${currencyMap[cid as keyof typeof currencyMap].shortLabel}`)
            .join(", ");
          const breakpointMult = getUpgradeBreakpointMultiplier(level);

          upgradeLabel = `Eff ${level}`;
          upgradeDisabled = !affordable;
          upgradeTooltip = `${prodUpgrade.name}\nLevel ${level}\n+${Math.round((prodUpgrade.effect as { value: number }).value * 100)}% per level\nx${breakpointMult} breakpoint bonus\nCost: ${costLabel}`;
          onUpgrade = () => onBuyUpgrade(prodUpgrade.id as UpgradeId);
        }

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
            upgradeLabel={upgradeLabel}
            upgradeDisabled={upgradeDisabled}
            upgradeTooltip={upgradeTooltip}
            onBuyUpgrade={onUpgrade}
          />
        );
      })}
    </div>
  );
}

export default CurrencyPanel;
