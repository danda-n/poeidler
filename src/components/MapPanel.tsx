import { useEffect, useState } from "react";
import {
  baseMaps,
  baseMapMap,
  isMapUnlocked,
  canAffordMap,
  canAffordCraft,
  getMapTimeRemaining,
  getMapProgress,
  getResolvedMapCost,
  getResolvedMapDuration,
  getAvailableCraftingActions,
  createNormalMap,
  getRarityLabel,
  getRarityColor,
  getAffixDisplayName,
  getAffixDescription,
  craftingCosts,
  craftingActionLabels,
  craftingActionDescriptions,
  MAP_BALANCE,
  type ActiveMapState,
  type CraftedMap,
  type CraftingAction,
  type MapCompletionResult,
} from "../game/maps";
import { formatCurrencyValue, currencyMap, type CurrencyState } from "../game/currencies";
import { getMapCostReduction, getMapSpeedBonus, type TalentPurchasedState } from "../game/talents";
import type { PrestigeState } from "../game/prestige";

type MapPanelProps = {
  currencies: CurrencyState;
  activeMap: ActiveMapState;
  lastMapResult: MapCompletionResult | null;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  onCraftMap: (craftedMap: CraftedMap, action: CraftingAction) => CraftedMap | null;
  onStartMap: (baseMapId: string, craftedMap: CraftedMap) => void;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatSignedPercent(n: number): string {
  const pct = Math.round(n * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export function MapPanel({
  currencies,
  activeMap,
  lastMapResult,
  prestige,
  talentsPurchased,
  onCraftMap,
  onStartMap,
}: MapPanelProps) {
  const [selectedBaseMapId, setSelectedBaseMapId] = useState<string | null>(null);
  const [craftedMap, setCraftedMap] = useState<CraftedMap | null>(null);
  const [now, setNow] = useState(Date.now());

  const costReduction = getMapCostReduction(talentsPurchased);
  const speedBonus = getMapSpeedBonus(talentsPurchased);

  useEffect(() => {
    if (!activeMap) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [activeMap]);

  function handleSelectBase(baseMapId: string) {
    setSelectedBaseMapId(baseMapId);
    setCraftedMap(createNormalMap(baseMapId));
  }

  function handleCraft(action: CraftingAction) {
    if (!craftedMap) return;
    const result = onCraftMap(craftedMap, action);
    if (result) setCraftedMap(result);
  }

  function handleRun() {
    if (!selectedBaseMapId || !craftedMap) return;
    onStartMap(selectedBaseMapId, craftedMap);
    // Keep selection for easy re-run, reset to normal for next crafting cycle
    setCraftedMap(createNormalMap(selectedBaseMapId));
  }

  const mapDef = selectedBaseMapId ? baseMapMap[selectedBaseMapId] : null;
  const resolvedCost = mapDef && craftedMap ? getResolvedMapCost(mapDef, craftedMap, costReduction) : null;
  const resolvedDuration = mapDef && craftedMap ? getResolvedMapDuration(mapDef, craftedMap, speedBonus) : null;
  const shardChance = mapDef && craftedMap
    ? Math.min(MAP_BALANCE.maxShardChance, mapDef.baseShardChance + craftedMap.resolvedStats.shardChanceBonus)
    : 0;
  const rewardMult = craftedMap ? 1 + craftedMap.resolvedStats.rewardMultiplier : 1;
  const focusedRewardMult = craftedMap ? 1 + craftedMap.resolvedStats.focusedRewardMultiplier : 1;

  const availableActions = craftedMap ? getAvailableCraftingActions(craftedMap) : [];
  const canRun = !activeMap && mapDef && craftedMap
    ? canAffordMap(mapDef, craftedMap, currencies, costReduction)
    : false;

  const activeMapDef = activeMap ? baseMapMap[activeMap.craftedMap.baseMapId] : null;

  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <h2 className="map-panel-title">Maps</h2>
        <span className="map-panel-stats">
          Completed: {prestige.mapsCompleted} | Shards: {formatCurrencyValue(prestige.mirrorShards)}
        </span>
      </div>

      {/* Active map progress */}
      {activeMap && activeMapDef && (
        <div className="map-active">
          <div className="map-active-info">
            <span className="map-active-label">
              <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>
                {getRarityLabel(activeMap.craftedMap.rarity)}
              </span>{" "}
              {activeMapDef.name}
            </span>
            <span className="map-active-time">{formatMs(getMapTimeRemaining(activeMap, now))}</span>
          </div>
          {activeMap.craftedMap.affixIds.length > 0 && (
            <div className="map-active-affixes">
              {activeMap.craftedMap.affixIds.map((id) => (
                <span key={id} className="map-affix-chip">{getAffixDisplayName(id)}</span>
              ))}
            </div>
          )}
          <div className="map-progress-track">
            <div
              className="map-progress-fill"
              style={{ width: `${Math.min(100, getMapProgress(activeMap, now) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Last result */}
      {lastMapResult && !activeMap && (
        <div className="map-result">
          <div className="map-result-header">
            <span className="map-result-title">
              Map Complete
              {lastMapResult.shardDropped && (
                <span className="map-result-shard-badge"> ✦ Mirror Shard!</span>
              )}
            </span>
          </div>
          <div className="map-result-rewards">
            {Object.entries(lastMapResult.rewards).map(([cid, amount]) => {
              const def = currencyMap[cid as keyof typeof currencyMap];
              if (!amount || amount <= 0) return null;
              return (
                <span key={cid} className="map-result-item">
                  +{formatCurrencyValue(amount)} {def?.shortLabel ?? cid}
                </span>
              );
            })}
            {lastMapResult.shardDropped && (
              <span className="map-result-item map-result-shard">+1 Mirror Shard</span>
            )}
          </div>
        </div>
      )}

      {/* Base map selection */}
      <div className="map-base-list">
        {baseMaps.map((def) => {
          const unlocked = isMapUnlocked(def, currencies);
          const isSelected = selectedBaseMapId === def.id;

          return (
            <button
              key={def.id}
              type="button"
              className={`map-base-card${isSelected ? " map-base-card-selected" : ""}${!unlocked ? " map-base-card-locked" : ""}`}
              disabled={!unlocked || !!activeMap}
              onClick={() => handleSelectBase(def.id)}
            >
              <div className="map-base-card-header">
                <span className="map-base-card-name">{unlocked ? def.name : "???"}</span>
                <span className="map-base-card-family">{def.family}</span>
              </div>
              {unlocked && <p className="map-base-card-desc">{def.description}</p>}
              {!unlocked && (
                <p className="map-card-lock-hint">
                  Requires {formatCurrencyValue(def.unlockRequirement.amount)}{" "}
                  {currencyMap[def.unlockRequirement.currencyId]?.shortLabel}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Crafting interface */}
      {mapDef && craftedMap && !activeMap && (
        <div className="map-craft-panel">
          {/* Map rarity header */}
          <div className="map-craft-header">
            <span
              className="map-craft-rarity"
              style={{ color: getRarityColor(craftedMap.rarity) }}
            >
              {getRarityLabel(craftedMap.rarity)} {mapDef.name}
            </span>
          </div>

          {/* Affixes */}
          {craftedMap.affixIds.length > 0 ? (
            <div className="map-affix-list">
              {craftedMap.affixIds.map((id) => (
                <div key={id} className="map-affix-row">
                  <span className="map-affix-name">{getAffixDisplayName(id)}</span>
                  <span className="map-affix-desc">{getAffixDescription(id)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="map-affix-empty">No affixes — transmute or alch to add modifiers.</p>
          )}

          {/* Crafting buttons */}
          <div className="map-craft-actions">
            {(["transmute", "augment", "alter", "regal", "chaos", "alchemy", "exalt"] as CraftingAction[]).map((action) => {
              const isAvailable = availableActions.includes(action);
              const cost = craftingCosts[action];
              const affordable = canAffordCraft(currencies, action);
              const canUse = isAvailable && affordable;
              const costEntries = Object.entries(cost);

              return (
                <button
                  key={action}
                  type="button"
                  className={`btn btn-craft${canUse ? "" : " btn-craft-disabled"}`}
                  disabled={!canUse}
                  onClick={() => handleCraft(action)}
                  title={craftingActionDescriptions[action]}
                >
                  <span className="btn-craft-label">{craftingActionLabels[action]}</span>
                  <span className="btn-craft-cost">
                    {costEntries.map(([cid, amount]) => (
                      <span key={cid}>
                        {amount} {currencyMap[cid as keyof typeof currencyMap]?.shortLabel ?? cid}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stats preview */}
          <div className="map-craft-preview">
            <div className="map-preview-row">
              <span className="map-preview-label">Cost</span>
              <span className="map-preview-value">
                {resolvedCost
                  ? Object.entries(resolvedCost).map(([cid, amount]) => {
                      const def = currencyMap[cid as keyof typeof currencyMap];
                      const hasEnough = Math.floor(currencies[cid as keyof CurrencyState]) >= (amount ?? 0);
                      return (
                        <span
                          key={cid}
                          style={{ color: hasEnough ? undefined : "#e05050", marginRight: 6 }}
                        >
                          {formatCurrencyValue(amount ?? 0)} {def?.shortLabel ?? cid}
                        </span>
                      );
                    })
                  : "—"}
              </span>
            </div>
            <div className="map-preview-row">
              <span className="map-preview-label">Duration</span>
              <span className="map-preview-value">
                {resolvedDuration ? formatMs(resolvedDuration) : "—"}
              </span>
            </div>
            <div className="map-preview-row">
              <span className="map-preview-label">Rewards</span>
              <span className="map-preview-value">
                {formatSignedPercent(rewardMult - 1)} base
                {Object.keys(mapDef.focusedRewards).length > 0 && (
                  <>, {formatSignedPercent(focusedRewardMult - 1)} focused</>
                )}
              </span>
            </div>
            <div className="map-preview-row">
              <span className="map-preview-label">Shard chance</span>
              <span className="map-preview-value" style={{ color: shardChance > 0.02 ? "#c0a0ff" : undefined }}>
                {formatPercent(shardChance)}
              </span>
            </div>
            <div className="map-preview-row map-preview-base-rewards">
              <span className="map-preview-label">Expected</span>
              <span className="map-preview-value">
                {Object.entries(mapDef.rewards).map(([cid, baseAmount]) => {
                  const amt = Math.floor((baseAmount ?? 0) * rewardMult);
                  const def = currencyMap[cid as keyof typeof currencyMap];
                  return (
                    <span key={cid} style={{ marginRight: 6 }}>
                      {formatCurrencyValue(amt)} {def?.shortLabel ?? cid}
                    </span>
                  );
                })}
                {Object.entries(mapDef.focusedRewards).map(([cid, baseAmount]) => {
                  const amt = Math.floor((baseAmount ?? 0) * focusedRewardMult);
                  const def = currencyMap[cid as keyof typeof currencyMap];
                  return (
                    <span key={`f-${cid}`} style={{ marginRight: 6, color: "#a0c8ff" }}>
                      +{formatCurrencyValue(amt)} {def?.shortLabel ?? cid}
                    </span>
                  );
                })}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-full"
            disabled={!canRun}
            onClick={handleRun}
          >
            {!canRun && mapDef && craftedMap && !canAffordMap(mapDef, craftedMap, currencies, costReduction)
              ? "Can't Afford"
              : "Run Map"}
          </button>
        </div>
      )}

      {!selectedBaseMapId && !activeMap && (
        <p className="map-select-hint">Select a map above to craft and run it.</p>
      )}
    </div>
  );
}

export default MapPanel;
