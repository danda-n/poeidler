import { formatCurrencyValue, currencyMap } from "../game/currencies";
import type { MapNotification } from "../game/maps";

type MapToastProps = {
  notification: MapNotification | null;
};

export function MapToast({ notification }: MapToastProps) {
  if (!notification) return null;

  const { result, mapName } = notification;

  return (
    <div className="map-toast">
      <div className="map-toast-header">
        <span className="map-toast-title">
          {mapName} complete
          {result.shardDropped && <span className="map-toast-shard-badge"> ✦ Shard!</span>}
          {result.bonusRewardTriggered && <span className="map-toast-bonus-badge"> Bonus!</span>}
        </span>
      </div>
      <div className="map-toast-rewards">
        {Object.entries(result.rewards).map(([cid, amount]) => {
          const def = currencyMap[cid as keyof typeof currencyMap];
          if (!amount || amount <= 0) return null;
          return (
            <span key={cid} className="map-toast-item">
              +{formatCurrencyValue(amount)} {def?.shortLabel ?? cid}
            </span>
          );
        })}
        {result.shardDropped && (
          <span className="map-toast-item map-toast-shard-item">+1 Mirror Shard</span>
        )}
      </div>
    </div>
  );
}
