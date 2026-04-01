import { memo, useMemo, useState } from "react";
import { formatMs, formatPercent, formatSignedPercent } from "@/components/maps/mapFormatting";
import { MapDevice } from "@/components/maps/MapDevice";
import { currencyMap, formatCurrencyValue, type CurrencyState } from "@/game/currencies";
import {
  LOADOUT_MAX_SLOTS,
  canAddModToLoadout,
  deviceModMap,
  deviceModPool,
  getDeviceModDeltas,
  getModCategoryLabel,
  getModTierColor,
  getModTierLabel,
  type DeviceLoadout,
  type DeviceModCategory,
} from "@/game/mapDevice";
import {
  canAffordCraft,
  craftingActionLabels,
  craftingCosts,
  getMapEncounter,
  getMapEncounterUnlockText,
  isMapEncounterUnlocked,
  mapEncounters,
  type BaseMapDefinition,
  type CraftedMap,
  type CraftingAction,
  type MapEncounterProgression,
  type MapRewardPreview,
} from "@/game/maps";

type Stem = "encounter" | "craft" | "mods" | null;

type MapPreparationPanelProps = {
  currencies: CurrencyState;
  mapDef: BaseMapDefinition;
  craftedMap: CraftedMap;
  encounterProgression: MapEncounterProgression;
  availableActions: CraftingAction[];
  loadout: DeviceLoadout;
  loadoutAffordable: boolean;
  canCommit: boolean;
  hasActiveMap: boolean;
  hasQueuedMap: boolean;
  resolvedCost: Partial<Record<string, number>> | null;
  loadoutCost: Partial<Record<string, number>>;
  resolvedDuration: number | null;
  rewardPreview: MapRewardPreview | null;
  rewardMult: number;
  focusedRewardMult: number;
  shardChance: number;
  runBonuses: { rewardBonus: number; shardChanceBonus: number; speedBonus: number; encounterChain: number };
  onSelectEncounter: (encounterId: CraftedMap["encounterId"]) => void;
  onCraft: (action: CraftingAction) => void;
  onAddMod: (modId: string) => void;
  onRemoveMod: (modId: string) => void;
  onCommit: () => void;
};

const modCategories: DeviceModCategory[] = ["reward", "duration", "utility", "synergy"];

function getCommitLabel(hasActiveMap: boolean, hasQueuedMap: boolean, canCommit: boolean, loadoutAffordable: boolean) {
  if (hasActiveMap) return hasQueuedMap ? "Queue full" : "Queue map";
  if (!loadoutAffordable || !canCommit) return "Need resources";
  return "Run map";
}

