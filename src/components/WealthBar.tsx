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
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2.5">
        <div className="min-w-[180px] grid gap-0.5 px-3 py-2.5 rounded-[14px] bg-gradient-to-b from-[rgba(244,213,140,0.12)] to-bg-overlay border border-[rgba(244,213,140,0.18)]">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#93a0b4]">Stash value</span>
          <span className="text-[1.02rem] font-extrabold text-[#f7f3e8]">{formatCurrencyValue(totalWealthValue)}</span>
        </div>
        <div className="min-w-[180px] grid gap-0.5 px-3 py-2.5 rounded-[14px] bg-gradient-to-b from-[rgba(244,213,140,0.12)] to-bg-overlay border border-[rgba(244,213,140,0.18)]">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#93a0b4]">Value per second</span>
          <span className="text-[1.02rem] font-extrabold text-[#f7f3e8]">{formatCurrencyValue(totalProductionValue)}/s</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item.id} className="min-w-[160px] flex items-center gap-2.5 px-[11px] py-[9px] rounded-[14px] bg-bg-overlay border border-[rgba(255,255,255,0.08)]">
            <img className="w-7 h-7 rounded-lg object-cover shrink-0" src={item.icon} alt="" />
            <div className="min-w-0 grid gap-px">
              <span className="text-[0.72rem] font-bold text-[#d9e1ef]">{item.label}</span>
              <span className="text-[0.72rem] text-[#9fadbf]">
                {formatCurrencyValue(item.amount)}
                {item.productionRate > 0 ? ` (${formatCurrencyValue(item.productionRate)}/s)` : ""}
              </span>
            </div>
          </div>
        ))}
        {hiddenCount > 0 && <div className="min-w-[160px] flex items-center justify-center gap-2.5 px-[11px] py-[9px] rounded-[14px] bg-bg-overlay border border-[rgba(255,255,255,0.08)] text-[#9fadbf] font-bold">+{hiddenCount} more unlocked</div>}
      </div>
    </div>
  );
}
