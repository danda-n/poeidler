import { memo } from "react";
import { PrestigePanel } from "@/components/PrestigePanel";
import type { CurrencyState, UnlockedCurrencyState } from "@/game/currencies";
import type { PrestigeState } from "@/game/prestige";
import type { TalentPurchasedState } from "@/game/talents";

type PrestigeScreenProps = {
  currencies: CurrencyState;
  unlockedCurrencies: UnlockedCurrencyState;
  prestige: PrestigeState;
  talentsPurchased: TalentPurchasedState;
  onPrestige: () => void;
};

export const PrestigeScreen = memo(function PrestigeScreen(props: PrestigeScreenProps) {
  return (
    <section className="shell-card progress-panel-card">
      <div className="screen-section-heading">
        <p className="shell-card-eyebrow">Prestige</p>
        <h3 className="screen-section-title">Reset when the shard swing is worth it</h3>
      </div>
      <PrestigePanel {...props} />
    </section>
  );
});
