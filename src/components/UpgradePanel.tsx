import { useState } from "react";
import { currencyMap, formatCurrencyValue, type CurrencyId, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import type { PrestigeState } from "../game/prestige";
import {
  canAffordCost,
  canPurchaseUpgrade,
  getAffordableUpgradeCount,
  getUpgradeCategoryDescription,
  getUpgradeCategoryLabel,
  getUpgradeCategoryStats,
  getUpgradeCost,
  getUpgradeUnlockText,
  getUpgradesByCategory,
  isUpgradeUnlocked,
  upgradeCategories,
  type PurchasedUpgradeState,
  type UpgradeAvailabilityState,
  type UpgradeCategory,
  type UpgradeDefinition,
  type UpgradeGroup,
  type UpgradeId,
} from "../game/upgradeEngine";
import { FoldablePanel } from "./FoldablePanel";

type UpgradePanelProps = {
  currenciesState: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

function formatCost(cost: Partial<Record<CurrencyId, number>>) {
  return Object.entries(cost)
    .map(([currencyId, amount]) => `${formatCurrencyValue(amount ?? 0)} ${currencyMap[currencyId as CurrencyId].shortLabel}`)
    .join(", ");
}

function describeEffect(upgrade: UpgradeDefinition, level: number, totalMirrorShards: number) {
  switch (upgrade.effect.type) {
    case "percentProduction":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% ${currencyMap[upgrade.effect.currency].shortLabel} production`;
    case "percentClickPower":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% click power`;
    case "flatConversionOutput":
      return `+${level * upgrade.effect.value} conversion output`;
    case "percentGeneratorCostReduction":
      return `-${Math.round(upgrade.effect.value * 100 * level)}% generator costs`;
    case "percentMapReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% map reward value`;
    case "percentFocusedMapReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% focused rewards`;
    case "percentMapRewardPerTier":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% reward per map tier`;
    case "percentQueuedMapReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% queued map rewards`;
    case "flatMapShardChance":
      return `+${(upgrade.effect.value * 100 * level).toFixed(1)}% shard chance`;
    case "flatQueuedMapShardChance":
      return `+${(upgrade.effect.value * 100 * level).toFixed(2)}% queued shard chance`;
    case "percentMapStreakReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% reward per streak step`;
    case "percentMapSpeed":
      return `-${Math.round(upgrade.effect.value * 100 * level)}% map duration`;
    case "percentMapCostReduction":
      return `-${Math.round(upgrade.effect.value * 100 * level)}% map costs`;
    case "percentPrestigeShards":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% prestige shards`;
    case "percentMapRewardFromShards": {
      const steps = Math.floor(totalMirrorShards / upgrade.effect.shardStep);
      const activeSteps = upgrade.effect.maxSteps === undefined ? steps : Math.min(steps, upgrade.effect.maxSteps);
      return `+${Math.round(upgrade.effect.value * 100 * level)}% reward per ${upgrade.effect.shardStep} total shards (${activeSteps} active)`;
    }
    case "flatMapShardChanceFromShards": {
      const steps = Math.floor(totalMirrorShards / upgrade.effect.shardStep);
      const activeSteps = upgrade.effect.maxSteps === undefined ? steps : Math.min(steps, upgrade.effect.maxSteps);
      return `+${(upgrade.effect.value * 100 * level).toFixed(2)}% shard chance per ${upgrade.effect.shardStep} shards (${activeSteps} active)`;
    }
    case "percentEncounterReward":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% encounter reward value`;
    case "flatEncounterShardChance":
      return `+${(upgrade.effect.value * 100 * level).toFixed(2)}% shard chance on encounter maps`;
    case "percentEncounterPrestigeShards":
      return `+${Math.round(upgrade.effect.value * 100 * level)}% encounter prestige value`;
    case "unlockFeature":
      return level > 0 ? "Unlocked" : "Unlock new purchase flow";
  }
}

function startsOpen(group: UpgradeGroup) {
  return group === "Foundations" || group === "Reward Engines" || group === "Queue Control";
}

export function UpgradePanel({ currenciesState, purchasedUpgrades, unlockedCurrencies, prestige, onBuyUpgrade }: UpgradePanelProps) {
  const [activeCategory, setActiveCategory] = useState<UpgradeCategory>("generators");
  const availabilityState: UpgradeAvailabilityState = {
    currencies: currenciesState,
    purchasedUpgrades,
    unlockedCurrencies,
    prestige,
  };

  const categoryStats = Object.fromEntries(
    upgradeCategories.map((category) => [category, getUpgradeCategoryStats(availabilityState, category)]),
  ) as Record<UpgradeCategory, ReturnType<typeof getUpgradeCategoryStats>>;

  const selectedUpgrades = getUpgradesByCategory(activeCategory);
  const groupedUpgrades = selectedUpgrades.reduce((acc, upgrade) => {
    if (!acc[upgrade.group]) acc[upgrade.group] = [];
    acc[upgrade.group].push(upgrade);
    return acc;
  }, {} as Record<string, UpgradeDefinition[]>);

  const unlockedInCategory = categoryStats[activeCategory].unlocked;
  const affordableInCategory = categoryStats[activeCategory].affordable;
  const totalAffordable = getAffordableUpgradeCount(availabilityState);
  const purchasedCount = Object.values(purchasedUpgrades).filter((level) => level > 0).length;

  return (
    <div className="upgrade-page">
      <div className="upgrade-page-header">
        <div>
          <h2 className="upgrade-page-title">Upgrades</h2>
          <p className="upgrade-page-subtitle">Invest into output, routing speed, queue value, and long-term economy pressure without crowding the play screen.</p>
        </div>
        <div className="upgrade-page-stats">
          <div className="upgrade-stat-card">
            <span className="upgrade-stat-value">{totalAffordable}</span>
            <span className="upgrade-stat-label">Ready now</span>
          </div>
          <div className="upgrade-stat-card">
            <span className="upgrade-stat-value">{purchasedCount}</span>
            <span className="upgrade-stat-label">Owned</span>
          </div>
          <div className="upgrade-stat-card">
            <span className="upgrade-stat-value">{formatCurrencyValue(prestige.totalMirrorShards)}</span>
            <span className="upgrade-stat-label">Total shards</span>
          </div>
        </div>
      </div>

      <div className="upgrade-category-tabs">
        {upgradeCategories.map((category) => {
          const stats = categoryStats[category];
          const active = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              className={`upgrade-category-tab${active ? " upgrade-category-tab-active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              <span className="upgrade-category-tab-name">{getUpgradeCategoryLabel(category)}</span>
              <span className="upgrade-category-tab-meta">{stats.unlocked}/{stats.total}</span>
              {stats.affordable > 0 && <span className="upgrade-category-tab-badge">{stats.affordable}</span>}
            </button>
          );
        })}
      </div>

      <div className="upgrade-category-summary">
        <div>
          <div className="upgrade-category-summary-title">{getUpgradeCategoryLabel(activeCategory)}</div>
          <div className="upgrade-category-summary-copy">{getUpgradeCategoryDescription(activeCategory)}</div>
        </div>
        <div className="upgrade-category-summary-stats">
          <span>{unlockedInCategory} unlocked</span>
          <span>{affordableInCategory} affordable</span>
          <span>{categoryStats[activeCategory].total} total</span>
        </div>
      </div>

      <div className="upgrade-panel-stack">
        {Object.entries(groupedUpgrades).map(([group, upgradesInGroup]) => (
          <FoldablePanel key={group} title={`${group} (${upgradesInGroup.length})`} defaultOpen={startsOpen(group as UpgradeGroup)}>
            <div className="upgrade-group-grid">
              {upgradesInGroup.map((upgrade) => {
                const level = purchasedUpgrades[upgrade.id as UpgradeId];
                const cost = getUpgradeCost(upgrade.id as UpgradeId, level);
                const unlocked = isUpgradeUnlocked(availabilityState, upgrade.id as UpgradeId);
                const affordable = canAffordCost(currenciesState, cost);
                const canBuy = canPurchaseUpgrade(availabilityState, upgrade.id as UpgradeId);
                const isCapped = upgrade.maxLevel !== undefined && level >= upgrade.maxLevel;
                const unlockText = unlocked ? null : getUpgradeUnlockText(availabilityState, upgrade.id as UpgradeId);
                const nextLevelText = isCapped ? "Maxed" : describeEffect(upgrade, level + 1, prestige.totalMirrorShards);

                return (
                  <div key={upgrade.id} className={`upgrade-card upgrade-card-detailed${isCapped ? " upgrade-card-complete" : ""}${!unlocked ? " upgrade-card-locked" : ""}`}>
                    <div className="upgrade-card-copy">
                      <div className="upgrade-card-header">
                        <span className="upgrade-card-name">{upgrade.name}</span>
                        <span className="upgrade-card-level">Lv {level}</span>
                      </div>
                      <p className="upgrade-card-desc">{upgrade.description}</p>
                      <div className="upgrade-card-grid">
                        <div className="upgrade-card-line">
                          <span className="upgrade-card-line-label">Current</span>
                          <span className="upgrade-card-line-value">{describeEffect(upgrade, level, prestige.totalMirrorShards)}</span>
                        </div>
                        <div className="upgrade-card-line">
                          <span className="upgrade-card-line-label">Next</span>
                          <span className="upgrade-card-line-value">{nextLevelText}</span>
                        </div>
                        <div className="upgrade-card-line">
                          <span className="upgrade-card-line-label">Cost</span>
                          <span className={`upgrade-card-line-value${affordable ? "" : " upgrade-card-line-value-alert"}`}>{isCapped ? "-" : formatCost(cost)}</span>
                        </div>
                        <div className="upgrade-card-line">
                          <span className="upgrade-card-line-label">State</span>
                          <span className="upgrade-card-line-value">{isCapped ? "Completed" : unlocked ? (canBuy ? "Ready to buy" : "Unlocked") : unlockText}</span>
                        </div>
                      </div>
                    </div>
                    {isCapped ? (
                      <span className="upgrade-card-maxed">MAX</span>
                    ) : (
                      <button className="btn btn-sm" type="button" onClick={() => onBuyUpgrade(upgrade.id as UpgradeId)} disabled={!canBuy}>
                        {unlocked ? "Buy" : "Locked"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </FoldablePanel>
        ))}
      </div>
    </div>
  );
}
