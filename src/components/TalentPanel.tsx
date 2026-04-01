import { formatCurrencyValue } from "@/game/currencies";
import { TalentGraph } from "@/components/talents/TalentGraph";
import { useGameStore } from "@/store/useGameStore";
import { useActions } from "@/store/selectors/useActions";

export function TalentPanel() {
  const mirrorShards = useGameStore((s) => s.prestige.mirrorShards);
  const talentsPurchased = useGameStore((s) => s.talentsPurchased);
  const { purchaseTalent: onPurchaseTalent } = useActions();

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="shrink-0 flex items-center justify-end">
        <span className="text-[0.74rem] font-semibold text-accent-purple">{formatCurrencyValue(mirrorShards)} Mirror Shards</span>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <TalentGraph
          talentsPurchased={talentsPurchased}
          mirrorShards={mirrorShards}
          onPurchaseTalent={onPurchaseTalent}
        />
      </div>
    </div>
  );
}
