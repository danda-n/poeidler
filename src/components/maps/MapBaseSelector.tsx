import { baseMaps, isMapUnlocked } from "../../game/maps";
import { currencyMap, formatCurrencyValue, type CurrencyState } from "../../game/currencies";

type MapBaseSelectorProps = {
  currencies: CurrencyState;
  selectedBaseMapId: string | null;
  onSelectBase: (baseMapId: string) => void;
};

export function MapBaseSelector({ currencies, selectedBaseMapId, onSelectBase }: MapBaseSelectorProps) {
  return (
    <div className="map-base-list">
      {baseMaps.map((mapDef) => {
        const unlocked = isMapUnlocked(mapDef, currencies);
        const isSelected = selectedBaseMapId === mapDef.id;

        return (
          <button
            key={mapDef.id}
            type="button"
            className={`map-base-card${isSelected ? " map-base-card-selected" : ""}${!unlocked ? " map-base-card-locked" : ""}`}
            disabled={!unlocked}
            onClick={() => onSelectBase(mapDef.id)}
          >
            <div className="map-base-card-header">
              <span className="map-base-card-name">{unlocked ? mapDef.name : "???"}</span>
              <span className="map-base-card-family">Tier {mapDef.tier}</span>
            </div>
            {unlocked && <p className="map-base-card-desc">{mapDef.description}</p>}
            {unlocked && <p className="map-base-card-subcopy">Targets ~{mapDef.baseRewardSeconds}s of current production with a wealth floor that scales with your stash.</p>}
            {!unlocked && (
              <p className="map-card-lock-hint">
                Requires {formatCurrencyValue(mapDef.unlockRequirement.amount)} {currencyMap[mapDef.unlockRequirement.currencyId]?.shortLabel}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
