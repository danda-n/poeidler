import { memo } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import type { GeneratorId } from "@/game/generators";
import { InfoIcon } from "@/components/InfoIcon";

type CurrencyRowProps = {
  icon: string;
  name: string;
  value: number;
  productionRate: number;
  generatorId?: GeneratorId;
  generatorLabel?: string;
  generatorDisabled?: boolean;
  generatorTooltip?: string;
  onBuyGenerator?: (generatorId: GeneratorId) => void;
};

export const CurrencyRow = memo(function CurrencyRow({
  icon,
  name,
  value,
  productionRate,
  generatorId,
  generatorLabel,
  generatorDisabled = false,
  generatorTooltip,
  onBuyGenerator,
}: CurrencyRowProps) {
  return (
    <div className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-2 min-w-0">
        <img className="w-[22px] h-[22px] rounded-[5px] object-cover shrink-0" src={icon} alt="" aria-hidden="true" />
        <div className="grid gap-0 min-w-0">
          <span className="text-[0.85rem] font-medium text-text-bright whitespace-nowrap overflow-hidden text-ellipsis leading-[1.2]">{name}</span>
          <span className="text-[0.7rem] text-text-secondary m-0 leading-[1.2]">+{formatCurrencyValue(productionRate)}/sec</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[0.95rem] font-bold text-accent-gold min-w-[44px] text-right">{formatCurrencyValue(value)}</span>
        <div className="flex items-center gap-1">
          {generatorLabel && generatorId && onBuyGenerator && (
            <button className="px-2 py-1 border border-[rgba(255,211,106,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-gold bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(255,211,106,0.1)] hover:not-disabled:border-[rgba(255,211,106,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed" type="button" onClick={() => onBuyGenerator(generatorId)} disabled={generatorDisabled}>
              {generatorLabel}
            </button>
          )}
          {generatorTooltip && <InfoIcon tooltip={generatorTooltip} />}
        </div>
      </div>
    </div>
  );
});
