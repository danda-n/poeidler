import { memo, useState } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import type { TalentDefinition } from "@/game/talents";
import { branchColors, type NodePosition } from "./talentLayout";

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

const NODE_SIZE = 56;

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
      transform={`translate(${position.x - NODE_SIZE / 2}, ${position.y - NODE_SIZE / 2})`}
      style={{ cursor: canBuy ? "pointer" : "default", opacity }}
      onClick={() => canBuy && onPurchase(talent.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Node background */}
      <rect
        width={NODE_SIZE}
        height={NODE_SIZE}
        rx={12}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isActive || maxed ? 2 : 1}
      />

      {/* Glow for active */}
      {isActive && !maxed && (
        <rect
          width={NODE_SIZE}
          height={NODE_SIZE}
          rx={12}
          fill="none"
          stroke={colors.glow}
          strokeWidth={1}
          style={{ filter: "blur(4px)" }}
        />
      )}

      {/* Short name */}
      <text
        x={NODE_SIZE / 2}
        y={NODE_SIZE / 2 - 6}
        textAnchor="middle"
        fill="#e0e0e0"
        fontSize={9}
        fontWeight={700}
      >
        {talent.name.length > 12 ? talent.name.slice(0, 11) + "…" : talent.name}
      </text>

      {/* Rank badge */}
      <text
        x={NODE_SIZE / 2}
        y={NODE_SIZE / 2 + 10}
        textAnchor="middle"
        fill={maxed ? "#50fa7b" : isActive ? colors.active : "#7f8ca3"}
        fontSize={10}
        fontWeight={800}
      >
        {rank}/{talent.maxRank}
      </text>

      {/* Hover tooltip */}
      {hovered && (
        <foreignObject x={-40} y={NODE_SIZE + 6} width={NODE_SIZE + 80} height={80}>
          <div
            style={{
              background: "rgba(14,18,24,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "6px 8px",
              fontSize: "0.6rem",
              color: "#c0c8d8",
              lineHeight: 1.4,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: 700, color: "#f7f3e8", marginBottom: 2 }}>{talent.name}</div>
            <div>{talent.description}</div>
            {!maxed && <div style={{ color: colors.active, marginTop: 2 }}>{formatCurrencyValue(cost)} Shards</div>}
          </div>
        </foreignObject>
      )}
    </g>
  );
});
