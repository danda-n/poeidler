import { memo } from "react";
import { formatMs } from "@/components/maps/mapFormatting";
import { currencyMap, formatCurrencyValue } from "@/game/currencies";
import {
  baseMapMap,
  getAffixDisplayName,
  getMapEncounter,
  getMapProgress,
  getMapTimeRemaining,
  getRarityColor,
  getRarityLabel,
  type ActiveMapState,
  type MapCompletionResult,
  type MapEncounterProgression,
  type QueuedMapSetup,
} from "@/game/maps";

type MapRunStatusProps = {
  activeMap: ActiveMapState;
  queuedMap: QueuedMapSetup | null;
  lastMapResult: MapCompletionResult | null;
  encounterProgression: MapEncounterProgression;
  now: number;
  onCancelQueue: () => void;
};

export const MapRunStatus = memo(function MapRunStatus({ activeMap, queuedMap, lastMapResult, now, onCancelQueue }: MapRunStatusProps) {
  const activeMapDef = activeMap ? baseMapMap[activeMap.craftedMap.baseMapId] : null;
  const activeEncounter = activeMap ? getMapEncounter(activeMap.craftedMap.encounterId) : null;
  const queuedMapDef = queuedMap ? baseMapMap[queuedMap.baseMapId] : null;
  const queuedEncounter = queuedMap ? getMapEncounter(queuedMap.craftedMap.encounterId) : null;

  return (
    <>
      {activeMap && activeMapDef && (
        <div className="map-active">
          <div className="map-active-info">
            <span className="map-active-label">
              <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>{getRarityLabel(activeMap.craftedMap.rarity)}</span>{" "}
              {activeMapDef.name}
              {activeEncounter && <span className="map-encounter-inline">{activeEncounter.name}</span>}
              {activeMap.encounterChain > 0 && <span className="map-chain-inline">Chain {activeMap.encounterChain}</span>}
            </span>
            <span className="map-active-time">{formatMs(getMapTimeRemaining(activeMap, now))}</span>
          </div>
          {activeMap.craftedMap.affixIds.length > 0 && (
            <div className="map-active-affixes">
              {activeMap.craftedMap.affixIds.map((affixId) => (
                <span key={affixId} className="map-affix-chip">{getAffixDisplayName(affixId)}</span>
              ))}
            </div>
          )}
          <div className="map-progress-track">
            <div className="map-progress-fill" style={{ width: `${Math.min(100, getMapProgress(activeMap, now) * 100)}%` }} />
          </div>
        </div>
      )}

      {queuedMap && queuedMapDef && (
        <div className="map-queued">
          <div className="map-queued-info">
            <span className="map-queued-label">
              Queued:{" "}
              <span style={{ color: getRarityColor(queuedMap.craftedMap.rarity) }}>{getRarityLabel(queuedMap.craftedMap.rarity)}</span>{" "}
              {queuedMapDef.name}
              {queuedEncounter && <span className="map-encounter-inline">{queuedEncounter.name}</span>}
              {queuedMap.deviceLoadout.modIds.length > 0 && (
                <span className="map-queued-mods"> + {queuedMap.deviceLoadout.modIds.length} mod{queuedMap.deviceLoadout.modIds.length !== 1 ? "s" : ""}</span>
              )}
            </span>
            <button type="button" className="btn btn-sm btn-danger" onClick={onCancelQueue}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {lastMapResult && !activeMap && (
        <div className="map-result">
          <div className="map-result-header">
            <span className="map-result-title">
              Last run
              {lastMapResult.encounterName && <span className="map-encounter-inline">{lastMapResult.encounterName}</span>}
              {lastMapResult.encounterChain > 0 && <span className="map-chain-inline">Chain {lastMapResult.encounterChain}</span>}
              {lastMapResult.shardDropped && <span className="map-result-shard-badge"> Shard!</span>}
              {lastMapResult.bonusRewardTriggered && <span className="map-result-bonus-badge"> Bonus!</span>}
            </span>
            <span className="map-result-total">~{formatCurrencyValue(lastMapResult.totalRewardValue)} value</span>
          </div>
          <div className="map-result-rewards">
            {Object.entries(lastMapResult.rewards).map(([currencyId, amount]) => {
              const definition = currencyMap[currencyId as keyof typeof currencyMap];
              if (!amount || amount <= 0) return null;
              return (
                <span key={currencyId} className="map-result-item">
                  +{formatCurrencyValue(amount)} {definition?.shortLabel ?? currencyId}
                </span>
              );
            })}
            {lastMapResult.shardDropped && <span className="map-result-item map-result-shard">+1 Mirror Shard</span>}
          </div>
        </div>
      )}
    </>
  );
});
