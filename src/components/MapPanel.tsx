import { useEffect, useState } from "react";
import { getRunStartMapBonuses } from "../game/gameEngine";
import {
  baseMaps,
  baseMapMap,
  mapEncounters,
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
  getMapRewardPreview,
  getMapIncomeSnapshot,
  getMapEncounter,
  getMapEncounterUnlockText,
  isMapEncounterUnlocked,
  hasMapEncounter,
  type ActiveMapState,
  type CraftedMap,
  type CraftingAction,
  type MapCompletionResult,
  type QueuedMapSetup,
} from "../game/maps";
import {
  resolveLoadoutEffects,
  canAddModToLoadout,
  addModToLoadout,
  removeModFromLoadout,
  getLoadoutTotalCost,
  canAffordLoadout,
  deviceModPool,
  deviceModMap,
  getModTierColor,
  getModTierLabel,
  LOADOUT_MAX_SLOTS,
  type DeviceLoadout,
} from "../game/mapDevice";
import { formatCurrencyValue, currencyMap, type CurrencyProduction, type CurrencyState } from "../game/currencies";
import { getMapCostReduction, type TalentPurchasedState } from "../game/talents";
import { augmentDeviceEffectsForUpgrades, type PurchasedUpgradeState } from "../game/upgradeEngine";
import type { PrestigeState } from "../game/prestige";

