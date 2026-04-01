import { memo } from "react";
import { MapPanel } from "@/components/MapPanel";
import { formatCurrencyValue } from "@/game/currencies";
import { useGameStore } from "@/store/useGameStore";

export const MapsScreen = memo(function MapsScreen() {
  const prestige = useGameStore((s) => s.prestige);

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden animate-[section-enter_350ms_ease-out]">
      <div className="shrink-0 flex items-center gap-4 text-[0.72rem]">
        <span className="text-text-secondary"><span className="font-bold text-text-bright">{prestige.mapsCompleted}</span> maps</span>
        <span className="text-text-secondary"><span className="font-bold text-text-bright">{prestige.encounterMapsCompleted}</span> encounters</span>
        <span className="text-text-secondary"><span className="font-bold text-text-bright">{formatCurrencyValue(prestige.mirrorShards)}</span> shards</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MapPanel />
      </div>
    </div>
  );
});
