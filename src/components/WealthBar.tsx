import { formatCurrencyValue } from "../game/currencies";

type WealthBarItem = {
  id: string;
  label: string;
  icon: string;
  amount: number;
  productionRate: number;
};

type WealthBarProps = {
  items: WealthBarItem[];
  totalWealthValue: number;
  totalProductionValue: number;
  hiddenCount: number;
};

export function WealthBar({ items, totalWealthValue, totalProductionValue, hiddenCount }: WealthBarProps) {
  return (
    <div className="wealth-bar">
      <div className="wealth-bar-summary">
        <div className="wealth-bar-summary-block">
          <span className="wealth-bar-summary-label">Stash value</span>
          <span className="wealth-bar-summary-value">{formatCurrencyValue(totalWealthValue)}</span>
        </div>
        <div className="wealth-bar-summary-block">
          <span className="wealth-bar-summary-label">Value per second</span>
          <span className="wealth-bar-summary-value">{formatCurrencyValue(totalProductionValue)}/s</span>
        </div>
      </div>

      <div className="wealth-bar-items">
        {items.map((item) => (
          <div key={item.id} className="wealth-chip">
            <img className="wealth-chip-icon" src={item.icon} alt="" />
            <div className="wealth-chip-copy">
              <span className="wealth-chip-label">{item.label}</span>
              <span className="wealth-chip-value">
                {formatCurrencyValue(item.amount)}
                {item.productionRate > 0 ? ` (${formatCurrencyValue(item.productionRate)}/s)` : ""}
              </span>
            </div>
          </div>
        ))}
        {hiddenCount > 0 && <div className="wealth-chip wealth-chip-overflow">+{hiddenCount} more unlocked</div>}
      </div>
    </div>
  );
}
