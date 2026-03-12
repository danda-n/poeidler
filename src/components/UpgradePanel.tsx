import { useEffect, useMemo, useState } from "react";
import { formatCurrencyValue, type CurrencyState, type UnlockedCurrencyState } from "@/game/currencies";
import type { PrestigeState } from "@/game/prestige";
import {
  canPurchaseUpgrade,
  getAffordableUpgradeCount,
  getUpgradeCategoryDescription,
  getUpgradeCategoryLabel,
  getUpgradeCategoryStats,
  getUpgradeCost,
  getUpgradesByCategory,
  type PurchasedUpgradeState,
  type UpgradeAvailabilityState,
  type UpgradeCategory,
  type UpgradeDefinition,
  type UpgradeId,
  upgradeCategories,
  upgrades,
} from "@/game/upgradeEngine";
import {
  describeUpgradeEffect,
  formatUpgradeCost,
  getUpgradeNodeRequirementText,
  getUpgradeNodeState,
  getUpgradeNodeStateLabel,
  getUpgradePresentation,
  type UpgradeNodeKind,
  type UpgradeNodeState,
} from "@/game/upgradeTree";

type UpgradePanelProps = {
  currenciesState: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

type UpgradeTone = "ready" | "owned" | "open" | "locked";

type UpgradeRowViewModel = {
  id: UpgradeId;
  definition: UpgradeDefinition;
  level: number;
  tier: number;
  lane: string;
  kind: UpgradeNodeKind;
  state: UpgradeNodeState;
  tone: UpgradeTone;
  statusLabel: string;
  costLabel: string;
  canBuy: boolean;
  requirementText: string;
  currentEffect: string;
  nextEffect: string;
  isMaxed: boolean;
};

function getStateTone(nodeState: UpgradeNodeState): UpgradeTone {
  switch (nodeState) {
    case "available":
      return "ready";
    case "maxed":
    case "purchased":
      return "owned";
    case "unlocked":
      return "open";
    case "locked":
      return "locked";
  }
}

function getKindLabel(kind: UpgradeNodeKind) {
  switch (kind) {
    case "minor":
      return "Minor";
    case "unlock":
      return "Unlock";
    case "keystone":
      return "Major";
  }
}

function pickSelectedUpgradeId(rows: UpgradeRowViewModel[]) {
  return rows.find((row) => row.state === "available")?.id ?? rows.find((row) => row.level > 0)?.id ?? rows[0]?.id ?? null;
}

function groupUpgradeRows(rows: UpgradeRowViewModel[]) {
  const groupedRows = new Map<string, UpgradeRowViewModel[]>();

  rows.forEach((row) => {
    const existingRows = groupedRows.get(row.definition.group) ?? [];
    existingRows.push(row);
    groupedRows.set(row.definition.group, existingRows);
  });

  return Array.from(groupedRows.entries()).map(([groupName, groupRows]) => ({
    groupName,
    rows: groupRows,
  }));
}

export function UpgradePanel({ currenciesState, purchasedUpgrades, unlockedCurrencies, prestige, onBuyUpgrade }: UpgradePanelProps) {
  const [activeCategory, setActiveCategory] = useState<UpgradeCategory>("generators");
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<UpgradeId | null>(null);

  const availabilityState = useMemo<UpgradeAvailabilityState>(
    () => ({
      currencies: currenciesState,
      purchasedUpgrades,
      unlockedCurrencies,
      prestige,
    }),
    [currenciesState, prestige, purchasedUpgrades, unlockedCurrencies],
  );

  const rowsByCategory = useMemo(() => {
    return Object.fromEntries(
      upgradeCategories.map((category) => {
        const rows = getUpgradesByCategory(category)
          .map((definition) => {
            const upgradeId = definition.id as UpgradeId;
            const presentation = getUpgradePresentation(upgradeId);
            const level = purchasedUpgrades[upgradeId];
            const state = getUpgradeNodeState(availabilityState, upgradeId);
            const nextLevel = definition.maxLevel !== undefined && level >= definition.maxLevel ? level : level + 1;

            return {
              id: upgradeId,
              definition,
              level,
              tier: presentation.tier,
              lane: presentation.lane,
              kind: presentation.kind,
              state,
              tone: getStateTone(state),
              statusLabel: getUpgradeNodeStateLabel(state),
              costLabel: formatUpgradeCost(getUpgradeCost(upgradeId, level)),
              canBuy: canPurchaseUpgrade(availabilityState, upgradeId),
              requirementText: getUpgradeNodeRequirementText(availabilityState, upgradeId),
              currentEffect: level > 0 ? describeUpgradeEffect(definition, level, prestige.totalMirrorShards) : "Not active yet",
              nextEffect:
                definition.maxLevel !== undefined && level >= definition.maxLevel
                  ? "Already maxed"
                  : describeUpgradeEffect(definition, nextLevel, prestige.totalMirrorShards),
              isMaxed: definition.maxLevel !== undefined && level >= definition.maxLevel,
            } satisfies UpgradeRowViewModel;
          })
          .sort((left, right) => {
            if (left.tier !== right.tier) return left.tier - right.tier;
            if (left.lane !== right.lane) return left.lane.localeCompare(right.lane);
            return left.definition.name.localeCompare(right.definition.name);
          });

        return [category, rows];
      }),
    ) as Record<UpgradeCategory, UpgradeRowViewModel[]>;
  }, [availabilityState, prestige.totalMirrorShards, purchasedUpgrades]);

  const categoryStats = useMemo(
    () =>
      Object.fromEntries(
        upgradeCategories.map((category) => [category, getUpgradeCategoryStats(availabilityState, category)]),
      ) as Record<UpgradeCategory, ReturnType<typeof getUpgradeCategoryStats>>,
    [availabilityState],
  );
  const totalAffordable = useMemo(() => getAffordableUpgradeCount(availabilityState), [availabilityState]);
  const purchasedCount = useMemo(
    () => Object.values(purchasedUpgrades).filter((level) => level > 0).length,
    [purchasedUpgrades],
  );

  const activeRows = rowsByCategory[activeCategory];
  const groupedRows = useMemo(() => groupUpgradeRows(activeRows), [activeRows]);

  useEffect(() => {
    const nextSelectedId = pickSelectedUpgradeId(activeRows);
    if (!selectedUpgradeId || !activeRows.some((row) => row.id === selectedUpgradeId)) {
      setSelectedUpgradeId(nextSelectedId);
    }
  }, [activeRows, selectedUpgradeId]);

  const selectedUpgrade = activeRows.find((row) => row.id === selectedUpgradeId) ?? activeRows[0] ?? null;

  const upcomingUnlocks = useMemo(() => {
    return activeRows
      .filter((row) => row.state === "locked")
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        name: row.definition.name,
        requirementText: row.requirementText,
      }));
  }, [activeRows]);

  const selectedUnlocksNext = useMemo(() => {
    if (!selectedUpgrade) {
      return [];
    }

    return upgrades
      .filter((upgrade) => upgrade.prerequisite === selectedUpgrade.id)
      .map((upgrade) => upgrade.name);
  }, [selectedUpgrade]);

  if (!selectedUpgrade) {
    return null;
  }

  const selectedCostLabel = selectedUpgrade.isMaxed ? "Maxed" : selectedUpgrade.costLabel;

  return (
    <div className="upgrade-page upgrade-structured-page">
      <div className="upgrade-page-header">
        <div>
          <h2 className="upgrade-page-title">Upgrades</h2>
          <p className="upgrade-page-subtitle">
            Browse one category at a time, compare clean rows, and use the detail panel for the deeper read before you commit currency.
          </p>
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

      <div className="upgrade-structured-layout">
        <aside className="shell-card upgrade-category-rail">
          <div className="upgrade-category-rail-header">
            <p className="shell-card-eyebrow">Categories</p>
            <h3 className="shell-card-title">Choose a progression track</h3>
            <p className="upgrade-category-rail-copy">Each category keeps its own upgrade lane and affordability summary so you can spot your next spend faster.</p>
          </div>

          <div className="upgrade-category-list">
            {upgradeCategories.map((category) => {
              const stats = categoryStats[category];
              const active = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  className={`upgrade-category-button${active ? " upgrade-category-button-active" : ""}`}
                  onClick={() => {
                    setActiveCategory(category);
                    setSelectedUpgradeId(pickSelectedUpgradeId(rowsByCategory[category]));
                  }}
                >
                  <div className="upgrade-category-button-topline">
                    <span className="upgrade-category-button-name">{getUpgradeCategoryLabel(category)}</span>
                    {stats.affordable > 0 ? <span className="upgrade-category-button-badge">{stats.affordable}</span> : null}
                  </div>
                  <span className="upgrade-category-button-copy">{getUpgradeCategoryDescription(category)}</span>
                  <div className="upgrade-category-button-metrics">
                    <span>{stats.unlocked}/{stats.total} unlocked</span>
                    <span>{stats.affordable} ready</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="upgrade-main-column">
          <section className="shell-card upgrade-category-summary-card">
            <div className="upgrade-category-summary-header">
              <div>
                <p className="shell-card-eyebrow">Selected category</p>
                <h3 className="shell-card-title">{getUpgradeCategoryLabel(activeCategory)}</h3>
                <p className="upgrade-category-summary-copy">{getUpgradeCategoryDescription(activeCategory)}</p>
              </div>
              <div className="upgrade-category-summary-stats">
                <span>{categoryStats[activeCategory].unlocked} unlocked</span>
                <span>{categoryStats[activeCategory].affordable} affordable</span>
                <span>{groupedRows.length} groups</span>
              </div>
            </div>
          </section>

          <div className="upgrade-group-stack">
            {groupedRows.map((group) => (
              <section key={group.groupName} className="shell-card upgrade-group-card">
                <div className="upgrade-group-header">
                  <div>
                    <p className="shell-card-eyebrow">{group.rows[0]?.lane ?? "Track"}</p>
                    <h3 className="upgrade-group-title">{group.groupName}</h3>
                  </div>
                  <div className="upgrade-group-meta">
                    <span>{group.rows.filter((row) => row.level > 0).length} owned</span>
                    <span>{group.rows.filter((row) => row.canBuy).length} ready</span>
                  </div>
                </div>

                <div className="upgrade-row-list">
                  {group.rows.map((row) => (
                    <div
                      key={row.id}
                      className={`upgrade-row${row.id === selectedUpgrade.id ? " upgrade-row-selected" : ""}${row.canBuy ? " upgrade-row-ready" : ""}`}
                    >
                      <button
                        type="button"
                        className="upgrade-row-select"
                        aria-pressed={row.id === selectedUpgrade.id}
                        onClick={() => setSelectedUpgradeId(row.id)}
                      >
                        <div className="upgrade-row-primary">
                          <div className="upgrade-row-title-line">
                            <span className="upgrade-row-title">{row.definition.name}</span>
                            <span className={`upgrade-kind-chip upgrade-kind-chip-${row.kind}`}>{getKindLabel(row.kind)}</span>
                            <span className="upgrade-tier-chip">Tier {row.tier}</span>
                          </div>
                          <p className="upgrade-row-description">{row.definition.description}</p>
                        </div>

                        <div className="upgrade-row-summary">
                          <span className="upgrade-row-metric">Lv {row.level}</span>
                          <span className={`upgrade-row-status upgrade-row-status-${row.tone}`}>{row.statusLabel}</span>
                          <span className="upgrade-row-cost">{row.isMaxed ? "Maxed" : row.costLabel}</span>
                        </div>

                        <div className="upgrade-row-effects">
                          <div className="upgrade-row-effect-block">
                            <span className="upgrade-row-effect-label">Current</span>
                            <span className="upgrade-row-effect-value">{row.currentEffect}</span>
                          </div>
                          <div className="upgrade-row-effect-block">
                            <span className="upgrade-row-effect-label">Next</span>
                            <span className="upgrade-row-effect-value">{row.nextEffect}</span>
                          </div>
                        </div>

                        <div className="upgrade-row-footnote">
                          {row.state === "locked" ? `Locked: ${row.requirementText}` : row.canBuy ? "Affordable now" : "Available once you can afford the cost"}
                        </div>
                      </button>

                      <div className="upgrade-row-actions">
                        <button type="button" className="btn" onClick={() => setSelectedUpgradeId(row.id)}>
                          Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => onBuyUpgrade(row.id)}
                          disabled={!row.canBuy}
                        >
                          {row.isMaxed ? "Maxed" : row.canBuy ? "Buy" : "Blocked"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <aside className="shell-card upgrade-detail-panel">
          <div className="upgrade-detail-header">
            <div>
              <p className="shell-card-eyebrow">Selected upgrade</p>
              <h3 className="upgrade-detail-title">{selectedUpgrade.definition.name}</h3>
            </div>
            <span className={`upgrade-kind-chip upgrade-kind-chip-${selectedUpgrade.kind}`}>{getKindLabel(selectedUpgrade.kind)}</span>
          </div>

          <p className="upgrade-detail-copy">{selectedUpgrade.definition.description}</p>

          <div className="upgrade-detail-metrics">
            <div className="upgrade-detail-metric">
              <span className="upgrade-detail-label">Status</span>
              <span className={`upgrade-detail-value upgrade-detail-value-${selectedUpgrade.tone}`}>{selectedUpgrade.statusLabel}</span>
            </div>
            <div className="upgrade-detail-metric">
              <span className="upgrade-detail-label">Level</span>
              <span className="upgrade-detail-value">Lv {selectedUpgrade.level}</span>
            </div>
            <div className="upgrade-detail-metric">
              <span className="upgrade-detail-label">Current effect</span>
              <span className="upgrade-detail-value">{selectedUpgrade.currentEffect}</span>
            </div>
            <div className="upgrade-detail-metric">
              <span className="upgrade-detail-label">Next effect</span>
              <span className="upgrade-detail-value">{selectedUpgrade.nextEffect}</span>
            </div>
            <div className="upgrade-detail-metric">
              <span className="upgrade-detail-label">Cost</span>
              <span className="upgrade-detail-value">{selectedCostLabel}</span>
            </div>
            <div className="upgrade-detail-metric">
              <span className="upgrade-detail-label">Prerequisite</span>
              <span className="upgrade-detail-value">{selectedUpgrade.requirementText}</span>
            </div>
          </div>

          <button type="button" className="btn btn-primary upgrade-detail-buy" onClick={() => onBuyUpgrade(selectedUpgrade.id)} disabled={!selectedUpgrade.canBuy}>
            {selectedUpgrade.isMaxed ? "Maxed" : selectedUpgrade.canBuy ? `Buy for ${selectedUpgrade.costLabel}` : "Not affordable yet"}
          </button>

          <div className="upgrade-detail-section">
            <span className="upgrade-detail-section-title">Unlocks next</span>
            {selectedUnlocksNext.length > 0 ? (
              <div className="upgrade-token-list">
                {selectedUnlocksNext.map((name) => (
                  <span key={name} className="upgrade-token">{name}</span>
                ))}
              </div>
            ) : (
              <p className="upgrade-detail-note">This upgrade is currently a leaf in the visible chain.</p>
            )}
          </div>

          <div className="upgrade-detail-section">
            <span className="upgrade-detail-section-title">What unlocks soon</span>
            {upcomingUnlocks.length > 0 ? (
              <div className="upgrade-upcoming-list">
                {upcomingUnlocks.map((upgrade) => (
                  <div key={upgrade.id} className="upgrade-upcoming-item">
                    <span className="upgrade-upcoming-name">{upgrade.name}</span>
                    <span className="upgrade-upcoming-requirement">{upgrade.requirementText}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="upgrade-detail-note">Everything in this category is already open or owned.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
