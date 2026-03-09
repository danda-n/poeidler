import { useEffect, useState } from "react";
import {
  maps,
  isMapUnlocked,
  canAffordMap,
  getMapTimeRemaining,
  getMapProgress,
  type ActiveMapState,
} from "../game/maps";
import { formatCurrencyValue, currencyMap, type CurrencyState } from "../game/currencies";
import { getMapCostReduction, getMapSpeedBonus, type TalentPurchasedState } from "../game/talents";
import type { PrestigeState } from "../game/prestige";

type MapPanelProps = {
  currencies: CurrencyState;
  activeMap: ActiveMapState;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  onStartMap: (mapId: string) => void;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;
}

function MapPanel({ currencies, activeMap, prestige, talentsPurchased, onStartMap }: MapPanelProps) {
  const [now, setNow] = useState(Date.now());
  const costReduction = getMapCostReduction(talentsPurchased);
  const speedBonus = getMapSpeedBonus(talentsPurchased);

  useEffect(() => {
    if (!activeMap) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [activeMap]);

  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <h2 className="map-panel-title">Maps</h2>
        <span className="map-panel-stats">
          Completed: {prestige.mapsCompleted} | Shards: {formatCurrencyValue(prestige.mirrorShards)}
        </span>
      </div>

      {activeMap && (
        <div className="map-active">
          <div className="map-active-info">
            <span className="map-active-label">Running: {maps.find((m) => m.id === activeMap.mapId)?.name}</span>
            <span className="map-active-time">{formatMs(getMapTimeRemaining(activeMap, now))}</span>
          </div>
          <div className="map-progress-track">
            <div
              className="map-progress-fill"
              style={{ width: `${Math.min(100, getMapProgress(activeMap, now) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="map-list">
        {maps.map((mapDef) => {
          const unlocked = isMapUnlocked(mapDef, currencies);
          const affordable = canAffordMap(mapDef, currencies, costReduction);
          const isRunning = activeMap?.mapId === mapDef.id;
          const canStart = unlocked && affordable && !activeMap;

          const adjustedDuration = Math.max(5000, Math.round(mapDef.durationMs * Math.max(0, 1 - speedBonus)));

          return (
            <div key={mapDef.id} className={`map-card${!unlocked ? " map-card-locked" : ""}`}>
              <div className="map-card-header">
                <span className="map-card-name">{unlocked ? mapDef.name : "???"}</span>
                <span className="map-card-family">{mapDef.family}</span>
              </div>
              {unlocked && (
                <>
                  <p className="map-card-desc">{mapDef.description}</p>
                  <div className="map-card-details">
                    <div className="map-card-cost">
                      <span className="map-detail-label">Cost:</span>
                      {Object.entries(mapDef.cost).map(([cid, amount]) => {
                        const reduced = Math.ceil((amount ?? 0) * Math.max(0, 1 - costReduction));
                        const def = currencyMap[cid as keyof typeof currencyMap];
                        return (
                          <span key={cid} className="map-cost-item">
                            {formatCurrencyValue(reduced)} {def?.shortLabel ?? cid}
                          </span>
                        );
                      })}
                    </div>
                    <div className="map-card-rewards">
                      <span className="map-detail-label">Rewards:</span>
                      {Object.entries(mapDef.rewards).map(([cid, amount]) => {
                        const def = currencyMap[cid as keyof typeof currencyMap];
                        return (
                          <span key={cid} className="map-reward-item">
                            {formatCurrencyValue(amount ?? 0)} {def?.shortLabel ?? cid}
                          </span>
                        );
                      })}
                      {mapDef.shardReward > 0 && (
                        <span className="map-reward-item map-reward-shard">+{mapDef.shardReward} Shards</span>
                      )}
                    </div>
                    <span className="map-card-duration">{formatMs(adjustedDuration)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    disabled={!canStart}
                    onClick={() => onStartMap(mapDef.id)}
                  >
                    {isRunning ? "Running..." : activeMap ? "Map Active" : !affordable ? "Can't Afford" : "Run Map"}
                  </button>
                </>
              )}
              {!unlocked && (
                <p className="map-card-lock-hint">
                  Requires {formatCurrencyValue(mapDef.unlockRequirement.amount)}{" "}
                  {currencyMap[mapDef.unlockRequirement.currencyId]?.shortLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MapPanel;
