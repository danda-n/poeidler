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
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Header stats row */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {upgradeCategories.map((category) => {
            const stats = categoryStats[category];
            const active = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[0.72rem] font-semibold cursor-pointer transition-all duration-150 ${
                  active
                    ? "border-[rgba(244,213,140,0.3)] bg-[rgba(244,213,140,0.12)] text-accent-gold"
                    : "border-border-subtle bg-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
                }`}
                onClick={() => {
                  setActiveCategory(category);
                  setSelectedUpgradeId(pickSelectedUpgradeId(rowsByCategory[category]));
                }}
              >
                {getUpgradeCategoryLabel(category)}
                {stats.affordable > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full text-[0.52rem] font-extrabold flex items-center justify-center text-bg-surface bg-accent-gold">
                    {stats.affordable}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-[0.68rem]">
          <span className="text-text-secondary"><span className="font-bold text-text-bright">{totalAffordable}</span> ready</span>
          <span className="text-text-secondary"><span className="font-bold text-text-bright">{purchasedCount}</span> owned</span>
          <span className="text-text-secondary"><span className="font-bold text-text-bright">{formatCurrencyValue(prestige.totalMirrorShards)}</span> shards</span>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] gap-3 overflow-hidden">
        {/* Upgrade list */}
        <div className="overflow-y-auto grid gap-2 content-start pr-1">
          {groupedRows.map((group) => (
            <section key={group.groupName} className="grid gap-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-[0.72rem] font-extrabold text-[#7f8ca3] uppercase tracking-[0.08em]">{group.groupName}</span>
                <div className="flex items-center gap-2">
                  <span className={pill}>{group.rows.filter((row) => row.level > 0).length} owned</span>
                  <span className={pill}>{group.rows.filter((row) => row.canBuy).length} ready</span>
                </div>
              </div>
              {group.rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`w-full grid gap-1 p-2.5 rounded-xl border bg-[rgba(255,255,255,0.03)] text-left cursor-pointer transition-all duration-100 hover:bg-[rgba(255,255,255,0.05)] ${
                    row.id === selectedUpgrade.id
                      ? "border-[rgba(244,213,140,0.24)] bg-gradient-to-b from-[rgba(244,213,140,0.08)] to-[rgba(255,255,255,0.03)]"
                      : row.canBuy
                        ? "border-[rgba(88,217,139,0.22)]"
                        : "border-[rgba(255,255,255,0.08)]"
                  }`}
                  onClick={() => setSelectedUpgradeId(row.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.78rem] font-extrabold text-[#f7f3e8]">{row.definition.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`${pill} ${kindColors[row.kind]}`}>{getKindLabel(row.kind)}</span>
                      <span className={`${pill} ${toneColors[row.tone]}`}>{row.statusLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[0.68rem]">
                    <span className="text-text-secondary">Lv {row.level} · {row.currentEffect}</span>
                    <span className="text-text-secondary tabular-nums">{row.isMaxed ? "Maxed" : row.costLabel}</span>
                  </div>
                </button>
              ))}
            </section>
          ))}
        </div>

        {/* Detail panel */}
        <aside className="overflow-y-auto grid gap-2.5 p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] content-start">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 text-[0.88rem] font-extrabold text-[#f7f3e8]">{selectedUpgrade.definition.name}</h3>
            <span className={`${pill} ${kindColors[selectedUpgrade.kind]}`}>{getKindLabel(selectedUpgrade.kind)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className={detailCard}>
              <span className={metricLabel}>Status</span>
              <span className={metricValue}>{selectedUpgrade.statusLabel}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Level</span>
              <span className={metricValue}>Lv {selectedUpgrade.level}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Current</span>
              <span className={metricValue}>{selectedUpgrade.currentEffect}</span>
            </div>
            <div className={detailCard}>
              <span className={metricLabel}>Next</span>
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

          {selectedUnlocksNext.length > 0 && (
            <div className="grid gap-1">
              <span className={metricLabel}>Unlocks next</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedUnlocksNext.map((name) => (
                  <span key={name} className={pill}>{name}</span>
                ))}
              </div>
            </div>
          )}

          {upcomingUnlocks.length > 0 && (
            <div className="grid gap-1">
              <span className={metricLabel}>Upcoming</span>
              {upcomingUnlocks.map((upgrade) => (
                <div key={upgrade.id} className={detailCard}>
                  <span className={metricValue}>{upgrade.name}</span>
                  <span className="text-[0.65rem] text-text-secondary">{upgrade.requirementText}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
});
