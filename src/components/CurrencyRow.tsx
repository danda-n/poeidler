import { formatCurrencyValue } from "../game/currencies";
import InfoIcon from "./InfoIcon";

type CurrencyRowProps = {
  icon: string;
  name: string;
  value: number;
  productionRate: number;
  generatorLabel?: string;
  generatorDisabled?: boolean;
  generatorTooltip?: string;
  onBuyGenerator?: () => void;
  upgradeLabel?: string;
  upgradeDisabled?: boolean;
  upgradeTooltip?: string;
  onBuyUpgrade?: () => void;
};

function CurrencyRow({
  icon,
  name,
  value,
  productionRate,
  generatorLabel,
  generatorDisabled = false,
  generatorTooltip,
  onBuyGenerator,
  upgradeLabel,
  upgradeDisabled = false,
  upgradeTooltip,
  onBuyUpgrade,
}: CurrencyRowProps) {
  const tooltipParts: string[] = [];
  if (generatorTooltip) tooltipParts.push(generatorTooltip);
  if (upgradeTooltip) tooltipParts.push(upgradeTooltip);
  const combinedTooltip = tooltipParts.join("\n\n");

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
          {generatorLabel && (
            <button className="btn btn-sm" type="button" onClick={onBuyGenerator} disabled={generatorDisabled}>
              {generatorLabel}
            </button>
          )}
          {upgradeLabel && (
            <button className="btn btn-sm btn-upgrade" type="button" onClick={onBuyUpgrade} disabled={upgradeDisabled}>
              {upgradeLabel}
            </button>
          )}
          {combinedTooltip && <InfoIcon tooltip={combinedTooltip} />}
        </div>
      </div>
    </div>
  );
}

export default CurrencyRow;
