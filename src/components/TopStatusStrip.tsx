import { memo } from "react";
import { formatCurrencyValue } from "@/game/currencies";

type TopStatusStripItem = {
  id: string;
  label: string;
  icon: string;
  amount: number;
  productionRate: number;
};

type TopStatusStripProps = {
  items: TopStatusStripItem[];
  totalWealthValue: number;
  totalProductionValue: number;
  hiddenCount: number;
};

export const TopStatusStrip = memo(function TopStatusStrip({
  items,
  totalWealthValue,
  totalProductionValue,
  hiddenCount,
}: TopStatusStripProps) {
  return (
    <div className="status-strip" role="status" aria-label="Economy status">
      <div className="status-strip-summary">
        <span className="status-strip-kicker">Stash</span>
        <span className="status-strip-value">{formatCurrencyValue(totalWealthValue)}</span>
      </div>
      <div className="status-strip-summary">
        <span className="status-strip-kicker">Rate</span>
        <span className="status-strip-value">{formatCurrencyValue(totalProductionValue)}/s</span>
      </div>
      <div className="status-strip-items">
        {items.map((item) => (
          <div key={item.id} className="status-strip-chip">
            <img className="status-strip-chip-icon" src={item.icon} alt="" />
            <span className="status-strip-chip-label">{item.label}</span>
            <span className="status-strip-chip-value">
              {formatCurrencyValue(item.amount)}
              {item.productionRate > 0 ? ` · ${formatCurrencyValue(item.productionRate)}/s` : ""}
            </span>
          </div>
        ))}
        {hiddenCount > 0 && <span className="status-strip-overflow">+{hiddenCount} more</span>}
      </div>
    </div>
  );
});
