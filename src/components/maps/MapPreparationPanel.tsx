import { useMemo, useState } from "react";
import {
  canAffordCraft,
  craftingActionDescriptions,
  craftingActionLabels,
  craftingCosts,
  getAffixDescription,
  getAffixDisplayName,
  getMapEncounter,
  getMapEncounterUnlockText,
  getRarityColor,
  getRarityLabel,
  isMapEncounterUnlocked,
  mapEncounters,
  type BaseMapDefinition,
  type CraftedMap,
  type CraftingAction,
  type MapEncounterProgression,
  type MapRewardPreview,
} from "../../game/maps";
import {
  LOADOUT_MAX_SLOTS,
  canAddModToLoadout,
  deviceModMap,
  deviceModPool,
  getDeviceModDeltas,
  getLoadoutTotalCost,
  getModCategoryDescription,
  getModCategoryLabel,
  getModTierColor,
  getModTierLabel,
  type DeviceLoadout,
  type DeviceModCategory,
} from "../../game/mapDevice";
import { currencyMap, formatCurrencyValue, type CurrencyState } from "../../game/currencies";
import { formatMs, formatPercent, formatSignedPercent } from "./mapFormatting";

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

function formatCostEntries(cost: Partial<Record<string, number>>, currencies: CurrencyState) {
  return Object.entries(cost).map(([currencyId, amount]) => {
    const definition = currencyMap[currencyId as keyof typeof currencyMap];
    const hasEnough = Math.floor(currencies[currencyId as keyof CurrencyState]) >= (amount ?? 0);
    return {
      key: currencyId,
      label: `${formatCurrencyValue(amount ?? 0)} ${definition?.shortLabel ?? currencyId}`,
      affordable: hasEnough,
    };
  });
}

function getCommitLabel(hasActiveMap: boolean, hasQueuedMap: boolean, canCommit: boolean, loadoutAffordable: boolean) {
  if (hasActiveMap) {
    return hasQueuedMap ? "Queued map already set" : "Queue for next run";
  }

  if (!loadoutAffordable || !canCommit) {
    return "Need more resources";
  }

  return "Start map run";
}

