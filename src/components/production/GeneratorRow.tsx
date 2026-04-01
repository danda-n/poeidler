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
};

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
}: GeneratorRowProps) {
  const buyLabel = buyAmount === "max" ? "Max" : `x${buyAmount}`;

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-100 ${
        even ? "bg-[rgba(255,255,255,0.02)]" : ""
      } hover:bg-[rgba(255,255,255,0.06)]`}
    >
      <img className="w-5 h-5 rounded-sm object-cover shrink-0" src={icon} alt="" />

      <span className="text-[0.74rem] font-semibold text-text-bright w-[7rem] truncate">{name}</span>

      <span className="text-[0.62rem] text-text-secondary tabular-nums w-[2.5rem] text-right">x{generatorCount}</span>

      <span className="text-[0.78rem] font-bold text-accent-gold tabular-nums w-[4.5rem] text-right">
        {formatCurrencyValue(amount)}
      </span>

      <span className="text-[0.62rem] text-text-secondary tabular-nums w-[4rem] text-right">
        +{formatCurrencyValue(productionRate)}/s
      </span>

      <button
        type="button"
        className="ml-auto relative px-3 py-1 rounded-md text-[0.66rem] font-semibold tabular-nums transition-all duration-100 border cursor-pointer hover:not-disabled:scale-[1.02] active:not-disabled:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed border-[rgba(255,211,106,0.18)] text-accent-gold bg-[rgba(255,211,106,0.05)] hover:not-disabled:bg-[rgba(255,211,106,0.12)] hover:not-disabled:border-[rgba(255,211,106,0.35)]"
        disabled={!canAfford}
        onClick={() => onBuy(generatorId)}
        title={`${buyLabel} · ${formatCurrencyValue(cost)} ${costCurrencyLabel}`}
      >
        <span>{buyLabel}</span>
        <span className="hidden group-hover:inline ml-1 text-[0.58rem] opacity-70">
          {formatCurrencyValue(cost)} {costCurrencyLabel}
        </span>
      </button>
    </div>
  );
});
