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
import {
  resolveDeviceEffects,
  canAffordDeviceAction,
  getAvailableDeviceActions,
  deviceActionCosts,
  deviceActionLabels,
  deviceActionDescriptions,
  deviceModMap,
  getModTierColor,
  getModTierLabel,
  formatQuality,
  type MapDeviceState,
  type DeviceAction,
} from "../game/mapDevice";
import { formatCurrencyValue, currencyMap, type CurrencyState } from "../game/currencies";
import { getMapCostReduction, getMapSpeedBonus, type TalentPurchasedState } from "../game/talents";
import type { PrestigeState } from "../game/prestige";

type MapPanelProps = {
  currencies: CurrencyState;
  activeMap: ActiveMapState;
  lastMapResult: MapCompletionResult | null;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  mapDevice: MapDeviceState;
  onCraftMap: (craftedMap: CraftedMap, action: CraftingAction) => CraftedMap | null;
  onStartMap: (baseMapId: string, craftedMap: CraftedMap) => void;
  onDeviceAction: (action: DeviceAction) => void;
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
  mapDevice,
  onCraftMap,
  onStartMap,
  onDeviceAction,
}: MapPanelProps) {
  const [selectedBaseMapId, setSelectedBaseMapId] = useState<string | null>(null);
  const [craftedMap, setCraftedMap] = useState<CraftedMap | null>(null);
  const [now, setNow] = useState(Date.now());

  const costReduction = getMapCostReduction(talentsPurchased);
  const speedBonus = getMapSpeedBonus(talentsPurchased);
  const deviceEffects = resolveDeviceEffects(mapDevice);

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
    setCraftedMap(createNormalMap(selectedBaseMapId));
  }

  const mapDef = selectedBaseMapId ? baseMapMap[selectedBaseMapId] : null;
  const resolvedCost = mapDef && craftedMap ? getResolvedMapCost(mapDef, craftedMap, costReduction, deviceEffects) : null;
  const resolvedDuration = mapDef && craftedMap ? getResolvedMapDuration(mapDef, craftedMap, speedBonus, deviceEffects) : null;
  const shardChance = mapDef && craftedMap
    ? Math.min(MAP_BALANCE.maxShardChance, mapDef.baseShardChance + craftedMap.resolvedStats.shardChanceBonus + deviceEffects.shardChanceBonus)
    : 0;
  const rewardMult = craftedMap ? 1 + craftedMap.resolvedStats.rewardMultiplier + deviceEffects.rewardMultiplier : 1;
  const focusedRewardMult = craftedMap ? 1 + craftedMap.resolvedStats.focusedRewardMultiplier + deviceEffects.focusedRewardMultiplier : 1;

  const availableActions = craftedMap ? getAvailableCraftingActions(craftedMap) : [];
  const canRun = !activeMap && mapDef && craftedMap
    ? canAffordMap(mapDef, craftedMap, currencies, costReduction, deviceEffects)
    : false;

  const activeMapDef = activeMap ? baseMapMap[activeMap.craftedMap.baseMapId] : null;
  const availableDeviceActions = getAvailableDeviceActions(mapDevice);

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
                <span className="map-result-shard-badge"> Mirror Shard!</span>
              )}
              {lastMapResult.bonusRewardTriggered && (
                <span className="map-result-bonus-badge"> Bonus!</span>
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

      {/* Map Device */}
      <div className="device-panel">
        <div className="device-header">
          <span className="device-title">Map Device</span>
          <span className="device-meta">
            {mapDevice.sockets} socket{mapDevice.sockets !== 1 ? "s" : ""}{mapDevice.links > 0 ? ` / ${mapDevice.links} link${mapDevice.links !== 1 ? "s" : ""}` : ""}
          </span>
        </div>

        <div className="device-slots">
          {Array.from({ length: 3 }).map((_, i) => {
            const isActive = i < mapDevice.sockets;
            const mod = mapDevice.modifiers[i];
            const def = mod ? deviceModMap[mod.modId] : null;
            const isLinkedLeft = i > 0 && mapDevice.links >= i;
            const isLinkedRight = i < mapDevice.sockets - 1 && mapDevice.links >= i + 1;

            return (
              <div key={i} className={`device-slot${isActive ? "" : " device-slot-inactive"}${isLinkedLeft ? " device-slot-linked-left" : ""}${isLinkedRight ? " device-slot-linked-right" : ""}`}>
                {isActive && def ? (
                  <>
                    <span className="device-mod-name" style={{ color: getModTierColor(def.tier) }}>
                      {def.name}
                    </span>
                    <span className="device-mod-tier">{getModTierLabel(def.tier)}</span>
                    <span className="device-mod-quality">Q: {formatQuality(mod!.quality)}</span>
                    <span className="device-mod-desc">{def.description}</span>
                  </>
                ) : isActive ? (
                  <span className="device-slot-empty">Empty</span>
                ) : (
                  <span className="device-slot-locked">Locked</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Device resolved effects summary */}
        {(deviceEffects.rewardMultiplier !== 0 || deviceEffects.durationMultiplier !== 0 || deviceEffects.shardChanceBonus !== 0 || deviceEffects.craftRefundChance !== 0 || deviceEffects.bonusRewardChance !== 0) && (
          <div className="device-effects">
            {deviceEffects.rewardMultiplier !== 0 && <span>{formatSignedPercent(deviceEffects.rewardMultiplier)} rewards</span>}
            {deviceEffects.focusedRewardMultiplier !== 0 && <span>{formatSignedPercent(deviceEffects.focusedRewardMultiplier)} focused</span>}
            {deviceEffects.durationMultiplier !== 0 && <span>{formatSignedPercent(deviceEffects.durationMultiplier)} duration</span>}
            {deviceEffects.costMultiplier !== 0 && <span>{formatSignedPercent(deviceEffects.costMultiplier)} cost</span>}
            {deviceEffects.shardChanceBonus !== 0 && <span>{formatPercent(deviceEffects.shardChanceBonus)} shard</span>}
            {deviceEffects.craftRefundChance > 0 && <span>{formatPercent(deviceEffects.craftRefundChance)} refund</span>}
            {deviceEffects.bonusRewardChance > 0 && <span>{formatPercent(deviceEffects.bonusRewardChance)} bonus</span>}
          </div>
        )}

        {/* Device action buttons */}
        <div className="device-actions">
          {(["jeweller", "fusing", "chaos", "alchemy", "regal", "exalt", "divine"] as DeviceAction[]).map((action) => {
            const isAvailable = availableDeviceActions.includes(action);
            const affordable = canAffordDeviceAction(currencies, action);
            const canUse = isAvailable && affordable;
            const cost = deviceActionCosts[action];

            return (
              <button
                key={action}
                type="button"
                className={`btn btn-device${canUse ? "" : " btn-device-disabled"}`}
                disabled={!canUse}
                onClick={() => onDeviceAction(action)}
                title={deviceActionDescriptions[action]}
              >
                <span className="btn-device-label">{deviceActionLabels[action]}</span>
                <span className="btn-device-cost">
                  {Object.entries(cost).map(([cid, amount]) => (
                    <span key={cid}>
                      {amount} {currencyMap[cid as keyof typeof currencyMap]?.shortLabel ?? cid}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
          <div className="map-craft-header">
            <span
              className="map-craft-rarity"
              style={{ color: getRarityColor(craftedMap.rarity) }}
            >
              {getRarityLabel(craftedMap.rarity)} {mapDef.name}
            </span>
          </div>

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
                  : "\u2014"}
              </span>
            </div>
            <div className="map-preview-row">
              <span className="map-preview-label">Duration</span>
              <span className="map-preview-value">
                {resolvedDuration ? formatMs(resolvedDuration) : "\u2014"}
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
            {!canRun && mapDef && craftedMap && !canAffordMap(mapDef, craftedMap, currencies, costReduction, deviceEffects)
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
