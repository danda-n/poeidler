import { formatCurrencyValue, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";
import type { PrestigeState } from "../game/prestige";
import type { TalentPurchasedState } from "../game/talents";
import PrestigePanel from "./PrestigePanel";
import TalentPanel from "./TalentPanel";

type ProgressScreenProps = {
  currencies: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  onPrestige: () => void;
  onPurchaseTalent: (talentId: string) => void;
};

export function ProgressScreen({
  currencies,
  unlockedCurrencies,
  prestige,
  talentsPurchased,
  onPrestige,
  onPurchaseTalent,
}: ProgressScreenProps) {
  const progressStats = [
    { label: "Prestiges", value: String(prestige.prestigeCount) },
    { label: "Maps completed", value: String(prestige.mapsCompleted) },
    { label: "Encounter maps", value: String(prestige.encounterMapsCompleted) },
    { label: "Mirror shards", value: formatCurrencyValue(prestige.mirrorShards) },
    { label: "Total shards", value: formatCurrencyValue(prestige.totalMirrorShards) },
  ];

  return (
    <div className="progress-screen">
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
        <section className="shell-card progress-panel-card">
          <PrestigePanel
            currencies={currencies}
            unlockedCurrencies={unlockedCurrencies}
            prestige={prestige}
            talentsPurchased={talentsPurchased}
            onPrestige={onPrestige}
          />
        </section>

        <section className="shell-card progress-panel-card">
          <TalentPanel mirrorShards={prestige.mirrorShards} talentsPurchased={talentsPurchased} onPurchaseTalent={onPurchaseTalent} />
        </section>
      </div>
    </div>
  );
}
