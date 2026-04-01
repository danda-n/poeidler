import { memo } from "react";
import { formatCurrencyValue, currencyMap, type CurrencyId } from "@/game/currencies";
import type { UpgradeDefinition, UpgradeId } from "@/game/upgradeEngine";
import type { UpgradeNodeKind } from "@/game/upgradeTree";

type UpgradeCardProps = {
  id: UpgradeId;
  definition: UpgradeDefinition;
  level: number;
  kind: UpgradeNodeKind;
  nextEffect: string;
  costLabel: string;
  canBuy: boolean;
  isMaxed: boolean;
  onBuy: (id: UpgradeId) => void;
};

export const UpgradeCard = memo(function UpgradeCard({
  id,
  definition,
  level,
  kind,
  nextEffect,
  costLabel,
  canBuy,
  isMaxed,
  onBuy,
}: UpgradeCardProps) {
  const isKeystone = kind === "keystone" || kind === "unlock";

  return (
    <button
      type="button"
      disabled={!canBuy}
      className={`group flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed ${
        canBuy
          ? "border-[rgba(244,213,140,0.28)] bg-[rgba(244,213,140,0.06)] hover:not-disabled:bg-[rgba(244,213,140,0.12)]"
          : isMaxed
            ? "border-[rgba(88,217,139,0.2)] bg-[rgba(88,217,139,0.04)] opacity-60"
            : isKeystone
              ? "border-[rgba(107,194,255,0.18)] bg-[rgba(107,194,255,0.04)] opacity-50"
              : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] opacity-50"
      }`}
      onClick={() => onBuy(id)}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[0.7rem] font-bold text-text-bright">{definition.name}</span>
        {!isMaxed && (
          <span className="text-[0.56rem] font-semibold text-text-secondary shrink-0">Lv {level}</span>
        )}
      </div>

      <span className="text-[0.62rem] text-accent-gold leading-snug">{isMaxed ? "Maxed" : nextEffect}</span>

      <div className="mt-auto pt-1">
        {isMaxed ? (
          <span className="text-[0.56rem] font-semibold text-[#6ee7a0]">Complete</span>
        ) : (
          <span className={`text-[0.62rem] font-semibold tabular-nums ${canBuy ? "text-accent-gold" : "text-text-secondary"}`}>
            {costLabel}
          </span>
        )}
      </div>
    </button>
  );
});