export const MapPreparationPanel = memo(function MapPreparationPanel({
  currencies,
  mapDef,
  craftedMap,
  encounterProgression,
  availableActions,
  loadout,
  loadoutAffordable,
  canCommit,
  hasActiveMap,
  hasQueuedMap,
  resolvedCost,
  loadoutCost,
  resolvedDuration,
  rewardPreview,
  rewardMult,
  focusedRewardMult,
  shardChance,
  runBonuses,
  onSelectEncounter,
  onCraft,
  onAddMod,
  onRemoveMod,
  onCommit,
}: MapPreparationPanelProps) {
  const [activeStem, setActiveStem] = useState<Stem>(null);
  const [activeModCategory, setActiveModCategory] = useState<DeviceModCategory>("reward");

  const encounter = getMapEncounter(craftedMap.encounterId);
  const appliedMods = useMemo(() => loadout.modIds.map((id) => deviceModMap[id]).filter(Boolean), [loadout.modIds]);
  const availableMods = useMemo(() => deviceModPool.filter((d) => d.category === activeModCategory), [activeModCategory]);

  const totalCost = useMemo(() => {
    const costs: [string, number][] = [];
    if (resolvedCost) {
      for (const [id, amount] of Object.entries(resolvedCost)) {
        if (amount) costs.push([id, amount]);
      }
    }
    for (const [id, amount] of Object.entries(loadoutCost)) {
      if (amount) {
        const existing = costs.find(([cid]) => cid === id);
        if (existing) existing[1] += amount;
        else costs.push([id, amount]);
      }
    }
    return costs;
  }, [resolvedCost, loadoutCost]);

  function toggleStem(stem: Stem) {
    setActiveStem((current) => (current === stem ? null : stem));
  }

  const stemBtn = "flex-1 px-3 py-2 rounded-lg border text-center cursor-pointer transition-all duration-150 text-[0.7rem] font-semibold";
  const stemActive = "border-[rgba(244,213,140,0.3)] bg-[rgba(244,213,140,0.1)] text-accent-gold";
  const stemInactive = "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)]";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Central device */}
      <MapDevice
        mapDef={mapDef}
        craftedMap={craftedMap}
        rewardMult={rewardMult}
        shardChance={shardChance}
        resolvedDuration={resolvedDuration}
      />

      {/* Stem buttons */}
      <div className="flex gap-2 w-full max-w-[600px]">
        <button type="button" className={`${stemBtn} ${activeStem === "encounter" ? stemActive : stemInactive}`} onClick={() => toggleStem("encounter")}>
          {encounter ? encounter.name : "Encounter"}
        </button>
        <button type="button" className={`${stemBtn} ${activeStem === "craft" ? stemActive : stemInactive}`} onClick={() => toggleStem("craft")}>
          Craft {craftedMap.affixIds.length > 0 ? `(${craftedMap.affixIds.length})` : ""}
        </button>
        <button type="button" className={`${stemBtn} ${activeStem === "mods" ? stemActive : stemInactive}`} onClick={() => toggleStem("mods")}>
          Mods {loadout.modIds.length > 0 ? `${loadout.modIds.length}/${LOADOUT_MAX_SLOTS}` : `0/${LOADOUT_MAX_SLOTS}`}
        </button>
      </div>

      {/* Accordion content */}
      {activeStem === "encounter" && (
        <div className="w-full max-w-[600px] grid gap-1.5 animate-[section-enter_200ms_ease-out]">
          <button
            type="button"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              craftedMap.encounterId === null
                ? "border-[rgba(255,211,106,0.28)] bg-[rgba(255,211,106,0.06)]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)]"
            }`}
            onClick={() => onSelectEncounter(null)}
          >
            <span className="text-[0.72rem] font-semibold text-text-bright">No encounter</span>
            <span className="text-[0.6rem] text-text-secondary">Baseline</span>
          </button>
          {mapEncounters.map((entry) => {
            const unlocked = isMapEncounterUnlocked(entry, encounterProgression);
            const selected = craftedMap.encounterId === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                disabled={!unlocked}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                  selected
                    ? "border-[rgba(255,211,106,0.28)] bg-[rgba(255,211,106,0.06)]"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:not-disabled:bg-[rgba(255,255,255,0.04)]"
                }`}
                onClick={() => onSelectEncounter(entry.id)}
              >
                <span className="text-[0.72rem] font-semibold text-text-bright">
                  {unlocked ? entry.name : getMapEncounterUnlockText(entry)}
                </span>
                {unlocked && (
                  <span className="text-[0.58rem] text-text-secondary">
                    {formatSignedPercent(entry.rewardMultiplier)} reward · {formatSignedPercent(entry.durationMultiplier)} time
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {activeStem === "craft" && (
        <div className="w-full max-w-[600px] grid gap-2 animate-[section-enter_200ms_ease-out]">
          <div className="flex flex-wrap gap-1.5">
            {(["transmute", "augment", "alter", "regal", "chaos", "alchemy", "exalt"] as CraftingAction[]).map((action) => {
              const isAvailable = availableActions.includes(action);
              const affordable = canAffordCraft(currencies, action);
              const canUse = isAvailable && affordable;
              const costEntries = Object.entries(craftingCosts[action]);

              return (
                <button
                  key={action}
                  type="button"
                  disabled={!canUse}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] cursor-pointer transition-all duration-100 hover:not-disabled:bg-[rgba(255,255,255,0.08)] disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => onCraft(action)}
                  title={costEntries.map(([cid, amt]) => `${amt} ${currencyMap[cid]?.shortLabel}`).join(", ")}
                >
                  <span className="text-[0.68rem] font-semibold text-text-bright">{craftingActionLabels[action]}</span>
                  <span className="text-[0.56rem] text-text-secondary">
                    {costEntries.map(([cid, amt]) => `${amt} ${currencyMap[cid]?.shortLabel}`).join(", ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeStem === "mods" && (
        <div className="w-full max-w-[600px] grid gap-2 animate-[section-enter_200ms_ease-out]">
          {/* Applied mods */}
          {appliedMods.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {appliedMods.map((mod) => (
                <div key={mod.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[rgba(244,213,140,0.2)] bg-[rgba(244,213,140,0.05)]">
                  <span className="text-[0.64rem] font-semibold text-text-bright">{mod.name}</span>
                  <button
                    type="button"
                    className="text-[0.56rem] text-accent-red cursor-pointer bg-transparent border-none hover:underline"
                    onClick={() => onRemoveMod(mod.id)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Category tabs */}
          <div className="flex gap-1.5">
            {modCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`px-2 py-1 rounded-md text-[0.62rem] font-semibold cursor-pointer transition-colors ${
                  activeModCategory === cat
                    ? "bg-[rgba(244,213,140,0.12)] text-accent-gold border border-[rgba(244,213,140,0.25)]"
                    : "bg-transparent text-text-secondary border border-transparent hover:text-text-primary"
                }`}
                onClick={() => setActiveModCategory(cat)}
              >
                {getModCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Mod list */}
          <div className="grid gap-1">
            {availableMods.map((mod) => {
              const alreadyAdded = loadout.modIds.includes(mod.id);
              const canAdd = canAddModToLoadout(loadout, mod.id);
              const deltas = getDeviceModDeltas(mod);

              return (
                <div
                  key={mod.id}
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-colors ${
                    alreadyAdded
                      ? "border-[rgba(88,217,139,0.2)] bg-[rgba(88,217,139,0.05)]"
                      : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.68rem] font-semibold text-text-bright">{mod.name}</span>
                      <span className="text-[0.54rem] font-bold" style={{ color: getModTierColor(mod.tier) }}>{getModTierLabel(mod.tier)}</span>
                    </div>
                    <div className="flex gap-2 text-[0.56rem]">
                      {deltas.map((d) => (
                        <span key={d.type} className={d.value > 0 ? "text-[#9ef0bf]" : "text-[#ff9a9a]"}>
                          {d.label} {formatSignedPercent(d.value)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canAdd || alreadyAdded}
                    className="shrink-0 px-2 py-1 rounded-md text-[0.6rem] font-semibold border border-[rgba(255,211,106,0.18)] text-accent-gold bg-transparent cursor-pointer transition-colors hover:not-disabled:bg-[rgba(255,211,106,0.1)] disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => onAddMod(mod.id)}
                  >
                    {alreadyAdded ? "Added" : "Socket"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total cost + Run button */}
      <div className="w-full max-w-[600px] flex flex-col items-center gap-2 pt-2">
        {totalCost.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 text-[0.6rem]">
            {totalCost.map(([cid, amount]) => {
              const def = currencyMap[cid];
              const hasEnough = Math.floor(currencies[cid] ?? 0) >= amount;
              return (
                <span key={cid} className={hasEnough ? "text-text-secondary" : "text-[#ff9a9a]"}>
                  {formatCurrencyValue(amount)} {def?.shortLabel ?? cid}
                </span>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={!canCommit || !loadoutAffordable}
          className="w-full max-w-[300px] px-4 py-2 border-none rounded-lg text-[0.78rem] font-bold text-bg-surface bg-gradient-to-b from-gradient-gold-start to-gradient-gold-end cursor-pointer transition-all duration-100 hover:not-disabled:from-[#ffe08a] hover:not-disabled:to-[#ebb730] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
          onClick={onCommit}
        >
          {getCommitLabel(hasActiveMap, hasQueuedMap, canCommit, loadoutAffordable)}
        </button>
      </div>
    </div>
  );
});
