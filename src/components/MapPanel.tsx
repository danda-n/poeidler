import { useEffect, useState } from "react";
import { getRunStartMapBonuses } from "../game/gameEngine";
import {
  MAP_BALANCE,
  baseMapMap,
  canAffordCraft,
  canAffordMap,
  createNormalMap,
  getAvailableCraftingActions,
  getEncounterSpecialization,
  getMapEncounter,
  getMapIncomeSnapshot,
  getMapRewardPreview,
  getResolvedMapCost,
  getResolvedMapDuration,
  hasMapEncounter,
  type ActiveMapState,
  type CraftedMap,
  type CraftingAction,
  type MapCompletionResult,
  type QueuedMapSetup,
} from "../game/maps";
import {
  addModToLoadout,
  canAffordLoadout,
  getLoadoutTotalCost,
  removeModFromLoadout,
  resolveLoadoutEffects,
  type DeviceLoadout,
} from "../game/mapDevice";
import { currencyMap, formatCurrencyValue, type CurrencyProduction, type CurrencyState } from "../game/currencies";
import { getMapCostReduction, type TalentPurchasedState } from "../game/talents";
import { augmentDeviceEffectsForUpgrades, getMapCostReductionUpgradeBonus, type PurchasedUpgradeState } from "../game/upgradeEngine";
import type { PrestigeState } from "../game/prestige";
import { MapBaseSelector } from "./maps/MapBaseSelector";
import { MapPreparationPanel } from "./maps/MapPreparationPanel";
import { MapRunStatus } from "./maps/MapRunStatus";

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

  useEffect(() => {
    if (!activeMap) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [activeMap]);

  const deviceEffects = augmentDeviceEffectsForUpgrades(resolveLoadoutEffects(preparingLoadout), purchasedUpgrades, Boolean(activeMap && !queuedMap));
  const costReduction = getMapCostReduction(talentsPurchased) + getMapCostReductionUpgradeBonus(purchasedUpgrades);
  const encounterProgression = {
    mapsCompleted: prestige.mapsCompleted,
    totalMirrorShards: prestige.totalMirrorShards,
    prestigeCount: prestige.prestigeCount,
    lastEncounterId: prestige.lastEncounterId,
    lastEncounterStreak: prestige.lastEncounterStreak,
  };

  const mapDef = selectedBaseMapId ? baseMapMap[selectedBaseMapId] : null;
  const runBonuses = craftedMap
    ? getRunStartMapBonuses(craftedMap, prestige, talentsPurchased, purchasedUpgrades)
    : { rewardBonus: 0, shardChanceBonus: 0, speedBonus: 0, encounterChain: 0 };
  const resolvedCost = mapDef && craftedMap ? getResolvedMapCost(mapDef, craftedMap, costReduction, deviceEffects) : null;
  const resolvedDuration = mapDef && craftedMap ? getResolvedMapDuration(mapDef, craftedMap, runBonuses.speedBonus, deviceEffects) : null;
  const encounter = craftedMap ? getMapEncounter(craftedMap.encounterId) : null;
  const encounterSpecialization = craftedMap ? getEncounterSpecialization(craftedMap) : null;
  const shardChance = mapDef && craftedMap
    ? Math.min(
        MAP_BALANCE.maxShardChance,
        mapDef.baseShardChance
          + craftedMap.resolvedStats.shardChanceBonus
          + deviceEffects.shardChanceBonus
          + runBonuses.shardChanceBonus
          + (encounterSpecialization?.shardChanceBonus ?? 0)
          + (encounter?.shardChanceBonus ?? 0),
      )
    : 0;
  const rewardMult = craftedMap ? 1 + craftedMap.resolvedStats.rewardMultiplier + deviceEffects.rewardMultiplier : 1;
  const focusedRewardMult = craftedMap ? 1 + craftedMap.resolvedStats.focusedRewardMultiplier + deviceEffects.focusedRewardMultiplier : 1;
  const availableActions = craftedMap ? getAvailableCraftingActions(craftedMap) : [];
  const loadoutCost = getLoadoutTotalCost(preparingLoadout);
  const loadoutAffordable = canAffordLoadout(currencies, preparingLoadout);
  const currenciesPostLoadout: CurrencyState = loadoutAffordable
    ? Object.entries(loadoutCost).reduce((nextCurrencies, [currencyId, amount]) => {
        nextCurrencies[currencyId as keyof CurrencyState] -= amount ?? 0;
        return nextCurrencies;
      }, { ...currencies })
    : currencies;
  const mapCostAffordable = Boolean(mapDef && craftedMap && canAffordMap(mapDef, craftedMap, currenciesPostLoadout, costReduction, deviceEffects));
  const canCommit = !queuedMap && loadoutAffordable && mapCostAffordable;
  const rewardPreview = mapDef && craftedMap
    ? getMapRewardPreview(
        mapDef,
        craftedMap,
        getMapIncomeSnapshot(currencyProduction),
        Object.entries(currenciesPostLoadout).reduce((total, [currencyId, amount]) => total + (currencyMap[currencyId as keyof typeof currencyMap]?.baseValue ?? 0) * amount, 0),
        runBonuses.rewardBonus,
        deviceEffects,
        runBonuses.encounterChain,
      )
    : null;
  const showPrepArea = !queuedMap || !activeMap;

  function handleSelectBase(baseMapId: string) {
    setSelectedBaseMapId(baseMapId);
    setCraftedMap(createNormalMap(baseMapId));
    setPreparingLoadout({ modIds: [] });
  }

  function handleSelectEncounter(encounterId: CraftedMap["encounterId"]) {
    setCraftedMap((current) => (current ? { ...current, encounterId } : current));
  }

  function handleCraft(action: CraftingAction) {
    if (!craftedMap || !canAffordCraft(currencies, action)) return;
    const result = onCraftMap(craftedMap, action);
    if (result) setCraftedMap(result);
  }

  function handleAddMod(modId: string) {
    setPreparingLoadout((current) => addModToLoadout(current, modId));
  }

  function handleRemoveMod(modId: string) {
    setPreparingLoadout((current) => removeModFromLoadout(current, modId));
  }

  function handleCommit() {
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

  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <div>
          <h2 className="map-panel-title">Maps</h2>
          <p className="map-panel-copy">Prepare a route, tune the map, and let rewards keep pace with the economy instead of falling behind it.</p>
        </div>
        <span className="map-panel-stats">
          Completed: {prestige.mapsCompleted} | Encounter runs: {prestige.encounterMapsCompleted} | Shards: {formatCurrencyValue(prestige.mirrorShards)}
        </span>
      </div>

      <MapRunStatus
        activeMap={activeMap}
        queuedMap={queuedMap}
        lastMapResult={lastMapResult}
        encounterProgression={encounterProgression}
        now={now}
        onCancelQueue={onCancelQueue}
      />

      {showPrepArea && (
        <>
          <MapBaseSelector currencies={currencies} selectedBaseMapId={selectedBaseMapId} onSelectBase={handleSelectBase} />

          {mapDef && craftedMap && (
            <MapPreparationPanel
              currencies={currencies}
              mapDef={mapDef}
              craftedMap={craftedMap}
              encounterProgression={encounterProgression}
              availableActions={availableActions}
              loadout={preparingLoadout}
              loadoutAffordable={loadoutAffordable}
              canCommit={canCommit}
              hasActiveMap={Boolean(activeMap)}
              hasQueuedMap={Boolean(queuedMap)}
              resolvedCost={resolvedCost}
              loadoutCost={loadoutCost}
              resolvedDuration={resolvedDuration}
              rewardPreview={rewardPreview}
              rewardMult={rewardMult}
              focusedRewardMult={focusedRewardMult}
              shardChance={shardChance}
              runBonuses={runBonuses}
              onSelectEncounter={handleSelectEncounter}
              onCraft={handleCraft}
              onAddMod={handleAddMod}
              onRemoveMod={handleRemoveMod}
              onCommit={handleCommit}
            />
          )}

          {!selectedBaseMapId && !activeMap && <p className="map-select-hint">Select a map above to choose an encounter, craft it, and start the run.</p>}
          {!selectedBaseMapId && activeMap && !queuedMap && <p className="map-select-hint">Select a map above to queue it for after the current run.</p>}
        </>
      )}
    </div>
  );
}
