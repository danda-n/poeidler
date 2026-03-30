import { memo } from "react";
import { currencyMap, formatCurrencyValue } from "@/game/currencies";
import { useGameStore } from "@/store/useGameStore";

export const MapToast = memo(function MapToast() {
  const notification = useGameStore((s) => s.mapNotification);
  if (!notification) return null;

  const { result, mapName } = notification;

  return (
    <div className="fixed bottom-5 right-5 min-w-[200px] max-w-[320px] px-3.5 py-2.5 rounded-[10px] bg-[#1a1e2a] border border-[rgba(80,250,123,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] grid gap-1.5 z-[200] pointer-events-none animate-[toast-in_250ms_ease-out]">
      <div className="flex items-center gap-1">
        <span className="text-[0.78rem] font-bold text-accent-green">
          {mapName} complete
          {result.encounterName && <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(255,211,106,0.12)] text-accent-gold text-[0.64rem] font-bold">{result.encounterName}</span>}
          {result.shardDropped && <span className="text-accent-purple font-bold"> Shard!</span>}
          {result.bonusRewardTriggered && <span className="text-accent-gold font-bold"> Bonus!</span>}
        </span>
      </div>
      <div className="text-[0.7rem] text-text-secondary">~{formatCurrencyValue(result.totalRewardValue)} reward value</div>
      <div className="flex flex-wrap gap-[5px]">
        {Object.entries(result.rewards).map(([cid, amount]) => {
          const def = currencyMap[cid as keyof typeof currencyMap];
          if (!amount || amount <= 0) return null;
          return (
            <span key={cid} className="text-[0.72rem] text-accent-green font-medium">
              +{formatCurrencyValue(amount)} {def?.shortLabel ?? cid}
            </span>
          );
        })}
        {result.shardDropped && <span className="text-[0.72rem] font-medium text-accent-purple">+1 Mirror Shard</span>}
      </div>
    </div>
  );
});
