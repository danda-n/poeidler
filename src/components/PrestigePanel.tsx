import { useState } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import { calculatePrestigeShards, canPrestige } from "@/game/prestige";
import { getEncounterPrestigeBonus } from "@/game/talents";
import { useGameStore } from "@/store/useGameStore";
import { useActions } from "@/store/selectors/useActions";

export function PrestigePanel() {
  const currencies = useGameStore((s) => s.currencies);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);
  const prestige = useGameStore((s) => s.prestige);
  const talentsPurchased = useGameStore((s) => s.talentsPurchased);
  const { prestige: onPrestige } = useActions();
  const [confirming, setConfirming] = useState(false);

  const eligible = canPrestige(currencies);
  const crackedMirrorRank = talentsPurchased.crackedMirror ?? 0;
  const encounterBonusMultiplier = getEncounterPrestigeBonus(talentsPurchased);
  const projectedShards = calculatePrestigeShards(
    currencies,
    unlockedCurrencies,
    prestige.mapsCompleted,
    prestige.encounterMapsCompleted,
    crackedMirrorRank,
    encounterBonusMultiplier,
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
    <div className="grid gap-3.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="m-0 text-base font-bold text-accent-purple">Prestige</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-[1.1rem] font-bold text-accent-purple">{formatCurrencyValue(prestige.mirrorShards)}</span>
          <span className="text-[0.72rem] text-text-secondary">Mirror Shards</span>
        </div>
      </div>

      <div className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.03)] grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.78rem] text-[#999]">Prestige Count</span>
          <span className="text-[0.82rem] font-semibold text-text-primary">{prestige.prestigeCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[0.78rem] text-[#999]">Total Shards Earned</span>
          <span className="text-[0.82rem] font-semibold text-text-primary">{formatCurrencyValue(prestige.totalMirrorShards)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[0.78rem] text-[#999]">Maps This Run</span>
          <span className="text-[0.82rem] font-semibold text-text-primary">{prestige.mapsCompleted}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[0.78rem] text-[#999]">Encounter Maps</span>
          <span className="text-[0.82rem] font-semibold text-text-primary">{prestige.encounterMapsCompleted}</span>
        </div>
      </div>

      <div className="px-3.5 py-3 rounded-[10px] bg-[rgba(189,147,249,0.06)] border border-[rgba(189,147,249,0.15)] flex items-center justify-between">
        <span className="text-[0.82rem] font-semibold text-accent-purple">Projected Gain</span>
        <span className={`text-[0.88rem] font-bold${projectedShards > 0 ? " text-accent-purple" : " text-text-secondary"}`}>
          +{formatCurrencyValue(projectedShards)} Mirror Shards
        </span>
      </div>

      <div className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.02)] text-[0.75rem]">
        <p className="m-0 mb-1 font-semibold text-accent-red">Resets:</p>
        <ul className="m-0 pl-[18px] text-[#999] leading-[1.6]">
          <li>All currencies</li>
          <li>All generators</li>
          <li>All upgrades</li>
          <li>Active map</li>
        </ul>
        <p className="mt-2 mb-1 font-semibold text-accent-green">Keeps:</p>
        <ul className="m-0 pl-[18px] text-[#999] leading-[1.6]">
          <li>Mirror Shards</li>
          <li>Purchased talents</li>
          {(talentsPurchased.lingeringWealth ?? 0) > 0 && <li>Small % of lower currencies</li>}
        </ul>
      </div>

      <div className="grid gap-2">
        {confirming ? (
          <>
            <span className="text-[0.82rem] font-semibold text-accent-red text-center">Reset run for +{formatCurrencyValue(projectedShards)} shards?</span>
            <div className="flex gap-2 justify-center">
              <button type="button" className="px-3 py-1.5 border border-[rgba(238,85,85,0.2)] rounded-md text-[0.78rem] font-semibold text-accent-red bg-transparent cursor-pointer transition-all duration-100 hover:bg-[rgba(238,85,85,0.1)] hover:border-[rgba(238,85,85,0.35)] active:scale-[0.97]" onClick={handlePrestige}>
                Confirm Prestige
              </button>
              <button type="button" className="px-3 py-1.5 border border-[rgba(255,211,106,0.2)] rounded-md text-[0.78rem] font-semibold text-accent-gold bg-transparent cursor-pointer transition-all duration-100 hover:bg-[rgba(255,211,106,0.1)] hover:border-[rgba(255,211,106,0.35)] active:scale-[0.97]" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="w-full px-3 py-1.5 border border-transparent rounded-md text-[0.78rem] font-bold text-bg-surface bg-gradient-to-b from-[#d4a3ff] to-[#9b59d6] cursor-pointer transition-all duration-100 hover:not-disabled:bg-gradient-to-b hover:not-disabled:from-[#deb3ff] hover:not-disabled:to-[#a96de0] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
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
