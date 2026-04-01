import { memo } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import type { GeneratorId } from "@/game/generators";

type BuyAmount = 1 | 10 | "max";

type GeneratorCardProps = {
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
};

export const GeneratorCard = memo(function GeneratorCard({
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
}: GeneratorCardProps) {
  const buyLabel = buyAmount === "max" ? "Max" : `x${buyAmount}`;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-border-subtle transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-2">
        <img className="w-5 h-5 rounded-md object-cover shrink-0" src={icon} alt="" />
        <span className="text-[0.78rem] font-bold text-text-bright truncate">{name}</span>
        <span className="ml-auto text-[0.65rem] text-text-secondary tabular-nums">x{generatorCount}</span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-[1rem] font-extrabold text-accent-gold tabular-nums">{formatCurrencyValue(amount)}</span>
        <span className="text-[0.68rem] text-text-secondary tabular-nums">+{formatCurrencyValue(productionRate)}/s</span>
      </div>

      <button
        type="button"
        className="w-full px-2 py-1.5 rounded-lg text-[0.72rem] font-semibold tabular-nums transition-all duration-100 border hover:not-disabled:scale-[1.01] active:not-disabled:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed border-[rgba(255,211,106,0.2)] text-accent-gold bg-[rgba(255,211,106,0.06)] hover:not-disabled:bg-[rgba(255,211,106,0.12)] hover:not-disabled:border-[rgba(255,211,106,0.35)] cursor-pointer"
        disabled={!canAfford}
        onClick={() => onBuy(generatorId)}
      >
        {buyLabel} · {formatCurrencyValue(cost)} {costCurrencyLabel}
      </button>
    </div>
  );
});
