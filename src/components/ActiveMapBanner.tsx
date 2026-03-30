import { memo, useEffect, useState } from "react";
import {
  baseMapMap,
  getMapEncounter,
  getMapProgress,
  getMapTimeRemaining,
  getRarityColor,
  getRarityLabel,
} from "@/game/maps";
import { useGameStore } from "@/store/useGameStore";

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;
}

type ActiveMapBannerProps = {
  mapsUnlocked: boolean;
};

export const ActiveMapBanner = memo(function ActiveMapBanner({ mapsUnlocked }: ActiveMapBannerProps) {
  const activeMap = useGameStore((s) => s.activeMap);
  const queuedMap = useGameStore((s) => s.queuedMap);
  const lastMapResult = useGameStore((s) => s.lastMapResult);
  const prestige = useGameStore((s) => s.prestige);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeMap) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [activeMap]);

  if (!mapsUnlocked) return null;

  if (!activeMap) {
    return (
      <div className="rounded-lg bg-[rgba(255,211,106,0.04)] border border-[rgba(255,211,106,0.14)] overflow-hidden">
        <div className="px-3 py-2 grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.78rem] font-semibold text-accent-cyan">Atlas idle</span>
            <span className="text-[0.82rem] font-bold text-accent-cyan tabular-nums">{prestige.mapsCompleted} maps cleared</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[0.68rem] text-[#8c8c94]">
            <span>{prestige.encounterMapsCompleted} encounter runs</span>
            <span>{prestige.mirrorShards} live shards</span>
            {lastMapResult && <span>Last haul ~{Math.round(lastMapResult.totalRewardValue)}</span>}
          </div>
        </div>
      </div>
    );
  }

  const mapDef = baseMapMap[activeMap.craftedMap.baseMapId];
  if (!mapDef) return null;

  const progress = getMapProgress(activeMap, now);
  const remaining = getMapTimeRemaining(activeMap, now);
  const activeEncounter = getMapEncounter(activeMap.craftedMap.encounterId);
  const queuedDef = queuedMap ? baseMapMap[queuedMap.baseMapId] : null;
  const queuedEncounter = queuedMap ? getMapEncounter(queuedMap.craftedMap.encounterId) : null;

  return (
    <div className="rounded-lg bg-[rgba(139,233,253,0.05)] border border-[rgba(139,233,253,0.14)] overflow-hidden">
      <div className="px-3 py-2 grid gap-[5px]">
        <div className="flex items-center justify-between">
          <span className="text-[0.78rem] font-semibold text-accent-cyan">
            <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>
              {getRarityLabel(activeMap.craftedMap.rarity)}
            </span>{" "}
            {mapDef.name}
            {activeEncounter && <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(255,211,106,0.12)] text-accent-gold text-[0.64rem] font-bold">{activeEncounter.name}</span>}
          </span>
          <span className="text-[0.82rem] font-bold text-accent-cyan tabular-nums">{formatMs(remaining)}</span>
        </div>
        <div className="h-1 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
          <div className="h-full rounded-[inherit] bg-gradient-to-r from-accent-cyan to-accent-green transition-[width] duration-200 linear" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        <div className="flex flex-wrap gap-2 text-[0.68rem] text-[#8c8c94]">
          <span>Chain {activeMap.encounterChain}</span>
          <span>Wealth floor {Math.round(activeMap.wealthSnapshot)}</span>
          {queuedDef && <span>Next {queuedDef.name}{queuedEncounter ? ` (${queuedEncounter.name})` : ""}</span>}
        </div>
      </div>
    </div>
  );
});
