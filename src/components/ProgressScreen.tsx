import { memo, useMemo } from "react";
import { formatCurrencyValue, type CurrencyState, type UnlockedCurrencyState } from "@/game/currencies";
import type { PrestigeState } from "@/game/prestige";
import type { TalentPurchasedState } from "@/game/talents";
import { PrestigeScreen } from "@/components/screens/progress/PrestigeScreen";
import { TalentsScreen } from "@/components/screens/progress/TalentsScreen";

type ProgressScreenProps = {
  currencies: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  onPrestige: () => void;
  onPurchaseTalent: (talentId: string) => void;
};

export const ProgressScreen = memo(function ProgressScreen({
  currencies,
  unlockedCurrencies,
  prestige,
  talentsPurchased,
  onPrestige,
  onPurchaseTalent,
}: ProgressScreenProps) {
  const progressStats = useMemo(
    () => [
      { label: "Prestiges", value: String(prestige.prestigeCount) },
      { label: "Maps completed", value: String(prestige.mapsCompleted) },
      { label: "Encounter maps", value: String(prestige.encounterMapsCompleted) },
      { label: "Mirror shards", value: formatCurrencyValue(prestige.mirrorShards) },
      { label: "Total shards", value: formatCurrencyValue(prestige.totalMirrorShards) },
    ],
    [
      prestige.encounterMapsCompleted,
      prestige.mapsCompleted,
      prestige.mirrorShards,
      prestige.prestigeCount,
      prestige.totalMirrorShards,
    ],
  );

  return (
    <div className="progress-screen section-enter">
      <section className="shell-card">
        <div className="shell-card-header">
          <div>
            <p className="shell-card-eyebrow">Run summary</p>
            <h2 className="shell-card-title">Long-term progression at a glance</h2>
          </div>
        </div>
        <div className="progress-stat-grid">
          {progressStats.map((stat) => (
            <div key={stat.label} className="progress-stat-card">
              <span className="progress-stat-value">{stat.value}</span>
              <span className="progress-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="progress-layout">
        <PrestigeScreen
          currencies={currencies}
          unlockedCurrencies={unlockedCurrencies}
          prestige={prestige}
          talentsPurchased={talentsPurchased}
          onPrestige={onPrestige}
        />
        <TalentsScreen
          mirrorShards={prestige.mirrorShards}
          talentsPurchased={talentsPurchased}
          onPurchaseTalent={onPurchaseTalent}
        />
      </div>
    </div>
  );
});
