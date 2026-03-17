import { memo, useEffect, useMemo, useState } from "react";
import { MapBaseSelector } from "@/components/maps/MapBaseSelector";
import { MapPreparationPanel } from "@/components/maps/MapPreparationPanel";
import { MapRunStatus } from "@/components/maps/MapRunStatus";
import { currencyMap, type CurrencyProduction, type CurrencyState } from "@/game/currencies";
import { getRunStartMapBonuses } from "@/game/gameEngine";
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
  type ActiveMapState,
  type CraftedMap,
  type CraftingAction,
  type MapCompletionResult,
  type QueuedMapSetup,
} from "@/game/maps";
import {
  addModToLoadout,
  canAffordLoadout,
  getLoadoutTotalCost,
  removeModFromLoadout,
  resolveLoadoutEffects,
  type DeviceLoadout,
} from "@/game/mapDevice";
import type { PrestigeState } from "@/game/prestige";
import { getMapCostReduction, type TalentPurchasedState } from "@/game/talents";
import { augmentDeviceEffectsForUpgrades, getMapCostReductionUpgradeBonus, type PurchasedUpgradeState } from "@/game/upgradeEngine";

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

export const MapPanel = memo(function MapPanel({
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
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [activeMap]);

  const deviceEffects = useMemo(
    () => augmentDeviceEffectsForUpgrades(resolveLoadoutEffects(preparingLoadout), purchasedUpgrades, Boolean(activeMap && !queuedMap)),
    [activeMap, preparingLoadout, purchasedUpgrades, queuedMap],
  );
  const costReduction = useMemo(
    () => getMapCostReduction(talentsPurchased) + getMapCostReductionUpgradeBonus(purchasedUpgrades),
    [purchasedUpgrades, talentsPurchased],
  );
  const encounterProgression = useMemo(
    () => ({
      mapsCompleted: prestige.mapsCompleted,
      totalMirrorShards: prestige.totalMirrorShards,
      prestigeCount: prestige.prestigeCount,
      lastEncounterId: prestige.lastEncounterId,
      lastEncounterStreak: prestige.lastEncounterStreak,
    }),
    [prestige.lastEncounterId, prestige.lastEncounterStreak, prestige.mapsCompleted, prestige.prestigeCount, prestige.totalMirrorShards],
  );
  const mapDef = useMemo(() => (selectedBaseMapId ? baseMapMap[selectedBaseMapId] : null), [selectedBaseMapId]);
  const runBonuses = useMemo(
    () =>
      craftedMap
        ? getRunStartMapBonuses(craftedMap, prestige, talentsPurchased, purchasedUpgrades)
        : { rewardBonus: 0, shardChanceBonus: 0, speedBonus: 0, encounterChain: 0 },
    [craftedMap, prestige, purchasedUpgrades, talentsPurchased],
  );
  const resolvedCost = useMemo(
    () => (mapDef && craftedMap ? getResolvedMapCost(mapDef, craftedMap, costReduction, deviceEffects) : null),
    [costReduction, craftedMap, deviceEffects, mapDef],
  );
  const resolvedDuration = useMemo(
    () => (mapDef && craftedMap ? getResolvedMapDuration(mapDef, craftedMap, runBonuses.speedBonus, deviceEffects) : null),
    [craftedMap, deviceEffects, mapDef, runBonuses.speedBonus],
  );
  const encounter = useMemo(() => (craftedMap ? getMapEncounter(craftedMap.encounterId) : null), [craftedMap]);
  const encounterSpecialization = useMemo(() => (craftedMap ? getEncounterSpecialization(craftedMap) : null), [craftedMap]);
  const shardChance = useMemo(
    () =>
      mapDef && craftedMap
        ? Math.min(
            MAP_BALANCE.maxShardChance,
            mapDef.baseShardChance
              + craftedMap.resolvedStats.shardChanceBonus
              + deviceEffects.shardChanceBonus
              + runBonuses.shardChanceBonus
              + (encounterSpecialization?.shardChanceBonus ?? 0)
              + (encounter?.shardChanceBonus ?? 0),
          )
        : 0,
    [craftedMap, deviceEffects.shardChanceBonus, encounter, encounterSpecialization, mapDef, runBonuses.shardChanceBonus],
  );
  const rewardMult = useMemo(
    () => (craftedMap ? 1 + craftedMap.resolvedStats.rewardMultiplier + deviceEffects.rewardMultiplier : 1),
    [craftedMap, deviceEffects.rewardMultiplier],
  );
  const focusedRewardMult = useMemo(
    () => (craftedMap ? 1 + craftedMap.resolvedStats.focusedRewardMultiplier + deviceEffects.focusedRewardMultiplier : 1),
    [craftedMap, deviceEffects.focusedRewardMultiplier],
  );
  const availableActions = useMemo(() => (craftedMap ? getAvailableCraftingActions(craftedMap) : []), [craftedMap]);
  const loadoutCost = useMemo(() => getLoadoutTotalCost(preparingLoadout), [preparingLoadout]);
  const loadoutAffordable = useMemo(() => canAffordLoadout(currencies, preparingLoadout), [currencies, preparingLoadout]);
  const currenciesPostLoadout = useMemo<CurrencyState>(
    () =>
      loadoutAffordable
        ? Object.entries(loadoutCost).reduce((nextCurrencies, [currencyId, amount]) => {
            nextCurrencies[currencyId as keyof CurrencyState] -= amount ?? 0;
            return nextCurrencies;
          }, { ...currencies })
        : currencies,
    [currencies, loadoutAffordable, loadoutCost],
  );
  const mapCostAffordable = useMemo(
    () => Boolean(mapDef && craftedMap && canAffordMap(mapDef, craftedMap, currenciesPostLoadout, costReduction, deviceEffects)),
    [costReduction, craftedMap, currenciesPostLoadout, deviceEffects, mapDef],
  );
  const canCommit = !queuedMap && loadoutAffordable && mapCostAffordable;
  const rewardPreview = useMemo(() => {
    if (!mapDef || !craftedMap) {
      return null;
    }

    const wealthValue = Object.entries(currenciesPostLoadout).reduce(
      (total, [currencyId, amount]) => total + (currencyMap[currencyId as keyof typeof currencyMap]?.baseValue ?? 0) * amount,
      0,
    );

    return getMapRewardPreview(
      mapDef,
      craftedMap,
      getMapIncomeSnapshot(currencyProduction),
      wealthValue,
      runBonuses.rewardBonus,
      deviceEffects,
      runBonuses.encounterChain,
    );
  }, [craftedMap, currenciesPostLoadout, currencyProduction, deviceEffects, mapDef, runBonuses.encounterChain, runBonuses.rewardBonus]);
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
          <section className="shell-card map-selector-shell">
            <div className="shell-card-header">
              <div>
                <p className="shell-card-eyebrow">Step 0</p>
                <h3 className="shell-card-title">Select the base map</h3>
              </div>
            </div>
            <MapBaseSelector currencies={currencies} selectedBaseMapId={selectedBaseMapId} onSelectBase={handleSelectBase} />
          </section>

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

          {!selectedBaseMapId && !activeMap && <p className="map-select-hint">Select a base map to start the setup flow, then choose an encounter, craft the route, socket device mods, and launch the run.</p>}
          {!selectedBaseMapId && activeMap && !queuedMap && <p className="map-select-hint">Select a base map to prepare the next route while the current one is still running.</p>}
        </>
      )}
    </div>
  );
});
