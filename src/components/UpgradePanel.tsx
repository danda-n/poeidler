import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatCurrencyValue, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import type { PrestigeState } from "../game/prestige";
import {
  canPurchaseUpgrade,
  getAffordableUpgradeCount,
  getUpgradeCategoryDescription,
  getUpgradeCategoryLabel,
  getUpgradeCategoryStats,
  getUpgradeCost,
  type PurchasedUpgradeState,
  type UpgradeAvailabilityState,
  type UpgradeCategory,
  type UpgradeId,
  upgradeCategories,
} from "../game/upgradeEngine";
import {
  describeUpgradeEffect,
  formatUpgradeCost,
  getUpgradeNodeRequirementText,
  getUpgradeNodeState,
  getUpgradeNodeStateLabel,
  getUpgradePresentation,
  getUpgradeTree,
} from "../game/upgradeTree";

type UpgradePanelProps = {
  currenciesState: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

type GraphPath = {
  key: string;
  d: string;
  tone: string;
};

function pickSelectedUpgradeId(category: UpgradeCategory, availabilityState: UpgradeAvailabilityState) {
  const tree = getUpgradeTree(category);
  const readyNode = tree.nodes.find((node) => getUpgradeNodeState(availabilityState, node.definition.id as UpgradeId) === "available");
  if (readyNode) return readyNode.definition.id as UpgradeId;

  const ownedNode = tree.nodes.find((node) => {
    const state = getUpgradeNodeState(availabilityState, node.definition.id as UpgradeId);
    return state === "purchased" || state === "maxed";
  });
  if (ownedNode) return ownedNode.definition.id as UpgradeId;

  return tree.nodes[0]?.definition.id as UpgradeId;
}

function getKindLabel(kind: ReturnType<typeof getUpgradePresentation>["kind"]) {
  switch (kind) {
    case "minor":
      return "Minor";
    case "unlock":
      return "Unlock";
    case "keystone":
      return "Major";
  }
}

function getStateTone(nodeState: ReturnType<typeof getUpgradeNodeState>) {
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

export function UpgradePanel({ currenciesState, purchasedUpgrades, unlockedCurrencies, prestige, onBuyUpgrade }: UpgradePanelProps) {
  const [activeCategory, setActiveCategory] = useState<UpgradeCategory>("generators");
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<UpgradeId | null>(null);
  const [paths, setPaths] = useState<GraphPath[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Partial<Record<UpgradeId, HTMLDivElement | null>>>({});

  const availabilityState: UpgradeAvailabilityState = {
    currencies: currenciesState,
    purchasedUpgrades,
    unlockedCurrencies,
    prestige,
  };

  const categoryStats = Object.fromEntries(
    upgradeCategories.map((category) => [category, getUpgradeCategoryStats(availabilityState, category)]),
  ) as Record<UpgradeCategory, ReturnType<typeof getUpgradeCategoryStats>>;

  const tree = getUpgradeTree(activeCategory);
  const totalAffordable = getAffordableUpgradeCount(availabilityState);
  const purchasedCount = Object.values(purchasedUpgrades).filter((level) => level > 0).length;
  const selectedNode = tree.nodes.find((node) => node.definition.id === selectedUpgradeId) ?? tree.nodes[0] ?? null;
  const selectionSignature = `${activeCategory}:${Object.values(purchasedUpgrades).join(",")}:${Object.values(unlockedCurrencies).map((value) => (value ? 1 : 0)).join("")}:${prestige.mapsCompleted}:${prestige.prestigeCount}:${prestige.totalMirrorShards}`;
  const pathSignature = `${selectionSignature}:${Object.values(currenciesState).map((value) => Math.floor(value)).join(",")}`;

  useEffect(() => {
    const nextSelectedId = pickSelectedUpgradeId(activeCategory, availabilityState);
    if (!selectedUpgradeId || !tree.nodes.some((node) => node.definition.id === selectedUpgradeId)) {
      setSelectedUpgradeId(nextSelectedId);
    }
  }, [selectionSignature, selectedUpgradeId, tree.nodes, activeCategory]);

  useEffect(() => {
    function measurePaths() {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      const nextPaths: GraphPath[] = tree.edges.flatMap((edge) => {
        const fromEl = nodeRefs.current[edge.fromId];
        const toEl = nodeRefs.current[edge.toId];
        if (!fromEl || !toEl) return [];

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const startX = fromRect.right - boardRect.left;
        const startY = fromRect.top + fromRect.height / 2 - boardRect.top;
        const endX = toRect.left - boardRect.left;
        const endY = toRect.top + toRect.height / 2 - boardRect.top;
        const bend = Math.max(28, Math.abs(endX - startX) * 0.35);
        const targetState = getUpgradeNodeState(availabilityState, edge.toId);

        return [{
          key: `${edge.fromId}-${edge.toId}`,
          d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
          tone: getStateTone(targetState),
        }];
      });

      setPaths(nextPaths);
    }

    const frame = window.requestAnimationFrame(measurePaths);
    const observer = typeof ResizeObserver !== "undefined" && boardRef.current ? new ResizeObserver(measurePaths) : null;
    if (observer && boardRef.current) {
      observer.observe(boardRef.current);
    }

    window.addEventListener("resize", measurePaths);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measurePaths);
    };
  }, [pathSignature, tree.edges]);

  function handleNodeKeyDown(event: KeyboardEvent<HTMLDivElement>, upgradeId: UpgradeId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedUpgradeId(upgradeId);
    }
  }

  if (!selectedNode) {
    return null;
  }

  const selectedDefinition = selectedNode.definition;
  const selectedId = selectedDefinition.id as UpgradeId;
  const selectedPresentation = selectedNode.presentation;
  const selectedLevel = purchasedUpgrades[selectedId];
  const selectedCost = getUpgradeCost(selectedId, selectedLevel);
  const selectedState = getUpgradeNodeState(availabilityState, selectedId);
  const selectedCanBuy = canPurchaseUpgrade(availabilityState, selectedId);
  const selectedCurrentEffect = selectedLevel > 0 ? describeUpgradeEffect(selectedDefinition, selectedLevel, prestige.totalMirrorShards) : "Not active yet";
  const selectedNextEffect =
    selectedDefinition.maxLevel !== undefined && selectedLevel >= selectedDefinition.maxLevel
      ? "Already maxed"
      : describeUpgradeEffect(selectedDefinition, selectedLevel + 1, prestige.totalMirrorShards);

  return (
    <div className="upgrade-page upgrade-tree-page">
      <div className="upgrade-page-header">
        <div>
          <h2 className="upgrade-page-title">Upgrades</h2>
          <p className="upgrade-page-subtitle">Build through readable branches instead of scanning a long shopping list. Each category is now a compact progression board with clear next steps.</p>
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
              onClick={() => {
                setActiveCategory(category);
                setSelectedUpgradeId(pickSelectedUpgradeId(category, availabilityState));
              }}
            >
              <span className="upgrade-category-tab-name">{getUpgradeCategoryLabel(category)}</span>
              <span className="upgrade-category-tab-meta">{stats.unlocked}/{stats.total}</span>
              {stats.affordable > 0 && <span className="upgrade-category-tab-badge">{stats.affordable}</span>}
            </button>
          );
        })}
      </div>

      <div className="upgrade-category-summary upgrade-tree-summary">
        <div>
          <div className="upgrade-category-summary-title">{getUpgradeCategoryLabel(activeCategory)}</div>
          <div className="upgrade-category-summary-copy">{getUpgradeCategoryDescription(activeCategory)}</div>
        </div>
        <div className="upgrade-category-summary-stats">
          <span>{categoryStats[activeCategory].unlocked} unlocked</span>
          <span>{categoryStats[activeCategory].affordable} affordable</span>
          <span>{tree.tierCount} tiers</span>
        </div>
      </div>

      <div className="upgrade-tree-legend">
        <span className="upgrade-legend-item"><span className="upgrade-legend-swatch upgrade-legend-swatch-minor" />Minor node</span>
        <span className="upgrade-legend-item"><span className="upgrade-legend-swatch upgrade-legend-swatch-unlock" />Unlock node</span>
        <span className="upgrade-legend-item"><span className="upgrade-legend-swatch upgrade-legend-swatch-keystone" />Major node</span>
        <span className="upgrade-legend-item"><span className="upgrade-legend-swatch upgrade-legend-swatch-ready" />Ready now</span>
      </div>

      <div className="upgrade-tree-layout">
        <section className="shell-card upgrade-tree-shell">
          <div className="upgrade-tree-tier-header">
            <div className="upgrade-tree-tier-spacer">Branch</div>
            {Array.from({ length: tree.tierCount }, (_, index) => (
              <div key={index + 1} className="upgrade-tree-tier-pill">Tier {index + 1}</div>
            ))}
          </div>

          <div className="upgrade-tree-board" ref={boardRef}>
            <svg className="upgrade-tree-lines" aria-hidden="true">
              {paths.map((path) => (
                <path key={path.key} d={path.d} className={`upgrade-tree-path upgrade-tree-path-${path.tone}`} />
              ))}
            </svg>

            <div className="upgrade-tree-grid" style={{ gridTemplateColumns: `160px repeat(${tree.tierCount}, minmax(180px, 1fr))`, gridTemplateRows: `repeat(${tree.lanes.length}, minmax(148px, auto))` }}>
              {tree.lanes.map((lane) => (
                <div key={lane.label} className="upgrade-tree-lane-label" style={{ gridColumn: 1, gridRow: lane.order }}>
                  <span className="upgrade-tree-lane-name">{lane.label}</span>
                  <span className="upgrade-tree-lane-copy">{lane.order === 1 ? "Primary route" : lane.order === 2 ? "Branch route" : "Late route"}</span>
                </div>
              ))}

              {tree.nodes.map((node) => {
                const upgradeId = node.definition.id as UpgradeId;
                const nodeState = getUpgradeNodeState(availabilityState, upgradeId);
                const level = purchasedUpgrades[upgradeId];
                const cost = getUpgradeCost(upgradeId, level);
                const affordable = canPurchaseUpgrade(availabilityState, upgradeId);
                const presentation = node.presentation;
                const isSelected = upgradeId === selectedId;

                return (
                  <div
                    key={upgradeId}
                    ref={(element) => {
                      nodeRefs.current[upgradeId] = element;
                    }}
                    role="button"
                    tabIndex={0}
                    className={`upgrade-node upgrade-node-${presentation.kind} upgrade-node-${nodeState}${isSelected ? " upgrade-node-selected" : ""}`}
                    style={{ gridColumn: presentation.tier + 1, gridRow: presentation.laneOrder }}
                    onClick={() => setSelectedUpgradeId(upgradeId)}
                    onKeyDown={(event) => handleNodeKeyDown(event, upgradeId)}
                  >
                    <div className="upgrade-node-topline">
                      <span className="upgrade-node-kind">{getKindLabel(presentation.kind)}</span>
                      <span className="upgrade-node-level">Lv {level}</span>
                    </div>
                    <div className="upgrade-node-title">{presentation.shortLabel}</div>
                    <div className="upgrade-node-effect">{presentation.shortEffect}</div>
                    <div className="upgrade-node-footer">
                      <span className={`upgrade-node-state upgrade-node-state-${getStateTone(nodeState)}`}>{getUpgradeNodeStateLabel(nodeState)}</span>
                      <span className={`upgrade-node-cost${affordable ? " upgrade-node-cost-ready" : ""}`}>{formatUpgradeCost(cost)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="shell-card upgrade-focus-card">
          <div className="upgrade-focus-header">
            <div>
              <p className="shell-card-eyebrow">Selected node</p>
              <h3 className="upgrade-focus-title">{selectedPresentation.shortLabel}</h3>
            </div>
            <span className={`upgrade-focus-kind upgrade-focus-kind-${selectedPresentation.kind}`}>{getKindLabel(selectedPresentation.kind)}</span>
          </div>

          <p className="upgrade-focus-copy">{selectedDefinition.description}</p>

          <div className="upgrade-focus-stats">
            <div className="upgrade-focus-stat">
              <span className="upgrade-focus-stat-label">State</span>
              <span className={`upgrade-focus-stat-value upgrade-focus-stat-value-${getStateTone(selectedState)}`}>{getUpgradeNodeStateLabel(selectedState)}</span>
            </div>
            <div className="upgrade-focus-stat">
              <span className="upgrade-focus-stat-label">Current</span>
              <span className="upgrade-focus-stat-value">{selectedCurrentEffect}</span>
            </div>
            <div className="upgrade-focus-stat">
              <span className="upgrade-focus-stat-label">Next</span>
              <span className="upgrade-focus-stat-value">{selectedNextEffect}</span>
            </div>
            <div className="upgrade-focus-stat">
              <span className="upgrade-focus-stat-label">Cost</span>
              <span className="upgrade-focus-stat-value">{formatUpgradeCost(selectedCost)}</span>
            </div>
          </div>

          <div className="upgrade-focus-requirements">
            <span className="upgrade-focus-section-label">Unlock condition</span>
            <span className="upgrade-focus-requirement">{getUpgradeNodeRequirementText(availabilityState, selectedId)}</span>
          </div>

          <button className="btn upgrade-focus-buy" type="button" onClick={() => onBuyUpgrade(selectedId)} disabled={!selectedCanBuy}>
            {selectedState === "maxed" ? "Maxed" : selectedCanBuy ? `Buy for ${formatUpgradeCost(selectedCost)}` : `Need ${formatUpgradeCost(selectedCost)}`}
          </button>
        </aside>
      </div>
    </div>
  );
}
