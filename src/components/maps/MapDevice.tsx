import { memo, useMemo } from "react";
import { formatMs, formatPercent, formatSignedPercent } from "@/components/maps/mapFormatting";
import {
  getAffixDisplayName,
  getMapEncounter,
  getRarityColor,
  getRarityLabel,
  type BaseMapDefinition,
  type CraftedMap,
} from "@/game/maps";

type MapDeviceProps = {
  mapDef: BaseMapDefinition;
  craftedMap: CraftedMap;
  rewardMult: number;
  shardChance: number;
  resolvedDuration: number | null;
};

export const MapDevice = memo(function MapDevice({
  mapDef,
  craftedMap,
  rewardMult,
  shardChance,
  resolvedDuration,
}: MapDeviceProps) {
  const encounter = getMapEncounter(craftedMap.encounterId);

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      {/* Central device visual */}
      <div className="relative w-[240px] px-4 py-3 rounded-2xl border-2 border-[rgba(244,213,140,0.25)] bg-gradient-to-b from-[rgba(244,213,140,0.08)] to-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(244,213,140,0.06)]">
        <span className="text-[0.56rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Map Device</span>
        <span className="text-[0.78rem] font-bold text-center whitespace-nowrap" style={{ color: getRarityColor(craftedMap.rarity) }}>
          {getRarityLabel(craftedMap.rarity)} {mapDef.name}
        </span>
        <div className="flex items-center gap-2 text-[0.56rem] text-text-secondary">
          <span>T{craftedMap.tier}</span>
          {encounter && <span className="text-accent-gold">{encounter.name}</span>}
          {craftedMap.affixIds.length > 0 && <span>{craftedMap.affixIds.length} affix{craftedMap.affixIds.length !== 1 ? "es" : ""}</span>}
        </div>
      </div>

      {/* Affix badges */}
      {craftedMap.affixIds.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {craftedMap.affixIds.map((affixId) => (
            <span
              key={affixId}
              className="text-[0.58rem] px-1.5 py-px rounded-full bg-[rgba(192,160,255,0.1)] text-[#c0a0ff] border border-[rgba(192,160,255,0.18)]"
            >
              {getAffixDisplayName(affixId)}
            </span>
          ))}
        </div>
      )}

      {/* Quick stats */}
      <div className="flex items-center gap-4 text-[0.6rem] text-text-secondary">
        <span>Reward {formatSignedPercent(rewardMult - 1)}</span>
        <span>Shard {formatPercent(shardChance)}</span>
        {resolvedDuration && <span>{formatMs(resolvedDuration)}</span>}
      </div>
    </div>
  );
});
