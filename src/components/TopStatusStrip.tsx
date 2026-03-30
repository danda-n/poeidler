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
    <div className="flex flex-wrap items-center gap-2 min-h-0" role="status" aria-label="Economy status">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-bg-overlay border border-[rgba(255,255,255,0.07)]">
        <span className="text-[0.62rem] font-extrabold tracking-[0.08em] uppercase text-[#8090a6]">Stash</span>
        <span className="text-[0.72rem] font-extrabold text-[#f2ead8]">{formatCurrencyValue(totalWealthValue)}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-bg-overlay border border-[rgba(255,255,255,0.07)]">
        <span className="text-[0.62rem] font-extrabold tracking-[0.08em] uppercase text-[#8090a6]">Rate</span>
        <span className="text-[0.72rem] font-extrabold text-[#f2ead8]">{formatCurrencyValue(totalProductionValue)}/s</span>
      </div>
      <div className="flex flex-1 min-w-0 flex-wrap gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="inline-flex items-center gap-1.5 min-w-0 px-[9px] py-[5px] rounded-full bg-[rgba(255,255,255,0.035)] border border-border-subtle">
            <img className="w-[18px] h-[18px] rounded-full object-cover shrink-0" src={item.icon} alt="" />
            <span className="text-[0.68rem] font-bold text-[#d9e1ef]">{item.label}</span>
            <span className="text-[0.68rem] text-[#93a0b4]">
              {formatCurrencyValue(item.amount)}
              {item.productionRate > 0 ? ` \u00b7 ${formatCurrencyValue(item.productionRate)}/s` : ""}
            </span>
          </div>
        ))}
        {hiddenCount > 0 && <span className="text-[0.68rem] text-[#93a0b4]">+{hiddenCount} more</span>}
      </div>
    </div>
  );
});
