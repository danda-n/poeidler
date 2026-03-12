import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { formatCurrencyValue, type CurrencyState, type UnlockedCurrencyState } from "@/game/currencies";
import type { PrestigeState } from "@/game/prestige";
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
} from "@/game/upgradeEngine";
import {
  describeUpgradeEffect,
  formatUpgradeCost,
  getUpgradeNodeRequirementText,
  getUpgradeNodeState,
  getUpgradeNodeStateLabel,
  getUpgradeTree,
  type UpgradeNodeState,
  type UpgradeTreeModel,
} from "@/game/upgradeTree";

type UpgradePanelProps = {
  currenciesState: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

type GraphPathGeometry = {
  key: string;
  d: string;
  toId: UpgradeId;
};

type UpgradeTone = "ready" | "owned" | "open" | "locked";

type UpgradeNodeRuntime = {
  id: UpgradeId;
  level: number;
  state: UpgradeNodeState;
  tone: UpgradeTone;
  costLabel: string;
  canBuy: boolean;
};

type UpgradeTreeNodeCardProps = {
  node: UpgradeTreeModel["nodes"][number];
  runtime: UpgradeNodeRuntime;
  isSelected: boolean;
  onSelect: (upgradeId: UpgradeId) => void;
  onKeySelect: (event: KeyboardEvent<HTMLDivElement>, upgradeId: UpgradeId) => void;
  nodeRefs: React.MutableRefObject<Partial<Record<UpgradeId, HTMLDivElement | null>>>;
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

function getKindLabel(kind: UpgradeTreeModel["nodes"][number]["presentation"]["kind"]) {
  switch (kind) {
    case "minor":
      return "Minor";
    case "unlock":
      return "Unlock";
    case "keystone":
      return "Major";
  }
}

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

const laneCopyByOrder: Record<number, string> = {
  1: "Primary route",
  2: "Branch route",
  3: "Late route",
};

const UpgradeTreeNodeCard = memo(function UpgradeTreeNodeCard({
  node,
  runtime,
  isSelected,
  onSelect,
  onKeySelect,
  nodeRefs,
}: UpgradeTreeNodeCardProps) {
  return (
    <div
      ref={(element) => {
        nodeRefs.current[node.definition.id as UpgradeId] = element;
      }}
      role="button"
      tabIndex={0}
      className={`upgrade-node upgrade-node-${node.presentation.kind} upgrade-node-${runtime.state}${isSelected ? " upgrade-node-selected" : ""}`}
      style={{ gridColumn: node.gridColumn, gridRow: node.gridRow }}
      onClick={() => onSelect(node.definition.id as UpgradeId)}
      onKeyDown={(event) => onKeySelect(event, node.definition.id as UpgradeId)}
    >
      <div className="upgrade-node-topline">
        <span className="upgrade-node-kind">{getKindLabel(node.presentation.kind)}</span>
        <span className="upgrade-node-level">Lv {runtime.level}</span>
      </div>
      <div className="upgrade-node-title">{node.presentation.shortLabel}</div>
      <div className="upgrade-node-effect">{node.presentation.shortEffect}</div>
      <div className="upgrade-node-footer">
        <span className={`upgrade-node-state upgrade-node-state-${runtime.tone}`}>{getUpgradeNodeStateLabel(runtime.state)}</span>
        <span className={`upgrade-node-cost${runtime.canBuy ? " upgrade-node-cost-ready" : ""}`}>{runtime.costLabel}</span>
      </div>
    </div>
  );
});

const UpgradeConnectionLayer = memo(function UpgradeConnectionLayer({
  paths,
}: {
  paths: Array<{ key: string; d: string; tone: UpgradeTone }>;
}) {
  return (
    <svg className="upgrade-tree-lines" aria-hidden="true">
      {paths.map((path) => (
        <path key={path.key} d={path.d} className={`upgrade-tree-path upgrade-tree-path-${path.tone}`} />
      ))}
    </svg>
  );
});

export function UpgradePanel({ currenciesState, purchasedUpgrades, unlockedCurrencies, prestige, onBuyUpgrade }: UpgradePanelProps) {
  const [activeCategory, setActiveCategory] = useState<UpgradeCategory>("generators");
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<UpgradeId | null>(null);
  const [pathGeometry, setPathGeometry] = useState<GraphPathGeometry[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Partial<Record<UpgradeId, HTMLDivElement | null>>>({});

  const availabilityState = useMemo<UpgradeAvailabilityState>(
    () => ({
      currencies: currenciesState,
      purchasedUpgrades,
      unlockedCurrencies,
      prestige,
    }),
    [currenciesState, prestige, purchasedUpgrades, unlockedCurrencies],
  );

  const tree = useMemo(() => getUpgradeTree(activeCategory), [activeCategory]);
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

  const nodeRuntimeById = useMemo(() => {
    const nextRuntime = {} as Record<UpgradeId, UpgradeNodeRuntime>;

    tree.nodes.forEach((node) => {
      const upgradeId = node.definition.id as UpgradeId;
      const level = purchasedUpgrades[upgradeId];
      const state = getUpgradeNodeState(availabilityState, upgradeId);
      const cost = getUpgradeCost(upgradeId, level);

      nextRuntime[upgradeId] = {
        id: upgradeId,
        level,
        state,
        tone: getStateTone(state),
        costLabel: formatUpgradeCost(cost),
        canBuy: canPurchaseUpgrade(availabilityState, upgradeId),
      };
    });

    return nextRuntime;
  }, [availabilityState, purchasedUpgrades, tree.nodes]);

  const selectedNode = (selectedUpgradeId ? tree.nodeMap[selectedUpgradeId] : undefined) ?? tree.nodes[0] ?? null;
  const selectedId = selectedNode?.definition.id as UpgradeId | undefined;

  useEffect(() => {
    const nextSelectedId = pickSelectedUpgradeId(activeCategory, availabilityState);
    if (!selectedUpgradeId || !tree.nodeMap[selectedUpgradeId]) {
      setSelectedUpgradeId(nextSelectedId);
    }
  }, [activeCategory, availabilityState, selectedUpgradeId, tree.nodeMap]);

  useEffect(() => {
    function measurePathGeometry() {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      const nextGeometry: GraphPathGeometry[] = tree.edges.flatMap((edge) => {
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

        return [{
          key: `${edge.fromId}-${edge.toId}`,
          toId: edge.toId,
          d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
        }];
      });

      setPathGeometry(nextGeometry);
    }

    const frame = window.requestAnimationFrame(measurePathGeometry);
    const observer = typeof ResizeObserver !== "undefined" && boardRef.current ? new ResizeObserver(measurePathGeometry) : null;
    if (observer && boardRef.current) {
      observer.observe(boardRef.current);
    }

    window.addEventListener("resize", measurePathGeometry);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measurePathGeometry);
    };
  }, [tree]);

  const renderedPaths = useMemo(
    () => pathGeometry.map((path) => ({ ...path, tone: nodeRuntimeById[path.toId]?.tone ?? "locked" })),
    [nodeRuntimeById, pathGeometry],
  );

  function handleNodeKeyDown(event: KeyboardEvent<HTMLDivElement>, upgradeId: UpgradeId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedUpgradeId(upgradeId);
    }
  }

  if (!selectedNode || !selectedId) {
    return null;
  }

  const selectedDefinition = selectedNode.definition;
  const selectedRuntime = nodeRuntimeById[selectedId];
  const selectedCurrentEffect =
    selectedRuntime.level > 0 ? describeUpgradeEffect(selectedDefinition, selectedRuntime.level, prestige.totalMirrorShards) : "Not active yet";
  const selectedNextEffect =
    selectedDefinition.maxLevel !== undefined && selectedRuntime.level >= selectedDefinition.maxLevel
      ? "Already maxed"
      : describeUpgradeEffect(selectedDefinition, selectedRuntime.level + 1, prestige.totalMirrorShards);

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
            <UpgradeConnectionLayer paths={renderedPaths} />

            <div className="upgrade-tree-grid" style={{ gridTemplateColumns: tree.gridTemplateColumns, gridTemplateRows: tree.gridTemplateRows }}>
              {tree.lanes.map((lane) => (
                <div key={lane.label} className="upgrade-tree-lane-label" style={{ gridColumn: 1, gridRow: lane.order }}>
                  <span className="upgrade-tree-lane-name">{lane.label}</span>
                  <span className="upgrade-tree-lane-copy">{laneCopyByOrder[lane.order] ?? "Late route"}</span>
                </div>
              ))}

              {tree.nodes.map((node) => (
                <UpgradeTreeNodeCard
                  key={node.definition.id}
                  node={node}
                  runtime={nodeRuntimeById[node.definition.id as UpgradeId]}
                  isSelected={node.definition.id === selectedId}
                  onSelect={setSelectedUpgradeId}
                  onKeySelect={handleNodeKeyDown}
                  nodeRefs={nodeRefs}
                />
              ))}
            </div>
          </div>
        </section>

        <aside className="shell-card upgrade-focus-card">
          <div className="upgrade-focus-header">
            <div>
              <p className="shell-card-eyebrow">Selected node</p>
              <h3 className="upgrade-focus-title">{selectedNode.presentation.shortLabel}</h3>
            </div>
            <span className={`upgrade-focus-kind upgrade-focus-kind-${selectedNode.presentation.kind}`}>{getKindLabel(selectedNode.presentation.kind)}</span>
          </div>

          <p className="upgrade-focus-copy">{selectedDefinition.description}</p>

          <div className="upgrade-focus-stats">
            <div className="upgrade-focus-stat">
              <span className="upgrade-focus-stat-label">State</span>
              <span className={`upgrade-focus-stat-value upgrade-focus-stat-value-${selectedRuntime.tone}`}>{getUpgradeNodeStateLabel(selectedRuntime.state)}</span>
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
              <span className="upgrade-focus-stat-value">{selectedRuntime.costLabel}</span>
            </div>
          </div>

          <div className="upgrade-focus-requirements">
            <span className="upgrade-focus-section-label">Unlock condition</span>
            <span className="upgrade-focus-requirement">{getUpgradeNodeRequirementText(availabilityState, selectedId)}</span>
          </div>

          <button className="btn upgrade-focus-buy" type="button" onClick={() => onBuyUpgrade(selectedId)} disabled={!selectedRuntime.canBuy}>
            {selectedRuntime.state === "maxed" ? "Maxed" : selectedRuntime.canBuy ? `Buy for ${selectedRuntime.costLabel}` : `Need ${selectedRuntime.costLabel}`}
          </button>
        </aside>
      </div>
    </div>
  );
}
