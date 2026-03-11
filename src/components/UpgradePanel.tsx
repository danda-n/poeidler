import { currencyMap, formatCurrencyValue, type CurrencyId, type CurrencyState } from "../game/currencies";
import {
  canAffordCost,
  getUpgradeCategoryDescription,
  getUpgradeCategoryLabel,
  getUpgradeCost,
  getUpgradesByCategory,
  upgradeCategories,
  type PurchasedUpgradeState,
  type UpgradeCategory,
  type UpgradeDefinition,
  type UpgradeId,
} from "../game/upgradeEngine";
import FoldablePanel from "./FoldablePanel";

type UpgradePanelProps = {
  currenciesState: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

function formatCost(cost: Partial<Record<CurrencyId, number>>) {
  return Object.entries(cost)
    .map(([cid, amount]) => `${formatCurrencyValue(amount ?? 0)} ${currencyMap[cid as CurrencyId].shortLabel}`)
    .join(", ");
}

function getUpgradeSummary(upgrade: UpgradeDefinition, level: number) {
  switch (upgrade.effect.type) {
    case "percentProduction":
      return `Current: +${Math.round(upgrade.effect.value * 100 * level)}% ${currencyMap[upgrade.effect.currency].shortLabel} production`;
    case "percentClickPower":
      return `Current: +${Math.round(upgrade.effect.value * 100 * level)}% click power`;
    case "percentMapReward":
      return `Current: +${Math.round(upgrade.effect.value * 100 * level)}% map reward value`;
    case "flatMapShardChance":
      return `Current: +${(upgrade.effect.value * 100 * level).toFixed(1)}% shard chance`;
    case "unlockFeature":
      return level > 0 ? "Unlocked" : "Available to unlock";
  }
}

function categoryStartsOpen(category: UpgradeCategory) {
  return category === "generators" || category === "economy" || category === "maps";
}

function UpgradePanel({ currenciesState, purchasedUpgrades, onBuyUpgrade }: UpgradePanelProps) {
  return (
    <div className="upgrade-panel-stack">
      {upgradeCategories.map((category) => {
        const categoryUpgrades = getUpgradesByCategory(category);
        return (
          <FoldablePanel
            key={category}
            title={`${getUpgradeCategoryLabel(category)} (${categoryUpgrades.length})`}
            defaultOpen={categoryStartsOpen(category)}
          >
            <div className="upgrade-category-copy">{getUpgradeCategoryDescription(category)}</div>
            {categoryUpgrades.length === 0 ? (
              <div className="upgrade-placeholder">No upgrades in this category yet.</div>
            ) : (
              <div className="upgrade-category-list">
                {categoryUpgrades.map((upgrade) => {
                  const level = purchasedUpgrades[upgrade.id as UpgradeId];
                  const cost = getUpgradeCost(upgrade.id as UpgradeId, level);
                  const affordable = canAffordCost(currenciesState, cost);
                  const isCapped = upgrade.maxLevel !== undefined && level >= upgrade.maxLevel;

                  return (
                    <div key={upgrade.id} className={`upgrade-card${isCapped ? " upgrade-card-complete" : ""}`}>
                      <div className="upgrade-card-copy">
                        <div className="upgrade-card-header">
                          <span className="upgrade-card-name">{upgrade.name}</span>
                          <span className="upgrade-card-level">Lv {level}</span>
                        </div>
                        <p className="upgrade-card-desc">{upgrade.description}</p>
                        <div className="upgrade-card-meta">{getUpgradeSummary(upgrade, level)}</div>
                        {!isCapped && <div className="upgrade-card-cost">Next: {formatCost(cost)}</div>}
                      </div>
                      {isCapped ? (
                        <span className="upgrade-card-maxed">MAX</span>
                      ) : (
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => onBuyUpgrade(upgrade.id as UpgradeId)}
                          disabled={!affordable}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </FoldablePanel>
        );
      })}
    </div>
  );
}

export default UpgradePanel;