export function MapPreparationPanel({
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
  const [activeCategory, setActiveCategory] = useState<DeviceModCategory>("reward");
  const encounter = getMapEncounter(craftedMap.encounterId);
  const appliedMods = loadout.modIds.map((modId) => deviceModMap[modId]).filter(Boolean);
  const openSlots = LOADOUT_MAX_SLOTS - loadout.modIds.length;
  const mapCostRows = resolvedCost ? formatCostEntries(resolvedCost, currencies) : [];
  const loadoutCostRows = formatCostEntries(loadoutCost, currencies);
  const availableMods = useMemo(
    () => deviceModPool.filter((definition) => definition.category === activeCategory),
    [activeCategory],
  );

  const summaryRows = [
    { label: "Base rewards", value: formatSignedPercent(rewardMult - 1), tone: rewardMult >= 1 ? "good" : "bad" },
    { label: "Focused rewards", value: Object.keys(mapDef.focusedRewardWeights).length > 0 ? formatSignedPercent(focusedRewardMult - 1) : "No focused pool", tone: focusedRewardMult >= 1 ? "good" : "neutral" },
    { label: "Shard chance", value: formatPercent(shardChance), tone: shardChance >= 0.02 ? "good" : "neutral" },
    { label: "Run time", value: resolvedDuration ? formatMs(resolvedDuration) : "-", tone: "neutral" },
  ] as const;

  return (
    <div className="device-workbench">
      <section className="shell-card device-stage-card">
        <div className="device-stage-header">
          <div>
            <p className="shell-card-eyebrow">Step 1</p>
            <h3 className="device-stage-title">Choose target and shape the map</h3>
          </div>
          <div className="device-stage-badge-row">
            <span className="device-stage-badge">{getRarityLabel(craftedMap.rarity)}</span>
            <span className="device-stage-badge">Tier {craftedMap.tier}</span>
            {encounter && <span className="device-stage-badge device-stage-badge-active">{encounter.name}</span>}
          </div>
        </div>

        <div className="device-target-grid">
          <div className="device-target-card">
            <div className="map-craft-header">
              <span className="map-craft-rarity" style={{ color: getRarityColor(craftedMap.rarity) }}>
                {getRarityLabel(craftedMap.rarity)} {mapDef.name}
              </span>
              <span className="map-craft-tier">{mapDef.family} route</span>
            </div>
            <p className="device-target-copy">{mapDef.description}</p>
            <div className="device-target-subcopy">Build around the encounter first, then use crafting to sharpen that run target.</div>
          </div>

          <div className="map-encounter-section device-encounter-panel">
            <div className="map-encounter-header">
              <span className="map-encounter-title">Run target</span>
              <span className="map-encounter-copy">Pick the encounter goal that matches the kind of return you want.</span>
            </div>
            <div className="map-encounter-list">
              <button
                type="button"
                className={`map-encounter-card${craftedMap.encounterId === null ? " map-encounter-card-selected" : ""}`}
                onClick={() => onSelectEncounter(null)}
              >
                <div className="map-encounter-name-row">
                  <span className="map-encounter-name">No encounter</span>
                  <span className="map-encounter-meta">Stable baseline</span>
                </div>
                <span className="map-encounter-desc">Simple payout profile with no extra cost or route pressure.</span>
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
                    onClick={() => onSelectEncounter(entry.id)}
                  >
                    <div className="map-encounter-name-row">
                      <span className="map-encounter-name">{entry.name}</span>
                      <span className="map-encounter-meta">{formatSignedPercent(entry.rewardMultiplier)} reward, {formatSignedPercent(entry.durationMultiplier)} time</span>
                    </div>
                    <span className="map-encounter-desc">{unlocked ? entry.description : getMapEncounterUnlockText(entry)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="device-crafting-panel">
          <div className="device-crafting-header">
            <div>
              <span className="map-encounter-title">Map crafting</span>
              <span className="map-encounter-copy">Use a small number of crafting actions to set the tone of the run before touching device mods.</span>
            </div>
          </div>

          {craftedMap.affixIds.length > 0 ? (
            <div className="device-affix-grid">
              {craftedMap.affixIds.map((affixId) => (
                <div key={affixId} className="device-affix-card">
                  <span className="device-affix-name">{getAffixDisplayName(affixId)}</span>
                  <span className="device-affix-desc">{getAffixDescription(affixId)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="map-affix-empty">No affixes yet. Crafting sets the map's baseline identity before device mods push it toward speed, payout, or shard pressure.</p>
          )}

          <div className="map-craft-actions device-craft-grid">
            {(["transmute", "augment", "alter", "regal", "chaos", "alchemy", "exalt"] as CraftingAction[]).map((action) => {
              const isAvailable = availableActions.includes(action);
              const affordable = canAffordCraft(currencies, action);
              const canUse = isAvailable && affordable;

              return (
                <button
                  key={action}
                  type="button"
                  className={`btn btn-craft device-craft-button${canUse ? "" : " btn-craft-disabled"}`}
                  disabled={!canUse}
                  onClick={() => onCraft(action)}
                  title={craftingActionDescriptions[action]}
                >
                  <span className="btn-craft-label">{craftingActionLabels[action]}</span>
                  <span className="device-craft-description">{craftingActionDescriptions[action]}</span>
                  <span className="btn-craft-cost">
                    {Object.entries(craftingCosts[action]).map(([currencyId, amount]) => (
                      <span key={currencyId}>{amount} {currencyMap[currencyId as keyof typeof currencyMap]?.shortLabel ?? currencyId}</span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="shell-card device-stage-card">
        <div className="device-stage-header">
          <div>
            <p className="shell-card-eyebrow">Step 2</p>
            <h3 className="device-stage-title">Socket device mods</h3>
          </div>
          <div className="device-stage-badge-row">
            <span className="device-stage-badge">{loadout.modIds.length}/{LOADOUT_MAX_SLOTS} slots used</span>
            {openSlots > 0 && <span className="device-stage-badge">{openSlots} open</span>}
          </div>
        </div>

        <div className="device-slots-grid">
          {Array.from({ length: LOADOUT_MAX_SLOTS }, (_, index) => {
            const definition = appliedMods[index];
            return (
              <div key={index} className={`device-slot-card${definition ? " device-slot-card-filled" : ""}`}>
                <div className="device-slot-card-topline">
                  <span className="device-slot-card-label">Slot {index + 1}</span>
                  {definition && <span className="device-slot-card-tier" style={{ color: getModTierColor(definition.tier) }}>{getModTierLabel(definition.tier)}</span>}
                </div>
                {definition ? (
                  <>
                    <div className="device-slot-card-title">{definition.name}</div>
                    <div className="device-slot-card-copy">{definition.summary}</div>
                    <button type="button" className="btn btn-sm" onClick={() => onRemoveMod(definition.id)}>Remove</button>
                  </>
                ) : (
                  <>
                    <div className="device-slot-card-title">Empty slot</div>
                    <div className="device-slot-card-copy">Choose a mod category below, then socket one of its cards here.</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="device-mod-library">
          <div className="device-mod-category-tabs">
            {modCategories.map((category) => {
              const count = deviceModPool.filter((definition) => definition.category === category).length;
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={`device-mod-category-tab${active ? " device-mod-category-tab-active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  <span className="device-mod-category-name">{getModCategoryLabel(category)}</span>
                  <span className="device-mod-category-copy">{count} mods</span>
                </button>
              );
            })}
          </div>

          <div className="device-mod-category-summary">
            <span className="device-mod-category-summary-title">{getModCategoryLabel(activeCategory)}</span>
            <span className="device-mod-category-summary-copy">{getModCategoryDescription(activeCategory)}</span>
          </div>

          <div className="device-mod-card-grid">
            {availableMods.map((definition) => {
              const alreadyAdded = loadout.modIds.includes(definition.id);
              const canAdd = canAddModToLoadout(loadout, definition.id);
              const deltas = getDeviceModDeltas(definition);
              return (
                <div key={definition.id} className={`device-mod-card${alreadyAdded ? " device-mod-card-selected" : ""}`}>
                  <div className="device-mod-card-header">
                    <div>
                      <div className="device-mod-card-title-row">
                        <span className="device-mod-card-title">{definition.name}</span>
                        <span className="device-mod-card-tier" style={{ color: getModTierColor(definition.tier) }}>{getModTierLabel(definition.tier)}</span>
                      </div>
                      <div className="device-mod-card-summary">{definition.summary}</div>
                    </div>
                    <span className="device-mod-card-category">{getModCategoryLabel(definition.category)}</span>
                  </div>

                  <p className="device-mod-card-copy">{definition.description}</p>

                  <div className="device-mod-delta-list">
                    {deltas.map((delta) => (
                      <span key={`${definition.id}-${delta.type}`} className={`device-mod-delta${delta.value > 0 ? " device-mod-delta-positive" : " device-mod-delta-negative"}`}>
                        {delta.label}: {delta.type === "bonusReward" || delta.type === "shardChance" ? formatSignedPercent(delta.value) : formatSignedPercent(delta.value)}
                      </span>
                    ))}
                  </div>

                  <div className="device-mod-card-footer">
                    <span className="device-mod-card-playstyle">{definition.playstyle}</span>
                    <button type="button" className="btn btn-sm" disabled={!canAdd || alreadyAdded} onClick={() => onAddMod(definition.id)}>
                      {alreadyAdded ? "Socketed" : canAdd ? "Socket" : "No slots"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="shell-card device-stage-card device-summary-card">
        <div className="device-stage-header">
          <div>
            <p className="shell-card-eyebrow">Step 3</p>
            <h3 className="device-stage-title">Review outcome and commit</h3>
          </div>
          {runBonuses.encounterChain > 0 && <span className="device-stage-badge device-stage-badge-active">Chain {runBonuses.encounterChain}</span>}
        </div>

        {runBonuses.encounterChain > 0 && (
          <div className="map-preview-callout">
            Expedition chain {runBonuses.encounterChain}: +{Math.round(runBonuses.encounterChain * 6)}% reward, +{(runBonuses.encounterChain * 0.15).toFixed(2)}% shard chance
          </div>
        )}

        <div className="device-summary-grid">
          <div className="device-summary-column">
            <div className="device-summary-panel">
              <span className="device-summary-panel-title">Costs</span>
              <div className="device-summary-token-list">
                {mapCostRows.length > 0 ? mapCostRows.map((entry) => (
                  <span key={entry.key} className={`device-summary-token${entry.affordable ? "" : " device-summary-token-alert"}`}>{entry.label}</span>
                )) : <span className="device-summary-token">-</span>}
              </div>
              {loadoutCostRows.length > 0 && (
                <>
                  <span className="device-summary-panel-subtitle">Device cost</span>
                  <div className="device-summary-token-list">
                    {loadoutCostRows.map((entry) => (
                      <span key={entry.key} className={`device-summary-token${entry.affordable ? "" : " device-summary-token-alert"}`}>{entry.label}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="device-summary-panel">
              <span className="device-summary-panel-title">Reward profile</span>
              <div className="device-summary-metric-grid">
                {summaryRows.map((row) => (
                  <div key={row.label} className="device-summary-metric">
                    <span className="device-summary-metric-label">{row.label}</span>
                    <span className={`device-summary-metric-value device-summary-metric-value-${row.tone}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="device-summary-column">
            <div className="device-summary-panel">
              <span className="device-summary-panel-title">Projected rewards</span>
              <div className="device-summary-token-list">
                {rewardPreview
                  ? Object.entries(rewardPreview.rewards).map(([currencyId, amount]) => {
                      const definition = currencyMap[currencyId as keyof typeof currencyMap];
                      return <span key={currencyId} className="device-summary-token">{formatCurrencyValue(amount ?? 0)} {definition?.shortLabel ?? currencyId}</span>;
                    })
                  : <span className="device-summary-token">-</span>}
              </div>
              <div className="device-summary-footnote">Wealth floor ~{formatCurrencyValue(rewardPreview?.economyFloorValue ?? 0)} value. Projected total ~{formatCurrencyValue(rewardPreview?.totalRewardValue ?? 0)}.</div>
            </div>

            {(rewardPreview?.encounterNotes.length ?? 0) > 0 && (
              <div className="device-summary-panel">
                <span className="device-summary-panel-title">Tradeoffs and notes</span>
                <div className="device-summary-notes">
                  {rewardPreview?.encounterNotes.map((note) => <span key={note}>{note}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-full device-commit-button" disabled={!canCommit || !loadoutAffordable} onClick={onCommit}>
          {getCommitLabel(hasActiveMap, hasQueuedMap, canCommit, loadoutAffordable)}
        </button>
      </section>
    </div>
  );
}
