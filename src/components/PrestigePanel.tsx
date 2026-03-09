import { useState } from "react";
import { formatCurrencyValue, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import { canPrestige, calculatePrestigeShards, type PrestigeState } from "../game/prestige";
import type { TalentPurchasedState } from "../game/talents";

type PrestigePanelProps = {
  currencies: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  onPrestige: () => void;
};

function PrestigePanel({ currencies, unlockedCurrencies, prestige, talentsPurchased, onPrestige }: PrestigePanelProps) {
  const [confirming, setConfirming] = useState(false);

  const eligible = canPrestige(currencies);
  const crackedMirrorRank = talentsPurchased.crackedMirror ?? 0;
  const projectedShards = calculatePrestigeShards(
    currencies,
    unlockedCurrencies,
    prestige.mapsCompleted,
    crackedMirrorRank,
  );

  function handlePrestige() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onPrestige();
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <div className="prestige-panel">
      <div className="prestige-header">
        <h2 className="prestige-title">Prestige</h2>
        <div className="prestige-shards">
          <span className="prestige-shard-value">{formatCurrencyValue(prestige.mirrorShards)}</span>
          <span className="prestige-shard-label">Mirror Shards</span>
        </div>
      </div>

      <div className="prestige-info">
        <div className="prestige-stat-row">
          <span className="prestige-stat-label">Prestige Count</span>
          <span className="prestige-stat-value">{prestige.prestigeCount}</span>
        </div>
        <div className="prestige-stat-row">
          <span className="prestige-stat-label">Total Shards Earned</span>
          <span className="prestige-stat-value">{formatCurrencyValue(prestige.totalMirrorShards)}</span>
        </div>
        <div className="prestige-stat-row">
          <span className="prestige-stat-label">Maps This Run</span>
          <span className="prestige-stat-value">{prestige.mapsCompleted}</span>
        </div>
      </div>

      <div className="prestige-projected">
        <span className="prestige-projected-label">Projected Gain</span>
        <span className={`prestige-projected-value${projectedShards > 0 ? " prestige-projected-positive" : ""}`}>
          +{formatCurrencyValue(projectedShards)} Mirror Shards
        </span>
      </div>

      <div className="prestige-reset-info">
        <p className="prestige-reset-label">Resets:</p>
        <ul className="prestige-reset-list">
          <li>All currencies</li>
          <li>All generators</li>
          <li>All upgrades</li>
          <li>Active map</li>
        </ul>
        <p className="prestige-keep-label">Keeps:</p>
        <ul className="prestige-keep-list">
          <li>Mirror Shards</li>
          <li>Purchased talents</li>
          {(talentsPurchased.lingeringWealth ?? 0) > 0 && (
            <li>Small % of lower currencies</li>
          )}
        </ul>
      </div>

      <div className="prestige-actions">
        {confirming ? (
          <>
            <span className="prestige-confirm-text">
              Reset run for +{formatCurrencyValue(projectedShards)} shards?
            </span>
            <div className="prestige-confirm-buttons">
              <button type="button" className="btn btn-danger" onClick={handlePrestige}>
                Confirm Prestige
              </button>
              <button type="button" className="btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-prestige btn-full"
            disabled={!eligible || projectedShards <= 0}
            onClick={handlePrestige}
          >
            {eligible ? `Prestige for +${formatCurrencyValue(projectedShards)} Shards` : "Not enough progress to prestige"}
          </button>
        )}
      </div>
    </div>
  );
}

export default PrestigePanel;
