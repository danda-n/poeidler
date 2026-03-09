import { useState } from "react";
import { currencyMap, formatCurrencyValue, type CurrencyId, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import {
  canAffordCost,
  getUpgradeCost,
  getUpgradeCategoryLabel,
  upgradeCategories,
  upgrades,
  type PurchasedUpgradeState,
  type UpgradeCategory,
  type UpgradeId,
} from "../game/upgradeEngine";

type UpgradePanelProps = {
  currenciesState: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

function getVisibleUpgrades(unlockedCurrencies: UnlockedCurrencyState) {
  return upgrades.filter((upgrade) => {
    if (upgrade.effect.type !== "percentProduction") {
      return true;
    }
    return unlockedCurrencies[upgrade.effect.currency];
  });
}

function UpgradePanel({ currenciesState, unlockedCurrencies, purchasedUpgrades, onBuyUpgrade }: UpgradePanelProps) {
  const visible = getVisibleUpgrades(unlockedCurrencies);
  const categoriesWithUpgrades = upgradeCategories.filter((cat) => visible.some((u) => u.category === cat));
  const [activeCategory, setActiveCategory] = useState<UpgradeCategory>(categoriesWithUpgrades[0] ?? "currency");

  const filtered = visible.filter((u) => u.category === activeCategory);

  return (
    <div>
      <div className="category-tabs">
        {categoriesWithUpgrades.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-tab${activeCategory === cat ? " category-tab-active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {getUpgradeCategoryLabel(cat)}
          </button>
        ))}
      </div>
      <div className="upgrade-list">
        {filtered.map((upgrade) => {
          const currentLevel = purchasedUpgrades[upgrade.id];
          const cost = getUpgradeCost(upgrade.id, currentLevel);
          const affordable = canAffordCost(currenciesState, cost);
          const isCapped = upgrade.maxLevel !== undefined && currentLevel >= upgrade.maxLevel;
          const costLabel = Object.entries(cost)
            .map(([cid, amount]) => `${amount} ${currencyMap[cid as CurrencyId].shortLabel}`)
            .join(", ");

          let detail: string;
          if (upgrade.effect.type === "percentProduction") {
            detail = `Lv ${currentLevel} | ${currencyMap[upgrade.effect.currency].shortLabel} +${Math.round(upgrade.effect.value * 100)}%/lv | x${formatCurrencyValue(2 ** Math.floor(currentLevel / 25))} bonus`;
          } else if (upgrade.effect.type === "percentClickPower") {
            detail = `Lv ${currentLevel} | +${Math.round(upgrade.effect.value * 100)}% click/lv (x${formatCurrencyValue(1 + upgrade.effect.value * currentLevel)})`;
          } else {
            detail = upgrade.description;
          }

          return (
            <div key={upgrade.id} className={`upgrade-card${isCapped ? " upgrade-card-maxed" : ""}`}>
              <div className="upgrade-info">
                <h3 className="upgrade-name">{upgrade.name}</h3>
                <p className="upgrade-detail">{detail}</p>
                {!isCapped && <p className="upgrade-detail">Cost: {costLabel}</p>}
              </div>
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => onBuyUpgrade(upgrade.id)}
                disabled={isCapped || !affordable}
              >
                {isCapped ? "Maxed" : "Buy"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UpgradePanel;
