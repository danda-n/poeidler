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
import { FoldablePanel } from "./FoldablePanel";

type OtherUpgradesBarProps = {
  currenciesState: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

function formatCost(cost: Partial<Record<CurrencyId, number>>) {
  return Object.entries(cost)
    .map(([cid, amount]) => `${formatCurrencyValue(amount ?? 0)} ${currencyMap[cid].shortLabel}`)
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

function OtherUpgradesBar({ currenciesState, purchasedUpgrades, onBuyUpgrade }: OtherUpgradesBarProps) {
  return (
    <div className="grid gap-2.5">
      {upgradeCategories.map((category) => {
        const categoryUpgrades = getUpgradesByCategory(category);
        return (
          <FoldablePanel
            key={category}
            title={`${getUpgradeCategoryLabel(category)} (${categoryUpgrades.length})`}
            defaultOpen={categoryStartsOpen(category)}
          >
            <div className="text-[0.74rem] text-text-secondary mb-2">{getUpgradeCategoryDescription(category)}</div>
            {categoryUpgrades.length === 0 ? (
              <div className="text-[0.7rem] text-text-secondary">No upgrades in this category yet.</div>
            ) : (
              <div className="grid gap-1.5">
                {categoryUpgrades.map((upgrade) => {
                  const level = purchasedUpgrades[upgrade.id];
                  const cost = getUpgradeCost(upgrade.id, level);
                  const affordable = canAffordCost(currenciesState, cost);
                  const isCapped = upgrade.maxLevel !== undefined && level >= upgrade.maxLevel;

                  return (
                    <div key={upgrade.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-border-subtle${isCapped ? " !border-[rgba(80,250,123,0.2)] !bg-[rgba(80,250,123,0.04)]" : ""}`}>
                      <div className="grid gap-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[0.82rem] font-semibold text-text-bright">{upgrade.name}</span>
                          <span className="text-[0.68rem] text-text-secondary px-[5px] py-px rounded-full bg-[rgba(255,255,255,0.05)]">Lv {level}</span>
                        </div>
                        <p className="m-0 text-[0.72rem] text-[#a0a0a0]">{upgrade.description}</p>
                        <div className="text-[0.7rem] text-text-secondary">{getUpgradeSummary(upgrade, level)}</div>
                        {!isCapped && <div className="text-[0.7rem] text-text-secondary">Next: {formatCost(cost)}</div>}
                      </div>
                      {isCapped ? (
                        <span className="text-[0.7rem] font-bold text-accent-green uppercase tracking-[0.04em]">MAX</span>
                      ) : (
                        <button
                          className="px-2 py-1 border border-[rgba(255,211,106,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-gold bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(255,211,106,0.1)] hover:not-disabled:border-[rgba(255,211,106,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
                          type="button"
                          onClick={() => onBuyUpgrade(upgrade.id)}
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

export default OtherUpgradesBar;