type MapPanelProps = {
  currencies: CurrencyState;
  currencyProduction: CurrencyProduction;
  activeMap: ActiveMapState;
  lastMapResult: MapCompletionResult | null;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  purchasedUpgrades: PurchasedUpgradeState;
  queuedMap: QueuedMapSetup | null;
  onCraftMap: (craftedMap: CraftedMap, action: CraftingAction) => CraftedMap | null;
  onStartMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => void;
  onQueueMap: (baseMapId: string, craftedMap: CraftedMap, deviceLoadout: DeviceLoadout) => void;
  onCancelQueue: () => void;
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
  currencyProduction,
  activeMap,
  lastMapResult,
  prestige,
  talentsPurchased,
  purchasedUpgrades,
  queuedMap,
  onCraftMap,
  onStartMap,
  onQueueMap,
  onCancelQueue,
}: MapPanelProps) {
  const [selectedBaseMapId, setSelectedBaseMapId] = useState<string | null>(null);
  const [craftedMap, setCraftedMap] = useState<CraftedMap | null>(null);
  const [preparingLoadout, setPreparingLoadout] = useState<DeviceLoadout>({ modIds: [] });
  const [now, setNow] = useState(Date.now());

  const deviceEffects = augmentDeviceEffectsForUpgrades(resolveLoadoutEffects(preparingLoadout), purchasedUpgrades, !!activeMap && !queuedMap);
  const costReduction = getMapCostReduction(talentsPurchased);
  const encounterProgression = {
    mapsCompleted: prestige.mapsCompleted,
    totalMirrorShards: prestige.totalMirrorShards,
    prestigeCount: prestige.prestigeCount,
  };

  useEffect(() => {
    if (!activeMap) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [activeMap]);

  function handleSelectBase(baseMapId: string) {
    setSelectedBaseMapId(baseMapId);
    setCraftedMap(createNormalMap(baseMapId));
    setPreparingLoadout({ modIds: [] });
  }

  function handleSelectEncounter(encounterId: CraftedMap["encounterId"]) {
    setCraftedMap((current) => (current ? { ...current, encounterId } : current));
  }

  function handleCraft(action: CraftingAction) {
    if (!craftedMap) return;
    const result = onCraftMap(craftedMap, action);
    if (result) setCraftedMap(result);
  }

  function handleAddMod(modId: string) {
    setPreparingLoadout((l) => addModToLoadout(l, modId));
  }

  function handleRemoveMod(modId: string) {
    setPreparingLoadout((l) => removeModFromLoadout(l, modId));
  }

  function handleRunOrQueue() {
    if (!selectedBaseMapId || !craftedMap) return;
    if (activeMap) {
      onQueueMap(selectedBaseMapId, craftedMap, preparingLoadout);
    } else {
      onStartMap(selectedBaseMapId, craftedMap, preparingLoadout);
    }
    setSelectedBaseMapId(null);
    setCraftedMap(null);
    setPreparingLoadout({ modIds: [] });
  }

  const mapDef = selectedBaseMapId ? baseMapMap[selectedBaseMapId] : null;
  const runBonuses = craftedMap
    ? getRunStartMapBonuses(craftedMap, prestige, talentsPurchased, purchasedUpgrades)
    : { rewardBonus: 0, shardChanceBonus: 0, speedBonus: 0 };
  const resolvedCost = mapDef && craftedMap ? getResolvedMapCost(mapDef, craftedMap, costReduction, deviceEffects) : null;
  const resolvedDuration = mapDef && craftedMap ? getResolvedMapDuration(mapDef, craftedMap, runBonuses.speedBonus, deviceEffects) : null;
  const encounter = craftedMap ? getMapEncounter(craftedMap.encounterId) : null;
  const shardChance = mapDef && craftedMap
    ? Math.min(
        MAP_BALANCE.maxShardChance,
        mapDef.baseShardChance
          + craftedMap.resolvedStats.shardChanceBonus
          + deviceEffects.shardChanceBonus
          + runBonuses.shardChanceBonus
          + (encounter?.shardChanceBonus ?? 0),
      )
    : 0;
  const rewardMult = craftedMap ? 1 + craftedMap.resolvedStats.rewardMultiplier + deviceEffects.rewardMultiplier : 1;
  const focusedRewardMult = craftedMap ? 1 + craftedMap.resolvedStats.focusedRewardMultiplier + deviceEffects.focusedRewardMultiplier : 1;

  const availableActions = craftedMap ? getAvailableCraftingActions(craftedMap) : [];
  const loadoutCost = getLoadoutTotalCost(preparingLoadout);
  const loadoutAffordable = canAffordLoadout(currencies, preparingLoadout);
  const currenciesPostLoadout: CurrencyState = loadoutAffordable && mapDef && craftedMap
    ? (() => {
        const c = { ...currencies };
        for (const [cid, amt] of Object.entries(loadoutCost)) {
          (c as Record<string, number>)[cid] -= amt ?? 0;
        }
        return c;
      })()
    : currencies;
  const mapCostAffordable = !!(mapDef && craftedMap && canAffordMap(mapDef, craftedMap, currenciesPostLoadout, costReduction, deviceEffects));
  const canCommit = !queuedMap && loadoutAffordable && mapCostAffordable;

  const rewardPreview = mapDef && craftedMap
    ? getMapRewardPreview(mapDef, craftedMap, getMapIncomeSnapshot(currencyProduction), runBonuses.rewardBonus, deviceEffects)
    : null;

  const activeMapDef = activeMap ? baseMapMap[activeMap.craftedMap.baseMapId] : null;
  const activeEncounter = activeMap ? getMapEncounter(activeMap.craftedMap.encounterId) : null;
  const queuedMapDef = queuedMap ? baseMapMap[queuedMap.baseMapId] : null;
  const queuedEncounter = queuedMap ? getMapEncounter(queuedMap.craftedMap.encounterId) : null;
  const showPrepArea = !queuedMap || !activeMap;

  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <h2 className="map-panel-title">Maps</h2>
        <span className="map-panel-stats">
          Completed: {prestige.mapsCompleted} | Encounter runs: {prestige.encounterMapsCompleted} | Shards: {formatCurrencyValue(prestige.mirrorShards)}
        </span>
      </div>

      {activeMap && activeMapDef && (
        <div className="map-active">
          <div className="map-active-info">
            <span className="map-active-label">
              <span style={{ color: getRarityColor(activeMap.craftedMap.rarity) }}>
                {getRarityLabel(activeMap.craftedMap.rarity)}
              </span>{" "}
              {activeMapDef.name}
              {activeEncounter && <span className="map-encounter-inline">{activeEncounter.name}</span>}
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
            <div className="map-progress-fill" style={{ width: `${Math.min(100, getMapProgress(activeMap, now) * 100)}%` }} />
          </div>
        </div>
      )}

      {queuedMap && queuedMapDef && (
        <div className="map-queued">
          <div className="map-queued-info">
            <span className="map-queued-label">
              Queued:{" "}
              <span style={{ color: getRarityColor(queuedMap.craftedMap.rarity) }}>
                {getRarityLabel(queuedMap.craftedMap.rarity)}
              </span>{" "}
              {queuedMapDef.name}
              {queuedEncounter && <span className="map-encounter-inline">{queuedEncounter.name}</span>}
              {queuedMap.deviceLoadout.modIds.length > 0 && (
                <span className="map-queued-mods">
                  {" "}+ {queuedMap.deviceLoadout.modIds.length} mod{queuedMap.deviceLoadout.modIds.length !== 1 ? "s" : ""}
                </span>
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
              {lastMapResult.shardDropped && <span className="map-result-shard-badge"> Shard!</span>}
              {lastMapResult.bonusRewardTriggered && <span className="map-result-bonus-badge"> Bonus!</span>}
            </span>
            <span className="map-result-total">~{formatCurrencyValue(lastMapResult.totalRewardValue)} value</span>
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
            {lastMapResult.shardDropped && <span className="map-result-item map-result-shard">+1 Mirror Shard</span>}
          </div>
        </div>
      )}

      {showPrepArea && (
        <>
          <div className="map-base-list">
            {baseMaps.map((def) => {
              const unlocked = isMapUnlocked(def, currencies);
              const isSelected = selectedBaseMapId === def.id;

              return (
                <button
                  key={def.id}
                  type="button"
                  className={`map-base-card${isSelected ? " map-base-card-selected" : ""}${!unlocked ? " map-base-card-locked" : ""}`}
                  disabled={!unlocked}
                  onClick={() => handleSelectBase(def.id)}
                >
                  <div className="map-base-card-header">
                    <span className="map-base-card-name">{unlocked ? def.name : "???"}</span>
                    <span className="map-base-card-family">Tier {def.tier}</span>
                  </div>
                  {unlocked && <p className="map-base-card-desc">{def.description}</p>}
                  {unlocked && <p className="map-base-card-subcopy">Targets ~{def.baseRewardSeconds}s of current production</p>}
                  {!unlocked && (
                    <p className="map-card-lock-hint">
                      Requires {formatCurrencyValue(def.unlockRequirement.amount)} {currencyMap[def.unlockRequirement.currencyId]?.shortLabel}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {mapDef && craftedMap && (
            <div className="map-craft-panel">
              <div className="map-craft-header">
                <span className="map-craft-rarity" style={{ color: getRarityColor(craftedMap.rarity) }}>
                  {getRarityLabel(craftedMap.rarity)} {mapDef.name}
                </span>
                <span className="map-craft-tier">Tier {craftedMap.tier}</span>
              </div>

              <div className="map-encounter-section">
                <div className="map-encounter-header">
                  <span className="map-encounter-title">Encounter</span>
                  <span className="map-encounter-copy">Choose a route goal before starting the run.</span>
                </div>
                <div className="map-encounter-list">
                  <button
                    type="button"
                    className={`map-encounter-card${craftedMap.encounterId === null ? " map-encounter-card-selected" : ""}`}
                    onClick={() => handleSelectEncounter(null)}
                  >
                    <span className="map-encounter-name">No encounter</span>
                    <span className="map-encounter-desc">Stable baseline rewards with no extra cost or risk.</span>
                  </button>
                  {mapEncounters.map((entry) => {
                    const unlocked = isMapEncounterUnlocked(entry, encounterProgression);
                    const selected = craftedMap.encounterId === entry.id;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={`map-encounter-card${selected ? " map-encounter-card-selected" : ""}${!unlocked ? " map-encounter-card-locked" : ""}`}
                        disabled={!unlocked}
                        onClick={() => handleSelectEncounter(entry.id)}
                      >
                        <div className="map-encounter-name-row">
                          <span className="map-encounter-name">{entry.name}</span>
                          <span className="map-encounter-meta">
                            {formatSignedPercent(entry.rewardMultiplier)} reward, {formatSignedPercent(entry.durationMultiplier)} time
                          </span>
                        </div>
                        <span className="map-encounter-desc">{unlocked ? entry.description : getMapEncounterUnlockText(entry)}</span>
                      </button>
                    );
                  })}
                </div>
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
                <p className="map-affix-empty">No affixes yet. This pass uses encounters to add route choice while quality and broader content tags stay open for later crafting depth.</p>
              )}

              <div className="map-craft-actions">
                {(["transmute", "augment", "alter", "regal", "chaos", "alchemy", "exalt"] as CraftingAction[]).map((action) => {
                  const isAvailable = availableActions.includes(action);
                  const cost = craftingCosts[action];
                  const affordable = canAffordCraft(currencies, action);
                  const canUse = isAvailable && affordable;

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
                        {Object.entries(cost).map(([cid, amount]) => (
                          <span key={cid}>{amount} {currencyMap[cid as keyof typeof currencyMap]?.shortLabel ?? cid}</span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="device-loadout">
                <div className="device-loadout-header">
                  <span className="device-loadout-title">Device Mods</span>
                  <span className="device-loadout-count">{preparingLoadout.modIds.length}/{LOADOUT_MAX_SLOTS} slots</span>
                </div>

                {preparingLoadout.modIds.length > 0 && (
                  <div className="device-loadout-selected">
                    {preparingLoadout.modIds.map((modId) => {
                      const def = deviceModMap[modId];
                      if (!def) return null;
                      return (
                        <div key={modId} className="device-loadout-chip">
                          <span className="device-loadout-chip-name" style={{ color: getModTierColor(def.tier) }}>
                            {def.name}
                          </span>
                          <span className="device-loadout-chip-desc">{def.description}</span>
                          <button type="button" className="device-loadout-chip-remove" onClick={() => handleRemoveMod(modId)} title="Remove">
                            x
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {preparingLoadout.modIds.length < LOADOUT_MAX_SLOTS && (
                  <div className="device-loadout-pool">
                    {deviceModPool.map((def) => {
                      const alreadyAdded = preparingLoadout.modIds.includes(def.id);
                      const canAdd = canAddModToLoadout(preparingLoadout, def.id);
                      return (
                        <div key={def.id} className={`device-pool-row${alreadyAdded ? " device-pool-row-added" : ""}`}>
                          <div className="device-pool-row-info">
                            <span className="device-pool-row-name" style={{ color: getModTierColor(def.tier) }}>{def.name}</span>
                            <span className="device-pool-row-tier">{getModTierLabel(def.tier)}</span>
                            <span className="device-pool-row-desc">{def.description}</span>
                          </div>
                          {!alreadyAdded && (
                            <button type="button" className="btn btn-sm device-pool-add-btn" disabled={!canAdd} onClick={() => handleAddMod(def.id)}>
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="map-craft-preview">
                <div className="map-preview-row">
                  <span className="map-preview-label">Encounter</span>
                  <span className="map-preview-value">
                    {encounter ? encounter.name : "None"}
                    {encounter && <span className="map-preview-note">{encounter.description}</span>}
                  </span>
                </div>
                <div className="map-preview-row">
                  <span className="map-preview-label">Map cost</span>
                  <span className="map-preview-value">
                    {resolvedCost
                      ? Object.entries(resolvedCost).map(([cid, amount]) => {
                          const def = currencyMap[cid as keyof typeof currencyMap];
                          const hasEnough = Math.floor(currencies[cid as keyof CurrencyState]) >= (amount ?? 0);
                          return (
                            <span key={cid} style={{ color: hasEnough ? undefined : "#e05050", marginRight: 6 }}>
                              {formatCurrencyValue(amount ?? 0)} {def?.shortLabel ?? cid}
                            </span>
                          );
                        })
                      : "-"}
                  </span>
                </div>
                {preparingLoadout.modIds.length > 0 && (
                  <div className="map-preview-row">
                    <span className="map-preview-label">Mod cost</span>
                    <span className="map-preview-value">
                      {Object.entries(loadoutCost).map(([cid, amount]) => {
                        const def = currencyMap[cid as keyof typeof currencyMap];
                        const hasEnough = Math.floor(currencies[cid as keyof CurrencyState]) >= (amount ?? 0);
                        return (
                          <span key={cid} style={{ color: hasEnough ? undefined : "#e05050", marginRight: 6 }}>
                            {formatCurrencyValue(amount ?? 0)} {def?.shortLabel ?? cid}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                )}
                <div className="map-preview-row">
                  <span className="map-preview-label">Duration</span>
                  <span className="map-preview-value">{resolvedDuration ? formatMs(resolvedDuration) : "-"}</span>
                </div>
                <div className="map-preview-row">
                  <span className="map-preview-label">Reward mods</span>
                  <span className="map-preview-value">
                    {formatSignedPercent(rewardMult - 1)} base
                    {Object.keys(mapDef.focusedRewardWeights).length > 0 && <>, {formatSignedPercent(focusedRewardMult - 1)} focused</>}
                    {hasMapEncounter(craftedMap) && <>, +{Math.round(runBonuses.rewardBonus * 100)}% total planning</>}
                  </span>
                </div>
                <div className="map-preview-row">
                  <span className="map-preview-label">Shard chance</span>
                  <span className="map-preview-value" style={{ color: shardChance > 0.02 ? "#c0a0ff" : undefined }}>
                    {formatPercent(shardChance)}
                  </span>
                </div>
                <div className="map-preview-row">
                  <span className="map-preview-label">Projected</span>
                  <span className="map-preview-value map-preview-rewards">
                    {rewardPreview
                      ? Object.entries(rewardPreview.rewards).map(([cid, amount]) => {
                          const def = currencyMap[cid as keyof typeof currencyMap];
                          return <span key={cid}>{formatCurrencyValue(amount ?? 0)} {def?.shortLabel ?? cid}</span>;
                        })
                      : "-"}
                  </span>
                </div>
                <div className="map-preview-row">
                  <span className="map-preview-label">Value</span>
                  <span className="map-preview-value">
                    {rewardPreview ? `~${formatCurrencyValue(rewardPreview.totalRewardValue)} total value` : "-"}
                  </span>
                </div>
              </div>

              <button type="button" className="btn btn-primary btn-full" disabled={!canCommit} onClick={handleRunOrQueue}>
                {activeMap ? (queuedMap ? "Queue full" : "Queue for Next Run") : (!canCommit ? "Can't Afford" : "Run Map")}
              </button>
            </div>
          )}

          {!selectedBaseMapId && !activeMap && <p className="map-select-hint">Select a map above to craft it, choose an encounter, and start the run.</p>}
          {!selectedBaseMapId && activeMap && !queuedMap && <p className="map-select-hint">Select a map above to queue it for after the current run.</p>}
        </>
      )}
    </div>
  );
}

export default MapPanel;



