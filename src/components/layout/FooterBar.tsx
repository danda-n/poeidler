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

export const FooterBar = memo(function FooterBar() {
  const activeMap = useGameStore((s) => s.activeMap);
  const queuedMap = useGameStore((s) => s.queuedMap);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeMap) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [activeMap]);

  if (!activeMap) return null;

  const mapDef = baseMapMap[activeMap.craftedMap.baseMapId];
  if (!mapDef) return null;

  const progress = getMapProgress(activeMap, now);
  const remaining = getMapTimeRemaining(activeMap, now);
  const activeEncounter = getMapEncounter(activeMap.craftedMap.encounterId);
  const queuedDef = queuedMap ? baseMapMap[queuedMap.baseMapId] : null;
  const queuedEncounter = queuedMap ? getMapEncounter(queuedMap.craftedMap.encounterId) : null;

  return (
    <div className="shrink-0 px-3 py-1.5 border-t border-border-subtle bg-[rgba(8,11,16,0.88)] animate-[slide-up_200ms_ease-out]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[0.72rem] font-semibold text-accent-cyan shrink-0">
            <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>
              {getRarityLabel(activeMap.craftedMap.rarity)}
            </span>{" "}
            {mapDef.name}
            {activeEncounter && (
              <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(255,211,106,0.12)] text-accent-gold text-[0.6rem] font-bold">
                {activeEncounter.name}
              </span>
            )}
          </span>
          <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden min-w-[80px] max-w-[200px]">
            <div
              className="h-full rounded-[inherit] bg-gradient-to-r from-accent-cyan to-accent-green transition-[width] duration-200 linear"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
          <span className="text-[0.72rem] font-bold text-accent-cyan tabular-nums shrink-0">{formatMs(remaining)}</span>
        </div>
        <div className="flex gap-2 text-[0.62rem] text-[#8c8c94] shrink-0">
          <span>Chain {activeMap.encounterChain}</span>
          {queuedDef && (
            <span>
              Next: {queuedDef.name}
              {queuedEncounter ? ` (${queuedEncounter.name})` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
