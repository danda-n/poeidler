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
    <div className="currency-row">
      <div className="currency-row-main">
        <img className="currency-icon" src={icon} alt="" aria-hidden="true" />
        <div className="currency-row-copy">
          <span className="currency-row-name">{name}</span>
          <span className="currency-row-rate">+{formatCurrencyValue(productionRate)}/sec</span>
        </div>
      </div>
      <div className="currency-row-side">
        <span className="currency-row-value">{formatCurrencyValue(value)}</span>
        <div className="currency-row-actions">
          {generatorLabel && generatorId && onBuyGenerator && (
            <button className="btn btn-sm" type="button" onClick={() => onBuyGenerator(generatorId)} disabled={generatorDisabled}>
              {generatorLabel}
            </button>
          )}
          {generatorTooltip && <InfoIcon tooltip={generatorTooltip} />}
        </div>
      </div>
    </div>
  );
});
