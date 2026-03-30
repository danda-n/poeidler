import { memo } from "react";
import { currencyMap, formatCurrencyValue, type CurrencyState } from "@/game/currencies";
import { baseMaps, isMapUnlocked } from "@/game/maps";

type MapBaseSelectorProps = {
  currencies: CurrencyState;
  selectedBaseMapId: string | null;
  onSelectBase: (baseMapId: string) => void;
};

export const MapBaseSelector = memo(function MapBaseSelector({ currencies, selectedBaseMapId, onSelectBase }: MapBaseSelectorProps) {
  return (
    <div className="grid gap-1.5">
      {baseMaps.map((mapDef) => {
        const unlocked = isMapUnlocked(mapDef, currencies);
        const isSelected = selectedBaseMapId === mapDef.id;

        return (
          <button
            key={mapDef.id}
            type="button"
            className={`w-full text-left px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-border-subtle cursor-pointer transition-all duration-150 grid gap-1 hover:not-disabled:bg-[rgba(255,255,255,0.06)] hover:not-disabled:border-[rgba(255,255,255,0.14)]${isSelected ? " !border-[rgba(255,211,106,0.4)] !bg-[rgba(255,211,106,0.05)]" : ""}${!unlocked ? " opacity-40 cursor-default" : ""}`}
            disabled={!unlocked}
            onClick={() => onSelectBase(mapDef.id)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.86rem] font-semibold text-text-bright">{unlocked ? mapDef.name : "???"}</span>
              <span className="text-[0.65rem] uppercase tracking-[0.05em] text-text-secondary px-[5px] py-0.5 rounded bg-[rgba(255,255,255,0.05)]">Tier {mapDef.tier}</span>
            </div>
            {unlocked && <p className="m-0 text-[0.72rem] text-[#999] leading-[1.3]">{mapDef.description}</p>}
            {unlocked && <p className="text-[0.7rem] text-text-secondary">Targets ~{mapDef.baseRewardSeconds}s of current production with a wealth floor that scales with your stash.</p>}
            {!unlocked && (
              <p className="m-0 text-[0.75rem] text-text-secondary">
                Requires {formatCurrencyValue(mapDef.unlockRequirement.amount)} {currencyMap[mapDef.unlockRequirement.currencyId]?.shortLabel}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
});
