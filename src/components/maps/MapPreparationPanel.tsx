import {
  MAP_BALANCE,
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
  addModToLoadout,
  canAddModToLoadout,
  deviceModMap,
  deviceModPool,
  getLoadoutTotalCost,
  getModTierColor,
  getModTierLabel,
  removeModFromLoadout,
  type DeviceLoadout,
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
  const encounter = getMapEncounter(craftedMap.encounterId);

  return (
    <div className="map-prep-layout">
      <section className="map-prep-card">
        <div className="map-craft-header">
          <span className="map-craft-rarity" style={{ color: getRarityColor(craftedMap.rarity) }}>
            {getRarityLabel(craftedMap.rarity)} {mapDef.name}
          </span>
          <span className="map-craft-tier">Tier {craftedMap.tier}</span>
        </div>

        <div className="map-encounter-section">
          <div className="map-encounter-header">
            <span className="map-encounter-title">Encounter</span>
            <span className="map-encounter-copy">Choose the route goal before you spend on crafting.</span>
          </div>
          <div className="map-encounter-list">
            <button
              type="button"
              className={`map-encounter-card${craftedMap.encounterId === null ? " map-encounter-card-selected" : ""}`}
              onClick={() => onSelectEncounter(null)}
            >
              <span className="map-encounter-name">No encounter</span>
              <span className="map-encounter-desc">Stable baseline rewards with no extra cost or route pressure.</span>
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
            {craftedMap.affixIds.map((affixId) => (
              <div key={affixId} className="map-affix-row">
                <span className="map-affix-name">{getAffixDisplayName(affixId)}</span>
                <span className="map-affix-desc">{getAffixDescription(affixId)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="map-affix-empty">No affixes yet. Stronger rolls now matter more because reward floors scale with total wealth.</p>
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
                onClick={() => onCraft(action)}
                title={craftingActionDescriptions[action]}
              >
                <span className="btn-craft-label">{craftingActionLabels[action]}</span>
                <span className="btn-craft-cost">
                  {Object.entries(cost).map(([currencyId, amount]) => (
                    <span key={currencyId}>{amount} {currencyMap[currencyId as keyof typeof currencyMap]?.shortLabel ?? currencyId}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="map-prep-card">
        <div className="device-loadout">
          <div className="device-loadout-header">
            <span className="device-loadout-title">Device Mods</span>
            <span className="device-loadout-count">{loadout.modIds.length}/{LOADOUT_MAX_SLOTS} slots</span>
          </div>

          {loadout.modIds.length > 0 && (
            <div className="device-loadout-selected">
              {loadout.modIds.map((modId) => {
                const definition = deviceModMap[modId];
                if (!definition) return null;
                return (
                  <div key={modId} className="device-loadout-chip">
                    <span className="device-loadout-chip-name" style={{ color: getModTierColor(definition.tier) }}>{definition.name}</span>
                    <span className="device-loadout-chip-desc">{definition.description}</span>
                    <button type="button" className="device-loadout-chip-remove" onClick={() => onRemoveMod(modId)} title="Remove">x</button>
                  </div>
                );
              })}
            </div>
          )}

          {loadout.modIds.length < LOADOUT_MAX_SLOTS && (
            <div className="device-loadout-pool">
              {deviceModPool.map((definition) => {
                const alreadyAdded = loadout.modIds.includes(definition.id);
                const canAdd = canAddModToLoadout(loadout, definition.id);
                return (
                  <div key={definition.id} className={`device-pool-row${alreadyAdded ? " device-pool-row-added" : ""}`}>
                    <div className="device-pool-row-info">
                      <span className="device-pool-row-name" style={{ color: getModTierColor(definition.tier) }}>{definition.name}</span>
                      <span className="device-pool-row-tier">{getModTierLabel(definition.tier)}</span>
                      <span className="device-pool-row-desc">{definition.description}</span>
                    </div>
                    {!alreadyAdded && (
                      <button type="button" className="btn btn-sm device-pool-add-btn" disabled={!canAdd} onClick={() => onAddMod(definition.id)}>
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="map-prep-card map-preview-card">
        <div className="map-preview-header-row">
          <span className="map-encounter-title">Run Preview</span>
          {encounter && <span className="map-encounter-inline">{encounter.name}</span>}
        </div>
        {runBonuses.encounterChain > 0 && (
          <div className="map-preview-callout">
            Expedition chain {runBonuses.encounterChain}: +{Math.round(runBonuses.encounterChain * 6)}% reward, +{(runBonuses.encounterChain * 0.15).toFixed(2)}% shard chance
          </div>
        )}
        <div className="map-craft-preview">
          <div className="map-preview-row">
            <span className="map-preview-label">Map cost</span>
            <span className="map-preview-value">
              {resolvedCost
                ? Object.entries(resolvedCost).map(([currencyId, amount]) => {
                    const definition = currencyMap[currencyId as keyof typeof currencyMap];
                    const hasEnough = Math.floor(currencies[currencyId as keyof CurrencyState]) >= (amount ?? 0);
                    return <span key={currencyId} style={{ color: hasEnough ? undefined : "#e05050" }}>{formatCurrencyValue(amount ?? 0)} {definition?.shortLabel ?? currencyId}</span>;
                  })
                : "-"}
            </span>
          </div>
          {loadout.modIds.length > 0 && (
            <div className="map-preview-row">
              <span className="map-preview-label">Mod cost</span>
              <span className="map-preview-value">
                {Object.entries(loadoutCost).map(([currencyId, amount]) => {
                  const definition = currencyMap[currencyId as keyof typeof currencyMap];
                  const hasEnough = Math.floor(currencies[currencyId as keyof CurrencyState]) >= (amount ?? 0);
                  return <span key={currencyId} style={{ color: hasEnough ? undefined : "#e05050" }}>{formatCurrencyValue(amount ?? 0)} {definition?.shortLabel ?? currencyId}</span>;
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
              {runBonuses.rewardBonus > 0 && <>, +{Math.round(runBonuses.rewardBonus * 100)}% planning</>}
            </span>
          </div>
          <div className="map-preview-row">
            <span className="map-preview-label">Wealth floor</span>
            <span className="map-preview-value">~{formatCurrencyValue(rewardPreview?.economyFloorValue ?? 0)} value</span>
          </div>
          <div className="map-preview-row">
            <span className="map-preview-label">Shard chance</span>
            <span className="map-preview-value" style={{ color: shardChance > 0.02 ? "#c0a0ff" : undefined }}>{formatPercent(shardChance)}</span>
          </div>
          <div className="map-preview-row">
            <span className="map-preview-label">Projected</span>
            <span className="map-preview-value map-preview-rewards">
              {rewardPreview
                ? Object.entries(rewardPreview.rewards).map(([currencyId, amount]) => {
                    const definition = currencyMap[currencyId as keyof typeof currencyMap];
                    return <span key={currencyId}>{formatCurrencyValue(amount ?? 0)} {definition?.shortLabel ?? currencyId}</span>;
                  })
                : "-"}
            </span>
          </div>
          <div className="map-preview-row">
            <span className="map-preview-label">Value</span>
            <span className="map-preview-value">{rewardPreview ? `~${formatCurrencyValue(rewardPreview.totalRewardValue)} total value` : "-"}</span>
          </div>
          {rewardPreview && rewardPreview.encounterNotes.length > 0 && (
            <div className="map-preview-notes">
              {rewardPreview.encounterNotes.map((note) => <span key={note}>{note}</span>)}
            </div>
          )}
        </div>

        <button type="button" className="btn btn-primary btn-full" disabled={!canCommit || !loadoutAffordable} onClick={onCommit}>
          {hasActiveMap ? (hasQueuedMap ? "Queue full" : "Queue for Next Run") : (!canCommit ? "Can't Afford" : "Run Map")}
        </button>
      </section>
    </div>
  );
}
