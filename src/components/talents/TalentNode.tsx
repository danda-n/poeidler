import { memo, useState } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import type { TalentDefinition } from "@/game/talents";
import { branchColors, NODE_HEIGHT, NODE_WIDTH, type NodePosition } from "./talentLayout";

type TalentNodeProps = {
  talent: TalentDefinition;
  position: NodePosition;
  rank: number;
  maxed: boolean;
  available: boolean;
  affordable: boolean;
  cost: number;
  onPurchase: (talentId: string) => void;
};

export const TalentNode = memo(function TalentNode({
  talent,
  position,
  rank,
  maxed,
  available,
  affordable,
  cost,
  onPurchase,
}: TalentNodeProps) {
  const [hovered, setHovered] = useState(false);
  const colors = branchColors[position.branch];

  const isActive = rank > 0;
  const canBuy = available && affordable && !maxed;

  const borderColor = maxed
    ? "rgba(80,250,123,0.5)"
    : isActive
      ? colors.active
      : canBuy
        ? colors.dim
        : "rgba(255,255,255,0.08)";

  const bgColor = maxed
    ? "rgba(80,250,123,0.08)"
    : isActive
      ? `${colors.glow.replace("0.4", "0.1")}`
      : "rgba(255,255,255,0.025)";

  const opacity = !available && !maxed && rank === 0 ? 0.3 : 1;

  return (
    <g
      transform={`translate(${position.x - NODE_WIDTH / 2}, ${position.y - NODE_HEIGHT / 2})`}
      style={{ cursor: canBuy ? "pointer" : "default", opacity }}
      onClick={() => canBuy && onPurchase(talent.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Node background */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={10}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isActive || maxed ? 2 : 1}
      />

      {/* Glow for active */}
      {isActive && !maxed && (
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={10}
          fill="none"
          stroke={colors.glow}
          strokeWidth={1}
          style={{ filter: "blur(4px)" }}
        />
      )}

      {/* Full name */}
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 - 5}
        textAnchor="middle"
        fill="#e0e0e0"
        fontSize={10}
        fontWeight={600}
      >
        {talent.name}
      </text>

      {/* Rank badge */}
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 + 10}
        textAnchor="middle"
        fill={maxed ? "#50fa7b" : isActive ? colors.active : "#7f8ca3"}
        fontSize={11}
        fontWeight={800}
      >
        {rank}/{talent.maxRank}
      </text>

      {/* Hover tooltip */}
      {hovered && (
        <foreignObject
          x={-20}
          y={NODE_HEIGHT + 8}
          width={NODE_WIDTH + 40}
          height={90}
        >
          <div
            style={{
              background: "rgba(14,18,24,0.96)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 11,
              color: "#c0c8d8",
              lineHeight: 1.45,
              pointerEvents: "none",
              whiteSpace: "normal",
            }}
          >
            <div style={{ fontWeight: 700, color: "#f7f3e8", marginBottom: 3 }}>{talent.name}</div>
            <div>{talent.description}</div>
            {!maxed && <div style={{ color: colors.active, marginTop: 3, fontWeight: 600 }}>{formatCurrencyValue(cost)} Shards</div>}
          </div>
        </foreignObject>
      )}
    </g>
  );
});
