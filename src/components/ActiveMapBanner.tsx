import { useEffect, useState } from "react";
import {
  baseMapMap,
  getRarityColor,
  getRarityLabel,
  getMapProgress,
  getMapTimeRemaining,
  type ActiveMapState,
  type QueuedMapSetup,
} from "../game/maps";

type ActiveMapBannerProps = {
  activeMap: ActiveMapState;
  queuedMap: QueuedMapSetup | null;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;
}

export function ActiveMapBanner({ activeMap, queuedMap }: ActiveMapBannerProps) {
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
  const queuedDef = queuedMap ? baseMapMap[queuedMap.baseMapId] : null;

  return (
    <div className="active-map-banner">
      <div className="active-map-banner-inner">
        <div className="active-map-banner-info">
          <span className="active-map-banner-label">
            <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>
              {getRarityLabel(activeMap.craftedMap.rarity)}
            </span>{" "}
            {mapDef.name}
          </span>
          <span className="active-map-banner-time">{formatMs(remaining)}</span>
        </div>
        <div className="active-map-banner-track">
          <div
            className="active-map-banner-fill"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        {queuedDef && (
          <div className="active-map-banner-queue">
            Next → {queuedDef.name}
          </div>
        )}
      </div>
    </div>
  );
}
