import { memo, useMemo, useState } from "react";
import { formatMs, formatPercent, formatSignedPercent } from "@/components/maps/mapFormatting";
import { currencyMap, formatCurrencyValue, type CurrencyState } from "@/game/currencies";
import {
  LOADOUT_MAX_SLOTS,
  canAddModToLoadout,
  deviceModMap,
  deviceModPool,
  getDeviceModDeltas,
  getModCategoryDescription,
  getModCategoryLabel,
  getModTierColor,
  getModTierLabel,
  type DeviceLoadout,
  type DeviceModCategory,
} from "@/game/mapDevice";
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
} from "@/game/maps";

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
  const [activeCategory, setActiveCategory] = useState<DeviceModCategory>("reward");
  const encounter = getMapEncounter(craftedMap.encounterId);
  const appliedMods = loadout.modIds.map((modId) => deviceModMap[modId]).filter(Boolean);
  const openSlots = LOADOUT_MAX_SLOTS - loadout.modIds.length;
  const mapCostRows = resolvedCost ? formatCostEntries(resolvedCost, currencies) : [];
  const loadoutCostRows = formatCostEntries(loadoutCost, currencies);
  const availableMods = useMemo(() => deviceModPool.filter((definition) => definition.category === activeCategory), [activeCategory]);

  const summaryRows = [
    { label: "Base rewards", value: formatSignedPercent(rewardMult - 1), tone: rewardMult >= 1 ? "good" : "bad" },
    {
      label: "Focused rewards",
      value: Object.keys(mapDef.focusedRewardWeights).length > 0 ? formatSignedPercent(focusedRewardMult - 1) : "No focused pool",
      tone: focusedRewardMult >= 1 ? "good" : "neutral",
    },
    { label: "Shard chance", value: formatPercent(shardChance), tone: shardChance >= 0.02 ? "good" : "neutral" },
    { label: "Run time", value: resolvedDuration ? formatMs(resolvedDuration) : "-", tone: "neutral" },
  ] as const;

  const panelCard = "grid gap-2 p-3.5 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-border-subtle";
  const shellCard = "grid gap-4 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]";
  const eyebrow = "m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]";
  const stageTitle = "m-0 text-[1.05rem] font-extrabold text-[#f7f3e8]";
  const badge = "px-2.5 py-[5px] rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[0.66rem] font-extrabold text-[#b8c5d8] uppercase tracking-[0.05em]";
  const badgeActive = "bg-[rgba(139,233,253,0.12)] !border-[rgba(139,233,253,0.24)] !text-[#a8ecff]";
  const btnSm = "px-2 py-1 border border-[rgba(255,211,106,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-gold bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(255,211,106,0.1)] hover:not-disabled:border-[rgba(255,211,106,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed";
  const subcopy = "text-[0.72rem] leading-[1.45] text-[#95a3b9]";
  const tokenPill = "px-2 py-1 rounded-full bg-[rgba(255,255,255,0.05)] text-[0.66rem] font-bold text-[#b6c4d7]";

  return (
    <div className="grid gap-4">
      <section className={shellCard}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={eyebrow}>Step 1</p>
            <h3 className={stageTitle}>Choose target and shape the map</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={badge}>{getRarityLabel(craftedMap.rarity)}</span>
            <span className={badge}>Tier {craftedMap.tier}</span>
            {encounter && <span className={`${badge} ${badgeActive}`}>{encounter.name}</span>}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(260px,0.65fr)_minmax(0,1.35fr)] gap-3.5">
          <div className={panelCard}>
            <div className="flex items-center gap-2">
              <span className="text-[0.9rem] font-bold" style={{ color: getRarityColor(craftedMap.rarity) }}>
                {getRarityLabel(craftedMap.rarity)} {mapDef.name}
              </span>
              <span className="text-[0.7rem] text-text-secondary">{mapDef.family} route</span>
            </div>
            <p className={subcopy}>{mapDef.description}</p>
            <div className="text-[0.72rem] leading-[1.45] text-[#b8c5d8]">Build around the encounter first, then use crafting to sharpen that run target.</div>
          </div>

          <div className={`${panelCard} !gap-2.5`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.78rem] font-bold text-accent-gold">Run target</span>
              <span className="text-[0.68rem] text-[#8c8c94]">Pick the encounter goal that matches the kind of return you want.</span>
            </div>
            <div className="grid gap-1.5">
              <button
                type="button"
                className={`grid gap-1 w-full px-2.5 py-2 border rounded-[10px] text-left text-[#d5d5dc] cursor-pointer hover:not-disabled:bg-[rgba(255,255,255,0.04)]${craftedMap.encounterId === null ? " border-[rgba(255,211,106,0.28)] bg-[rgba(255,211,106,0.07)]" : " border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"}`}
                onClick={() => onSelectEncounter(null)}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.78rem] font-bold text-text-bright">No encounter</span>
                  <span className="text-[0.66rem] text-[#9aa2b2]">Stable baseline</span>
                </div>
                <span className="text-[0.7rem] text-[#92929a] leading-[1.35]">Simple payout profile with no extra cost or route pressure.</span>
              </button>
              {mapEncounters.map((entry) => {
                const unlocked = isMapEncounterUnlocked(entry, encounterProgression);
                const selected = craftedMap.encounterId === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`grid gap-1 w-full px-2.5 py-2 border rounded-[10px] text-left text-[#d5d5dc] cursor-pointer hover:not-disabled:bg-[rgba(255,255,255,0.04)]${selected ? " border-[rgba(255,211,106,0.28)] bg-[rgba(255,211,106,0.07)]" : " border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"}${!unlocked ? " opacity-45" : ""}`}
                    disabled={!unlocked}
                    onClick={() => onSelectEncounter(entry.id)}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[0.78rem] font-bold text-text-bright">{entry.name}</span>
                      <span className="text-[0.66rem] text-[#9aa2b2]">{formatSignedPercent(entry.rewardMultiplier)} reward, {formatSignedPercent(entry.durationMultiplier)} time</span>
                    </div>
                    <span className="text-[0.7rem] text-[#92929a] leading-[1.35]">{unlocked ? entry.description : getMapEncounterUnlockText(entry)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`${panelCard} !gap-3`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[0.78rem] font-bold text-accent-gold">Map crafting</span>
              <span className="text-[0.68rem] text-[#8c8c94]"> Use a small number of crafting actions to set the tone of the run before touching device mods.</span>
            </div>
          </div>

          {craftedMap.affixIds.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
              {craftedMap.affixIds.map((affixId) => (
                <div key={affixId} className={panelCard}>
                  <span className="text-[0.8rem] font-bold text-[#edf0f6]">{getAffixDisplayName(affixId)}</span>
                  <span className="text-[0.7rem] text-[#8fa0b9]">{getAffixDescription(affixId)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[0.73rem] text-text-muted italic">No affixes yet. Crafting sets the map's baseline identity before device mods push it toward speed, payout, or shard pressure.</p>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
            {(["transmute", "augment", "alter", "regal", "chaos", "alchemy", "exalt"] as CraftingAction[]).map((action) => {
              const isAvailable = availableActions.includes(action);
              const affordable = canAffordCraft(currencies, action);
              const canUse = isAvailable && affordable;

              return (
                <button
                  key={action}
                  type="button"
                  className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] cursor-pointer text-text-primary transition-all duration-100 min-w-[70px] hover:not-disabled:bg-[rgba(255,255,255,0.1)] hover:not-disabled:border-[rgba(255,255,255,0.22)] disabled:opacity-35 disabled:cursor-default`}
                  disabled={!canUse}
                  onClick={() => onCraft(action)}
                  title={craftingActionDescriptions[action]}
                >
                  <span className="text-[0.78rem] font-semibold">{craftingActionLabels[action]}</span>
                  <span className={subcopy}>{craftingActionDescriptions[action]}</span>
                  <span className="text-[0.65rem] text-text-secondary flex flex-col items-center gap-px">
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

      <section className={shellCard}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={eyebrow}>Step 2</p>
            <h3 className={stageTitle}>Socket device mods</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={badge}>{loadout.modIds.length}/{LOADOUT_MAX_SLOTS} slots used</span>
            {openSlots > 0 && <span className={badge}>{openSlots} open</span>}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2.5">
          {Array.from({ length: LOADOUT_MAX_SLOTS }, (_, index) => {
            const definition = appliedMods[index];
            return (
              <div key={index} className={`${panelCard}${definition ? " bg-gradient-to-b from-[rgba(244,213,140,0.08)] to-[rgba(255,255,255,0.03)] !border-[rgba(244,213,140,0.18)]" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[0.75rem] font-extrabold text-[#edf0f6]">Slot {index + 1}</span>
                  {definition && <span className="text-[0.64rem] font-extrabold uppercase tracking-[0.05em]" style={{ color: getModTierColor(definition.tier) }}>{getModTierLabel(definition.tier)}</span>}
                </div>
                {definition ? (
                  <>
                    <div className="text-[0.88rem] font-extrabold text-[#f7f3e8]">{definition.name}</div>
                    <div className={subcopy}>{definition.summary}</div>
                    <button type="button" className={btnSm} onClick={() => onRemoveMod(definition.id)}>Remove</button>
                  </>
                ) : (
                  <>
                    <div className="text-[0.88rem] font-extrabold text-[#f7f3e8]">Empty slot</div>
                    <div className={subcopy}>Choose a mod category below, then socket one of its cards here.</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {modCategories.map((category) => {
              const count = deviceModPool.filter((definition) => definition.category === category).length;
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={`grid gap-0.5 px-3 py-2.5 rounded-[14px] border text-left cursor-pointer${active ? " border-[rgba(244,213,140,0.24)] bg-[rgba(244,213,140,0.08)] text-[#f4d58c]" : " border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#b8c5d8]"}`}
                  onClick={() => setActiveCategory(category)}
                >
                  <span className="text-[0.76rem] font-extrabold">{getModCategoryLabel(category)}</span>
                  <span className="text-[0.68rem] text-[#8fa0b9]">{count} mods</span>
                </button>
              );
            })}
          </div>

          <div className={panelCard}>
            <span className="text-[0.75rem] font-extrabold text-[#edf0f6]">{getModCategoryLabel(activeCategory)}</span>
            <span className="text-[0.68rem] text-[#8fa0b9]">{getModCategoryDescription(activeCategory)}</span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-2.5">
            {availableMods.map((definition) => {
              const alreadyAdded = loadout.modIds.includes(definition.id);
              const canAdd = canAddModToLoadout(loadout, definition.id);
              const deltas = getDeviceModDeltas(definition);
              return (
                <div key={definition.id} className={`${panelCard}${alreadyAdded ? " !border-[rgba(88,217,139,0.24)] bg-gradient-to-b from-[rgba(88,217,139,0.1)] to-[rgba(255,255,255,0.03)]" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[0.88rem] font-extrabold text-[#f7f3e8]">{definition.name}</span>
                        <span className="text-[0.64rem] font-extrabold uppercase tracking-[0.05em]" style={{ color: getModTierColor(definition.tier) }}>{getModTierLabel(definition.tier)}</span>
                      </div>
                      <div className={subcopy}>{definition.summary}</div>
                    </div>
                    <span className="text-[0.64rem] font-extrabold uppercase tracking-[0.05em]">{getModCategoryLabel(definition.category)}</span>
                  </div>

                  <p className={`m-0 ${subcopy}`}>{definition.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {deltas.map((delta) => (
                      <span key={`${definition.id}-${delta.type}`} className={`${tokenPill}${delta.value > 0 ? " !text-[#9ef0bf]" : " !text-[#ff9a9a]"}`}>
                        {delta.label}: {formatSignedPercent(delta.value)}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-end justify-between gap-2.5">
                    <span className={subcopy}>{definition.playstyle}</span>
                    <button type="button" className={btnSm} disabled={!canAdd || alreadyAdded} onClick={() => onAddMod(definition.id)}>
                      {alreadyAdded ? "Socketed" : canAdd ? "Socket" : "No slots"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`${shellCard} !gap-3.5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={eyebrow}>Step 3</p>
            <h3 className={stageTitle}>Review outcome and commit</h3>
          </div>
          {runBonuses.encounterChain > 0 && <span className={`${badge} ${badgeActive}`}>Chain {runBonuses.encounterChain}</span>}
        </div>

        {runBonuses.encounterChain > 0 && (
          <div className="px-2.5 py-2 rounded-lg bg-[rgba(139,233,253,0.08)] border border-[rgba(139,233,253,0.16)] text-[0.7rem] text-[#a7ebff]">
            Expedition chain {runBonuses.encounterChain}: +{Math.round(runBonuses.encounterChain * 6)}% reward, +{(runBonuses.encounterChain * 0.15).toFixed(2)}% shard chance
          </div>
        )}

        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
          <div className="grid gap-3">
            <div className={panelCard}>
              <span className="text-[0.75rem] font-extrabold text-[#edf0f6]">Costs</span>
              <div className="flex flex-wrap gap-2">
                {mapCostRows.length > 0 ? mapCostRows.map((entry) => (
                  <span key={entry.key} className={`${tokenPill}${entry.affordable ? "" : " !text-[#ff9a9a]"}`}>{entry.label}</span>
                )) : <span className={tokenPill}>-</span>}
              </div>
              {loadoutCostRows.length > 0 && (
                <>
                  <span className="text-[0.64rem] font-extrabold uppercase tracking-[0.05em]">Device cost</span>
                  <div className="flex flex-wrap gap-2">
                    {loadoutCostRows.map((entry) => (
                      <span key={entry.key} className={`${tokenPill}${entry.affordable ? "" : " !text-[#ff9a9a]"}`}>{entry.label}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={panelCard}>
              <span className="text-[0.75rem] font-extrabold text-[#edf0f6]">Reward profile</span>
              <div className="grid gap-2">
                {summaryRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="text-[0.68rem] text-[#8fa0b9]">{row.label}</span>
                    <span className={`text-[0.75rem] font-extrabold${row.tone === "good" ? " text-[#9ef0bf]" : row.tone === "bad" ? " text-[#ff9a9a]" : ""}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className={panelCard}>
              <span className="text-[0.75rem] font-extrabold text-[#edf0f6]">Projected rewards</span>
              <div className="flex flex-wrap gap-2">
                {rewardPreview
                  ? Object.entries(rewardPreview.rewards).map(([currencyId, amount]) => {
                      const definition = currencyMap[currencyId as keyof typeof currencyMap];
                      return <span key={currencyId} className={tokenPill}>{formatCurrencyValue(amount ?? 0)} {definition?.shortLabel ?? currencyId}</span>;
                    })
                  : <span className={tokenPill}>-</span>}
              </div>
              <div className={subcopy}>Wealth floor ~{formatCurrencyValue(rewardPreview?.economyFloorValue ?? 0)} value. Projected total ~{formatCurrencyValue(rewardPreview?.totalRewardValue ?? 0)}.</div>
            </div>

            {(rewardPreview?.encounterNotes.length ?? 0) > 0 && (
              <div className={panelCard}>
                <span className="text-[0.75rem] font-extrabold text-[#edf0f6]">Tradeoffs and notes</span>
                <div className="flex flex-wrap gap-2">
                  {rewardPreview?.encounterNotes.map((note) => <span key={note}>{note}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        <button type="button" className="w-full mt-1 px-3 py-1.5 border border-transparent rounded-md text-[0.78rem] font-bold text-bg-surface bg-gradient-to-b from-gradient-gold-start to-gradient-gold-end cursor-pointer transition-all duration-100 hover:not-disabled:from-[#ffe08a] hover:not-disabled:to-[#ebb730] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed" disabled={!canCommit || !loadoutAffordable} onClick={onCommit}>
          {getCommitLabel(hasActiveMap, hasQueuedMap, canCommit, loadoutAffordable)}
        </button>
      </section>
    </div>
  );
});
