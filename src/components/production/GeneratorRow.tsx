import { memo } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import type { GeneratorId } from "@/game/generators";

type BuyAmount = 1 | 10 | "max";

type GeneratorRowProps = {
  icon: string;
  name: string;
  amount: number;
  productionRate: number;
  generatorCount: number;
  generatorId: GeneratorId;
  cost: number;
  costCurrencyLabel: string;
  canAfford: boolean;
  buyAmount: BuyAmount;
  onBuy: (generatorId: GeneratorId) => void;
  even: boolean;
  milestoneLevel: number;
  nextMilestone: number | null;
};

const milestoneGlow = [
  "",
  "shadow-[0_0_4px_rgba(244,213,140,0.12)]",
  "shadow-[0_0_6px_rgba(244,213,140,0.22)]",
  "shadow-[0_0_10px_rgba(244,213,140,0.32)]",
  "shadow-[0_0_14px_rgba(244,213,140,0.45)] border-[rgba(244,213,140,0.2)]",
];

export const GeneratorRow = memo(function GeneratorRow({
  icon,
  name,
  amount,
  productionRate,
  generatorCount,
  generatorId,
  cost,
  costCurrencyLabel,
  canAfford,
  buyAmount,
  onBuy,
  even,
  milestoneLevel,
  nextMilestone,
}: GeneratorRowProps) {
  const buyLabel = buyAmount === "max" ? "Max" : `x${buyAmount}`;
  const glow = milestoneGlow[milestoneLevel] ?? "";

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 border border-transparent ${
        even ? "bg-[rgba(255,255,255,0.02)]" : ""
      } hover:bg-[rgba(255,255,255,0.06)] ${glow}`}
    >
      <img className="w-5 h-5 rounded-sm object-cover shrink-0" src={icon} alt="" />

      <span className="text-[0.74rem] font-semibold text-text-bright w-[7rem] truncate">{name}</span>

      <span className="text-[0.62rem] text-text-secondary tabular-nums w-[3.5rem] text-right">
        x{generatorCount}
        {nextMilestone && (
          <span className="text-[0.5rem] text-[#7f8ca3] ml-0.5">→{nextMilestone}</span>
        )}
      </span>

      <span className="text-[0.78rem] font-bold text-accent-gold tabular-nums w-[4.5rem] text-right">
        {formatCurrencyValue(amount)}
      </span>

      <span className="text-[0.62rem] text-text-secondary tabular-nums w-[4rem] text-right">
        +{formatCurrencyValue(productionRate)}/s
      </span>

      <button
        type="button"
        className="ml-auto shrink-0 px-3 py-1 rounded-md text-[0.66rem] font-semibold tabular-nums transition-colors duration-100 border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border-[rgba(255,211,106,0.18)] text-accent-gold bg-[rgba(255,211,106,0.05)] hover:not-disabled:bg-[rgba(255,211,106,0.12)] hover:not-disabled:border-[rgba(255,211,106,0.35)]"
        disabled={!canAfford}
        onClick={() => onBuy(generatorId)}
        title={`${buyLabel} · ${formatCurrencyValue(cost)} ${costCurrencyLabel}`}
      >
        {buyLabel} · {formatCurrencyValue(cost)} {costCurrencyLabel}
      </button>
    </div>
  );
});
