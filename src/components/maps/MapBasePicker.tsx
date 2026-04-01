import { memo } from "react";
import { currencyMap, formatCurrencyValue, type CurrencyState } from "@/game/currencies";
import { baseMaps, isMapUnlocked } from "@/game/maps";

type MapBasePickerProps = {
  currencies: CurrencyState;
  selectedBaseMapId: string | null;
  onSelectBase: (baseMapId: string) => void;
};

export const MapBasePicker = memo(function MapBasePicker({ currencies, selectedBaseMapId, onSelectBase }: MapBasePickerProps) {
  return (
    <div className="flex gap-2">
      {baseMaps.map((mapDef) => {
        const unlocked = isMapUnlocked(mapDef, currencies);
        const isSelected = selectedBaseMapId === mapDef.id;

        return (
          <button
            key={mapDef.id}
            type="button"
            className={`flex-1 text-center px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150 hover:not-disabled:bg-[rgba(255,255,255,0.06)] disabled:opacity-35 disabled:cursor-not-allowed ${
              isSelected
                ? "border-[rgba(255,211,106,0.4)] bg-[rgba(255,211,106,0.08)]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)]"
            }`}
            disabled={!unlocked}
            onClick={() => onSelectBase(mapDef.id)}
          >
            <div className="text-[0.72rem] font-bold text-text-bright">{unlocked ? mapDef.name : "???"}</div>
            <div className="text-[0.58rem] text-text-secondary">
              {unlocked ? `Tier ${mapDef.tier}` : `${formatCurrencyValue(mapDef.unlockRequirement.amount)} ${currencyMap[mapDef.unlockRequirement.currencyId]?.shortLabel}`}
            </div>
          </button>
        );
      })}
    </div>
  );
});
