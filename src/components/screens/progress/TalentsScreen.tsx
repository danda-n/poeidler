import { memo } from "react";
import { TalentPanel } from "@/components/TalentPanel";
import type { TalentPurchasedState } from "@/game/talents";

type TalentsScreenProps = {
  mirrorShards: number;
  talentsPurchased: TalentPurchasedState;
  onPurchaseTalent: (talentId: string) => void;
};

export const TalentsScreen = memo(function TalentsScreen({
  mirrorShards,
  talentsPurchased,
  onPurchaseTalent,
}: TalentsScreenProps) {
  return (
    <section className="shell-card progress-panel-card">
      <div className="screen-section-heading">
        <p className="shell-card-eyebrow">Talents</p>
        <h3 className="screen-section-title">Turn shards into long-term leverage</h3>
      </div>
      <TalentPanel
        mirrorShards={mirrorShards}
        talentsPurchased={talentsPurchased}
        onPurchaseTalent={onPurchaseTalent}
      />
    </section>
  );
});
