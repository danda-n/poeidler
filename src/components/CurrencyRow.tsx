import { formatCurrencyValue } from "../game/currencies";

type CurrencyRowProps = {
  icon: string;
  name: string;
  value: number;
  productionRate: number;
  actionLabel?: string;
  actionMeta?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
};

function CurrencyRow({
  icon,
  name,
  value,
  productionRate,
  actionLabel,
  actionMeta,
  actionDisabled = false,
  onAction,
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
        {actionLabel ? (
          <div className="currency-row-action">
            <button className="btn btn-sm" type="button" onClick={onAction} disabled={actionDisabled}>
              {actionLabel}
            </button>
            {actionMeta ? <span className="currency-row-meta">{actionMeta}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CurrencyRow;
