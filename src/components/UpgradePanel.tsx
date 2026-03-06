import { currencyMap, formatCurrencyValue, type CurrencyId, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import { getUpgradeCost, type PurchasedUpgradeState, type UpgradeCategory, type UpgradeId, type UpgradeDefinition } from "../game/upgradeEngine";

type UpgradePanelProps = {
  category: UpgradeCategory;
  upgrades: readonly UpgradeDefinition[];
  currenciesState: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

function UpgradePanel({ category, upgrades, currenciesState, unlockedCurrencies, purchasedUpgrades, onBuyUpgrade }: UpgradePanelProps) {
  const visibleUpgrades = upgrades.filter((upgrade) => {
    if (upgrade.effect.type !== "percentProduction") {
      return true;
    }

    return unlockedCurrencies[upgrade.effect.currency];
  });

  return (
    <div className="upgrade-list compact-list" data-category={category}>
      {visibleUpgrades.map((upgrade) => {
        const currentLevel = purchasedUpgrades[upgrade.id];
        const cost = getUpgradeCost(upgrade.id, currentLevel);
        const canAfford = Object.entries(cost).every(([currencyId, amount]) => Math.floor(currenciesState[currencyId as CurrencyId]) >= (amount ?? 0));
        const isCapped = upgrade.maxLevel !== undefined && currentLevel >= upgrade.maxLevel;
        const costLabel = Object.entries(cost)
          .map(([currencyId, amount]) => `${amount} ${currencyMap[currencyId as CurrencyId].shortLabel}`)
          .join(", ");
        const effectLabel = upgrade.effect.type === "percentProduction"
          ? `Effect: ${currencyMap[upgrade.effect.currency].shortLabel} production +${Math.round(upgrade.effect.value * 100)}% per level, x${formatCurrencyValue(2 ** Math.floor(currentLevel / 25))} breakpoint bonus`
          : `Effect: ${upgrade.description}`;

        return (
          <div key={upgrade.id} className="upgrade-card compact-card">
            <div className="upgrade-copy">
              <h3 className="upgrade-name">{upgrade.name}</h3>
              <p className="upgrade-description">{effectLabel}</p>
              <p className="upgrade-cost">Level {currentLevel}</p>
              <p className="upgrade-cost">Next: {costLabel}</p>
            </div>
            <button className="upgrade-button compact-buy-button" type="button" onClick={() => onBuyUpgrade(upgrade.id)} disabled={isCapped || !canAfford}>
              {isCapped ? "Maxed" : "Buy"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default UpgradePanel;
