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
        <div className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(139,233,253,0.06)] border border-[rgba(139,233,253,0.15)] grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.82rem] font-semibold text-accent-cyan">
              <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>{getRarityLabel(activeMap.craftedMap.rarity)}</span>{" "}
              {activeMapDef.name}
              {activeEncounter && <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(255,211,106,0.12)] text-accent-gold text-[0.64rem] font-bold">{activeEncounter.name}</span>}
              {activeMap.encounterChain > 0 && <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(139,233,253,0.12)] text-accent-cyan text-[0.64rem] font-bold">Chain {activeMap.encounterChain}</span>}
            </span>
            <span className="text-[0.85rem] font-bold text-accent-cyan tabular-nums">{formatMs(getMapTimeRemaining(activeMap, now))}</span>
          </div>
          {activeMap.craftedMap.affixIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {activeMap.craftedMap.affixIds.map((affixId) => (
                <span key={affixId} className="text-[0.68rem] px-[7px] py-px rounded-full bg-[rgba(192,160,255,0.12)] text-[#c0a0ff] border border-[rgba(192,160,255,0.2)] whitespace-nowrap">{getAffixDisplayName(affixId)}</span>
              ))}
            </div>
          )}
          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
            <div className="h-full rounded-[inherit] bg-gradient-to-r from-accent-cyan to-accent-green transition-[width] duration-100 linear" style={{ width: `${Math.min(100, getMapProgress(activeMap, now) * 100)}%` }} />
          </div>
        </div>
      )}

      {queuedMap && queuedMapDef && (
        <div className="px-3 py-2 rounded-lg bg-[rgba(255,136,68,0.05)] border border-[rgba(255,136,68,0.15)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.78rem] font-medium text-[#ccc]">
              Queued:{" "}
              <span style={{ color: getRarityColor(queuedMap.craftedMap.rarity) }}>{getRarityLabel(queuedMap.craftedMap.rarity)}</span>{" "}
              {queuedMapDef.name}
              {queuedEncounter && <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(255,211,106,0.12)] text-accent-gold text-[0.64rem] font-bold">{queuedEncounter.name}</span>}
              {queuedMap.deviceLoadout.modIds.length > 0 && (
                <span className="text-[0.72rem] text-accent-orange"> + {queuedMap.deviceLoadout.modIds.length} mod{queuedMap.deviceLoadout.modIds.length !== 1 ? "s" : ""}</span>
              )}
            </span>
            <button type="button" className="px-2 py-1 border border-[rgba(238,85,85,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-red bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(238,85,85,0.1)] hover:not-disabled:border-[rgba(238,85,85,0.35)] active:not-disabled:scale-[0.97]" onClick={onCancelQueue}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {lastMapResult && !activeMap && (
        <div className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(80,250,123,0.06)] border border-[rgba(80,250,123,0.18)] grid gap-1.5">
          <div className="flex items-center">
            <span className="text-[0.82rem] font-semibold text-accent-green">
              Last run
              {lastMapResult.encounterName && <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(255,211,106,0.12)] text-accent-gold text-[0.64rem] font-bold">{lastMapResult.encounterName}</span>}
              {lastMapResult.encounterChain > 0 && <span className="ml-1.5 px-1.5 py-px rounded-full bg-[rgba(139,233,253,0.12)] text-accent-cyan text-[0.64rem] font-bold">Chain {lastMapResult.encounterChain}</span>}
              {lastMapResult.shardDropped && <span className="text-accent-purple font-bold"> Shard!</span>}
              {lastMapResult.bonusRewardTriggered && <span className="text-accent-green font-bold"> Bonus!</span>}
            </span>
            <span className="text-[0.7rem] text-text-secondary">~{formatCurrencyValue(lastMapResult.totalRewardValue)} value</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(lastMapResult.rewards).map(([currencyId, amount]) => {
              const definition = currencyMap[currencyId as keyof typeof currencyMap];
              if (!amount || amount <= 0) return null;
              return (
                <span key={currencyId} className="text-[0.75rem] text-accent-green font-medium">
                  +{formatCurrencyValue(amount)} {definition?.shortLabel ?? currencyId}
                </span>
              );
            })}
            {lastMapResult.shardDropped && <span className="text-[0.75rem] font-medium text-accent-purple">+1 Mirror Shard</span>}
          </div>
        </div>
      )}
    </>
  );
});
