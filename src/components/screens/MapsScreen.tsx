import { memo } from "react";
import { MapPanel } from "@/components/MapPanel";
import { formatCurrencyValue, type CurrencyProduction, type CurrencyState } from "@/game/currencies";
import type { CraftedMap, CraftingAction, ActiveMapState, MapCompletionResult, QueuedMapSetup } from "@/game/maps";
import type { DeviceLoadout } from "@/game/mapDevice";
import type { PrestigeState } from "@/game/prestige";
import type { PurchasedUpgradeState } from "@/game/upgradeEngine";
import type { TalentPurchasedState } from "@/game/talents";

type MapsScreenProps = {
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

export const MapsScreen = memo(function MapsScreen(props: MapsScreenProps) {
  const { prestige } = props;

  return (
    <div className="screen-stack section-enter">
      <section className="shell-card maps-screen-hero">
        <div className="shell-card-header maps-screen-hero-header">
          <div>
            <p className="shell-card-eyebrow">Atlas</p>
            <h2 className="shell-card-title">Prepare maps in a dedicated flow</h2>
            <p className="maps-screen-copy">
              Shape the route, set encounter intent, and commit a smaller set of meaningful device choices without crowding the stash screen.
            </p>
          </div>
          <div className="maps-screen-stat-row">
            <div className="maps-screen-stat">
              <span className="maps-screen-stat-value">{prestige.mapsCompleted}</span>
              <span className="maps-screen-stat-label">Maps</span>
            </div>
            <div className="maps-screen-stat">
              <span className="maps-screen-stat-value">{prestige.encounterMapsCompleted}</span>
              <span className="maps-screen-stat-label">Encounters</span>
            </div>
            <div className="maps-screen-stat">
              <span className="maps-screen-stat-value">{formatCurrencyValue(prestige.mirrorShards)}</span>
              <span className="maps-screen-stat-label">Shards</span>
            </div>
          </div>
        </div>
      </section>

      <MapPanel {...props} />
    </div>
  );
});
