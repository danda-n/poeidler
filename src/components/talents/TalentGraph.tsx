import { memo, useMemo } from "react";
import { TalentNode } from "./TalentNode";
import {
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  branchColors,
  branchLabels,
  edgeConnections,
  nodePositions,
} from "./talentLayout";
import {
  canPurchaseTalent,
  getBranchLabel,
  getTalentCost,
  isTalentAvailable,
  talentMap,
  type TalentPurchasedState,
} from "@/game/talents";

type TalentGraphProps = {
  talentsPurchased: TalentPurchasedState;
  mirrorShards: number;
  onPurchaseTalent: (talentId: string) => void;
};

export const TalentGraph = memo(function TalentGraph({
  talentsPurchased,
  mirrorShards,
  onPurchaseTalent,
}: TalentGraphProps) {
  const positionMap = useMemo(
    () => Object.fromEntries(nodePositions.map((n) => [n.talentId, n])),
    [],
  );

  return (
    <svg
      viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
      className="w-full h-full max-h-[480px]"
      style={{ userSelect: "none" }}
    >
      {/* Branch labels */}
      {branchLabels.map(({ branch, x, y }) => (
        <text
          key={branch}
          x={x}
          y={y}
          textAnchor="middle"
          fill={branchColors[branch].active}
          fontSize={11}
          fontWeight={800}
          letterSpacing="0.08em"
          opacity={0.7}
        >
          {getBranchLabel(branch).toUpperCase()}
        </text>
      ))}

      {/* Connection lines */}
      {edgeConnections.map((edge) => {
        const from = positionMap[edge.from];
        const to = positionMap[edge.to];
        if (!from || !to) return null;

        const fromRank = talentsPurchased[edge.from] ?? 0;
        const toRank = talentsPurchased[edge.to] ?? 0;
        const isLit = fromRank > 0;
        const isFullyLit = fromRank > 0 && toRank > 0;
        const branch = from.branch;
        const colors = branchColors[branch];

        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isFullyLit ? colors.active : isLit ? colors.dim : "rgba(255,255,255,0.06)"}
            strokeWidth={isFullyLit ? 2 : 1}
            strokeDasharray={isLit ? undefined : "4 4"}
          />
        );
      })}

      {/* Nodes */}
      {nodePositions.map((pos) => {
        const talent = talentMap[pos.talentId];
        if (!talent) return null;

        const rank = talentsPurchased[talent.id] ?? 0;
        const maxed = rank >= talent.maxRank;
        const available = isTalentAvailable(talent, talentsPurchased);
        const affordable = canPurchaseTalent(talent, talentsPurchased, mirrorShards);
        const cost = getTalentCost(talent, rank);

        return (
          <TalentNode
            key={talent.id}
            talent={talent}
            position={pos}
            rank={rank}
            maxed={maxed}
            available={available}
            affordable={affordable}
            cost={cost}
            onPurchase={onPurchaseTalent}
          />
        );
      })}
    </svg>
  );
});
