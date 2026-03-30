import { memo, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import {
  canPurchaseUpgrade,
  getAffordableUpgradeCount,
  getUpgradeCategoryDescription,
  getUpgradeCategoryLabel,
  getUpgradeCategoryStats,
  getUpgradeCost,
  getUpgradesByCategory,
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
import { useGameStore } from "@/store/useGameStore";
import { useActions } from "@/store/selectors/useActions";

type UpgradeTone = "ready" | "owned" | "open" | "locked";

type StructuralRow = {
  id: UpgradeId;
  definition: UpgradeDefinition;
  level: number;
  tier: number;
  lane: string;
  kind: UpgradeNodeKind;
  costLabel: string;
  currentEffect: string;
  nextEffect: string;
  isMaxed: boolean;
};

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

export const UpgradePanel = memo(function UpgradePanel() {
  const currenciesState = useGameStore((s) => s.currencies);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);
  const prestige = useGameStore((s) => s.prestige);
  const { buyUpgrade: onBuyUpgrade } = useActions();
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

  const structuralRowsByCategory = useMemo(() => {
    return Object.fromEntries(
      upgradeCategories.map((category) => {
        const rows = getUpgradesByCategory(category)
          .map((definition) => {
            const upgradeId = definition.id;
            const presentation = getUpgradePresentation(upgradeId);
            const level = purchasedUpgrades[upgradeId];
            const nextLevel = definition.maxLevel !== undefined && level >= definition.maxLevel ? level : level + 1;

            return {
              id: upgradeId,
              definition,
              level,
              tier: presentation.tier,
              lane: presentation.lane,
              kind: presentation.kind,
              costLabel: formatUpgradeCost(getUpgradeCost(upgradeId, level)),
              currentEffect: level > 0 ? describeUpgradeEffect(definition, level, prestige.totalMirrorShards) : "Not active yet",
              nextEffect:
                definition.maxLevel !== undefined && level >= definition.maxLevel
                  ? "Already maxed"
                  : describeUpgradeEffect(definition, nextLevel, prestige.totalMirrorShards),
              isMaxed: definition.maxLevel !== undefined && level >= definition.maxLevel,
            };
          })
          .sort((left, right) => {
            if (left.tier !== right.tier) return left.tier - right.tier;
            if (left.lane !== right.lane) return left.lane.localeCompare(right.lane);
            return left.definition.name.localeCompare(right.definition.name);
          });

        return [category, rows];
      }),
    ) as Record<UpgradeCategory, StructuralRow[]>;
  }, [purchasedUpgrades, prestige.totalMirrorShards]);

  const rowsByCategory = useMemo(() => {
    return Object.fromEntries(
      upgradeCategories.map((category) => {
        const isActive = category === activeCategory;
        const rows = structuralRowsByCategory[category].map((base) => {
          if (!isActive) {
            const level = base.level;
            const fallbackState: UpgradeNodeState = base.isMaxed ? "maxed" : level > 0 ? "purchased" : "locked";
            return {
              ...base,
              state: fallbackState,
              tone: getStateTone(fallbackState),
              statusLabel: getUpgradeNodeStateLabel(fallbackState),
              canBuy: false,
              requirementText: "",
            } satisfies UpgradeRowViewModel;
          }
          const state = getUpgradeNodeState(availabilityState, base.id);
          return {
            ...base,
            state,
            tone: getStateTone(state),
            statusLabel: getUpgradeNodeStateLabel(state),
            canBuy: canPurchaseUpgrade(availabilityState, base.id),
            requirementText: getUpgradeNodeRequirementText(availabilityState, base.id),
          } satisfies UpgradeRowViewModel;
        });
        return [category, rows];
      }),
    ) as Record<UpgradeCategory, UpgradeRowViewModel[]>;
  }, [activeCategory, availabilityState, structuralRowsByCategory]);

  const statsThrottleRef = useRef<{ stats: Record<UpgradeCategory, ReturnType<typeof getUpgradeCategoryStats>>; total: number; lastAt: number; purchasedUpgrades: unknown }>({
    stats: {} as Record<UpgradeCategory, ReturnType<typeof getUpgradeCategoryStats>>,
    total: 0,
    lastAt: 0,
    purchasedUpgrades: null,
  });

  const { categoryStats, totalAffordable } = useMemo(() => {
    const now = Date.now();
    const cache = statsThrottleRef.current;
    const upgradesChanged = cache.purchasedUpgrades !== purchasedUpgrades;
    const throttleExpired = now - cache.lastAt >= 1000;

    if (!upgradesChanged && !throttleExpired && cache.lastAt > 0) {
      return { categoryStats: cache.stats, totalAffordable: cache.total };
    }

    const stats = Object.fromEntries(
      upgradeCategories.map((category) => [category, getUpgradeCategoryStats(availabilityState, category)]),
    ) as Record<UpgradeCategory, ReturnType<typeof getUpgradeCategoryStats>>;
    const total = getAffordableUpgradeCount(availabilityState);

    statsThrottleRef.current = { stats, total, lastAt: now, purchasedUpgrades };
    return { categoryStats: stats, totalAffordable: total };
  }, [availabilityState, purchasedUpgrades]);
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

  const shellCard = "grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]";
  const eyebrow = "m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]";
  const cardTitle = "m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]";
  const pill = "inline-flex items-center px-[9px] py-1 rounded-full text-[0.64rem] font-extrabold tracking-[0.04em] bg-[rgba(255,255,255,0.05)] text-[#b6c4d7]";
  const subcopy = "m-0 text-[0.74rem] leading-[1.5] text-[#95a3b9]";
  const metricLabel = "text-[0.66rem] font-extrabold tracking-[0.08em] uppercase text-[#75839a]";
  const metricValue = "text-[0.74rem] leading-[1.45] text-[#edf0f6]";
  const btn = "px-3 py-1.5 border border-[rgba(255,211,106,0.2)] rounded-md text-[0.78rem] font-semibold text-accent-gold bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(255,211,106,0.1)] hover:not-disabled:border-[rgba(255,211,106,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed min-w-[78px]";
  const btnPrimary = "px-3 py-1.5 border border-transparent rounded-md text-[0.78rem] font-bold text-bg-surface bg-gradient-to-b from-gradient-gold-start to-gradient-gold-end cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:from-[#ffe08a] hover:not-disabled:to-[#ebb730] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed min-w-[78px]";
  const detailCard = "grid gap-1.5 px-3 py-2.5 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]";

  const kindColors: Record<UpgradeNodeKind, string> = {
    minor: "bg-[rgba(107,194,255,0.14)] !text-[#9cd8ff]",
    unlock: "bg-[rgba(241,204,116,0.14)] !text-[#f5d98f]",
    keystone: "bg-[rgba(239,156,95,0.14)] !text-[#ffbf90]",
  };

  const toneColors: Record<UpgradeTone, string> = {
    ready: "bg-[rgba(88,217,139,0.16)] !text-[#9ef0bf]",
    owned: "bg-[rgba(241,204,116,0.14)] !text-[#f5d98f]",
    open: "bg-[rgba(107,194,255,0.14)] !text-[#9cd8ff]",
    locked: "bg-[rgba(108,118,136,0.16)] !text-[#a1acbc]",
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold text-accent-gold">Upgrades</h2>
          <p className="mt-1 mb-0 max-w-[680px] text-[0.74rem] text-[#8c8c94]">
            Browse one category at a time, compare clean rows, and use the detail panel for the deeper read before you commit currency.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(3,minmax(86px,1fr))] gap-2">
          <div className="grid gap-0.5 px-2.5 py-2 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-right">
            <span className="text-[0.88rem] font-bold text-text-bright">{totalAffordable}</span>
            <span className="text-[0.66rem] text-[#777] uppercase tracking-[0.05em]">Ready now</span>
          </div>
          <div className="grid gap-0.5 px-2.5 py-2 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-right">
            <span className="text-[0.88rem] font-bold text-text-bright">{purchasedCount}</span>
            <span className="text-[0.66rem] text-[#777] uppercase tracking-[0.05em]">Owned</span>
          </div>
          <div className="grid gap-0.5 px-2.5 py-2 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-right">
            <span className="text-[0.88rem] font-bold text-text-bright">{formatCurrencyValue(prestige.totalMirrorShards)}</span>
            <span className="text-[0.66rem] text-[#777] uppercase tracking-[0.05em]">Total shards</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(320px,360px)] gap-4 items-start">
        <aside className={`${shellCard} sticky top-0 content-start !gap-3.5`}>
          <div>
            <p className={eyebrow}>Categories</p>
            <h3 className={cardTitle}>Choose a progression track</h3>
            <p className={subcopy}>Each category keeps its own upgrade lane and affordability summary so you can spot your next spend faster.</p>
          </div>

          <div className="grid gap-3">
            {upgradeCategories.map((category) => {
              const stats = categoryStats[category];
              const active = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  className={`grid gap-2 w-full p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-150${active ? " border-[rgba(244,213,140,0.3)] bg-gradient-to-b from-[rgba(244,213,140,0.1)] to-[rgba(255,255,255,0.03)] text-[#f4d58c]" : " border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#dce5f2] hover:border-[rgba(244,213,140,0.18)] hover:bg-[rgba(255,255,255,0.045)]"}`}
                  onClick={() => {
                    setActiveCategory(category);
                    setSelectedUpgradeId(pickSelectedUpgradeId(rowsByCategory[category]));
                  }}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[0.82rem] font-extrabold text-[#f7f3e8]">{getUpgradeCategoryLabel(category)}</span>
                    {stats.affordable > 0 ? <span className={`${pill} !bg-[rgba(88,217,139,0.16)] !text-[#9ef0bf]`}>{stats.affordable}</span> : null}
                  </div>
                  <span className={subcopy}>{getUpgradeCategoryDescription(category)}</span>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={pill}>{stats.unlocked}/{stats.total} unlocked</span>
                    <span className={pill}>{stats.affordable} ready</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="grid gap-3">
          <section className={`${shellCard} !gap-3.5`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className={eyebrow}>Selected category</p>
                <h3 className={cardTitle}>{getUpgradeCategoryLabel(activeCategory)}</h3>
                <p className={subcopy}>{getUpgradeCategoryDescription(activeCategory)}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[0.68rem] text-text-secondary">
                <span className={pill}>{categoryStats[activeCategory].unlocked} unlocked</span>
                <span className={pill}>{categoryStats[activeCategory].affordable} affordable</span>
                <span className={pill}>{groupedRows.length} groups</span>
              </div>
            </div>
          </section>

          <div className="grid gap-3">
            {groupedRows.map((group) => (
              <section key={group.groupName} className={`${shellCard} !gap-3.5`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className={eyebrow}>{group.rows[0]?.lane ?? "Track"}</p>
                    <h3 className="m-0 text-base font-extrabold text-[#f7f3e8]">{group.groupName}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={pill}>{group.rows.filter((row) => row.level > 0).length} owned</span>
                    <span className={pill}>{group.rows.filter((row) => row.canBuy).length} ready</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {group.rows.map((row) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 rounded-[18px] border bg-[rgba(255,255,255,0.03)]${row.id === selectedUpgrade.id ? " border-[rgba(244,213,140,0.24)] bg-gradient-to-b from-[rgba(244,213,140,0.08)] to-[rgba(255,255,255,0.03)]" : row.canBuy ? " border-[rgba(88,217,139,0.22)]" : " border-[rgba(255,255,255,0.08)]"}`}
                    >
                      <button
                        type="button"
                        className="grid gap-2.5 w-full p-0 border-0 bg-transparent text-inherit text-left cursor-pointer"
                        aria-pressed={row.id === selectedUpgrade.id}
                        onClick={() => setSelectedUpgradeId(row.id)}
                      >
                        <div className="grid gap-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[0.82rem] font-extrabold text-[#f7f3e8]">{row.definition.name}</span>
                            <span className={`${pill} ${kindColors[row.kind]}`}>{getKindLabel(row.kind)}</span>
                            <span className={pill}>Tier {row.tier}</span>
                          </div>
                          <p className={subcopy}>{row.definition.description}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={pill}>Lv {row.level}</span>
                          <span className={`${pill} ${toneColors[row.tone]}`}>{row.statusLabel}</span>
                          <span className={metricValue}>{row.isMaxed ? "Maxed" : row.costLabel}</span>
                        </div>

                        <div className="grid gap-1.5 grid-cols-[repeat(2,minmax(0,1fr))]">
                          <div className="grid gap-[3px] min-w-0">
                            <span className={metricLabel}>Current</span>
                            <span className="text-[0.74rem] leading-[1.45]">{row.currentEffect}</span>
                          </div>
                          <div className="grid gap-[3px] min-w-0">
                            <span className={metricLabel}>Next</span>
                            <span className="text-[0.74rem] leading-[1.45]">{row.nextEffect}</span>
                          </div>
                        </div>

                        <div className={subcopy}>
                          {row.state === "locked" ? `Locked: ${row.requirementText}` : row.canBuy ? "Affordable now" : "Available once you can afford the cost"}
                        </div>
                      </button>

                      <div className="flex items-center justify-end gap-2 flex-wrap content-start min-w-[118px]">
                        <button type="button" className={btn} onClick={() => setSelectedUpgradeId(row.id)}>
                          Details
                        </button>
                        <button
                          type="button"
                          className={btnPrimary}
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

        <aside className={`${shellCard} sticky top-0 content-start !gap-3.5`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className={eyebrow}>Selected upgrade</p>
              <h3 className="m-0 text-base font-extrabold text-[#f7f3e8]">{selectedUpgrade.definition.name}</h3>
            </div>
            <span className={`${pill} ${kindColors[selectedUpgrade.kind]}`}>{getKindLabel(selectedUpgrade.kind)}</span>
          </div>

          <p className={subcopy}>{selectedUpgrade.definition.description}</p>

          <div className="grid gap-3">
            <div className={detailCard}>
              <span className={metricLabel}>Status</span>
              <span className={metricValue}>{selectedUpgrade.statusLabel}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Level</span>
              <span className={metricValue}>Lv {selectedUpgrade.level}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Current effect</span>
              <span className={metricValue}>{selectedUpgrade.currentEffect}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Next effect</span>
              <span className={metricValue}>{selectedUpgrade.nextEffect}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Cost</span>
              <span className={metricValue}>{selectedCostLabel}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Prerequisite</span>
              <span className={metricValue}>{selectedUpgrade.requirementText}</span>
            </div>
          </div>

          <button type="button" className={`w-full ${btnPrimary}`} onClick={() => onBuyUpgrade(selectedUpgrade.id)} disabled={!selectedUpgrade.canBuy}>
            {selectedUpgrade.isMaxed ? "Maxed" : selectedUpgrade.canBuy ? `Buy for ${selectedUpgrade.costLabel}` : "Not affordable yet"}
          </button>

          <div className="grid gap-1.5">
            <span className={metricLabel}>Unlocks next</span>
            {selectedUnlocksNext.length > 0 ? (
              <div className="flex items-center justify-start gap-2 flex-wrap">
                {selectedUnlocksNext.map((name) => (
                  <span key={name} className={pill}>{name}</span>
                ))}
              </div>
            ) : (
              <p className={subcopy}>This upgrade is currently a leaf in the visible chain.</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <span className={metricLabel}>What unlocks soon</span>
            {upcomingUnlocks.length > 0 ? (
              <div className="grid gap-3">
                {upcomingUnlocks.map((upgrade) => (
                  <div key={upgrade.id} className={detailCard}>
                    <span className={metricValue}>{upgrade.name}</span>
                    <span className={subcopy}>{upgrade.requirementText}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={subcopy}>Everything in this category is already open or owned.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
});
