import { formatCurrencyValue } from "@/game/currencies";
import {
  canPurchaseTalent,
  getBranchIcon,
  getBranchLabel,
  getTalentCost,
  getTalentsByBranch,
  isTalentAvailable,
  talentBranches,
  talentMap,
} from "@/game/talents";
import { useGameStore } from "@/store/useGameStore";
import { useActions } from "@/store/selectors/useActions";

export function TalentPanel() {
  const mirrorShards = useGameStore((s) => s.prestige.mirrorShards);
  const talentsPurchased = useGameStore((s) => s.talentsPurchased);
  const { purchaseTalent: onPurchaseTalent } = useActions();
  return (
    <div className="grid gap-3.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="m-0 text-base font-bold text-accent-gold">Talents</h2>
        <span className="text-[0.82rem] font-semibold text-accent-purple">{formatCurrencyValue(mirrorShards)} Mirror Shards</span>
      </div>

      <div className="grid gap-3.5">
        {talentBranches.map((branch) => {
          const branchTalents = getTalentsByBranch(branch);
          return (
            <div key={branch} className="grid gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-overlay">
                <span className="text-[0.9rem]">{getBranchIcon(branch)}</span>
                <span className="text-[0.82rem] font-bold text-text-primary uppercase tracking-[0.04em]">{getBranchLabel(branch)}</span>
              </div>
              <div className="grid gap-1">
                {branchTalents.map((talent) => {
                  const rank = talentsPurchased[talent.id] ?? 0;
                  const maxed = rank >= talent.maxRank;
                  const available = isTalentAvailable(talent, talentsPurchased);
                  const affordable = canPurchaseTalent(talent, talentsPurchased, mirrorShards);
                  const cost = getTalentCost(talent, rank);

                  return (
                    <div key={talent.id} className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] transition-colors duration-150${maxed ? " !border-[rgba(80,250,123,0.2)] !bg-[rgba(80,250,123,0.04)]" : !available ? " opacity-40" : affordable ? " border-[rgba(189,147,249,0.2)] hover:bg-[rgba(189,147,249,0.06)]" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.82rem] font-semibold text-text-bright">{talent.name}</span>
                          <span className="text-[0.7rem] font-semibold text-text-secondary px-[5px] py-px rounded bg-[rgba(255,255,255,0.06)]">
                            {rank}/{talent.maxRank}
                          </span>
                        </div>
                        <p className="mt-0.5 mb-0 text-[0.72rem] text-[#999] leading-[1.3]">{talent.description}</p>
                      </div>
                      {!maxed && available && (
                        <button
                          type="button"
                          className="shrink-0 px-2 py-1 border border-[rgba(189,147,249,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-purple bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(189,147,249,0.1)] hover:not-disabled:border-[rgba(189,147,249,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
                          disabled={!affordable}
                          onClick={() => onPurchaseTalent(talent.id)}
                        >
                          {formatCurrencyValue(cost)} Shards
                        </button>
                      )}
                      {maxed && <span className="shrink-0 text-[0.72rem] font-bold text-accent-green uppercase tracking-[0.05em]">MAX</span>}
                      {!available && !maxed && talent.prerequisite && (
                        <span className="shrink-0 text-[0.68rem] text-text-secondary italic">Requires: {talentMap[talent.prerequisite]?.name ?? talent.prerequisite}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
