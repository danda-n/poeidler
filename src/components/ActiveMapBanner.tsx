import { memo, useEffect, useState } from "react";
import {
  baseMapMap,
  getMapEncounter,
  getMapProgress,
  getMapTimeRemaining,
  getRarityColor,
  getRarityLabel,
  type ActiveMapState,
  type MapCompletionResult,
  type QueuedMapSetup,
} from "@/game/maps";
import type { PrestigeState } from "@/game/prestige";

type ActiveMapBannerProps = {
  activeMap: ActiveMapState;
  queuedMap: QueuedMapSetup | null;
  lastMapResult: MapCompletionResult | null;
  prestige: PrestigeState;
  mapsUnlocked: boolean;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;
}

export const ActiveMapBanner = memo(function ActiveMapBanner({ activeMap, queuedMap, lastMapResult, prestige, mapsUnlocked }: ActiveMapBannerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeMap) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [activeMap]);

  if (!mapsUnlocked) return null;

  if (!activeMap) {
    return (
      <div className="active-map-banner active-map-banner-idle">
        <div className="active-map-banner-inner active-map-banner-inner-idle">
          <div className="active-map-banner-info">
            <span className="active-map-banner-label">Atlas idle</span>
            <span className="active-map-banner-time">{prestige.mapsCompleted} maps cleared</span>
          </div>
          <div className="active-map-banner-summary-row">
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
    <div className="active-map-banner">
      <div className="active-map-banner-inner">
        <div className="active-map-banner-info">
          <span className="active-map-banner-label">
            <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>
              {getRarityLabel(activeMap.craftedMap.rarity)}
            </span>{" "}
            {mapDef.name}
            {activeEncounter && <span className="active-map-banner-encounter">{activeEncounter.name}</span>}
          </span>
          <span className="active-map-banner-time">{formatMs(remaining)}</span>
        </div>
        <div className="active-map-banner-track">
          <div className="active-map-banner-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        <div className="active-map-banner-summary-row">
          <span>Chain {activeMap.encounterChain}</span>
          <span>Wealth floor {Math.round(activeMap.wealthSnapshot)}</span>
          {queuedDef && <span>Next {queuedDef.name}{queuedEncounter ? ` (${queuedEncounter.name})` : ""}</span>}
        </div>
      </div>
    </div>
  );
});
