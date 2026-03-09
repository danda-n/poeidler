import { formatCurrencyValue } from "../game/currencies";
import {
  talentBranches,
  talentMap,
  getTalentsByBranch,
  getTalentCost,
  canPurchaseTalent,
  isTalentAvailable,
  getBranchLabel,
  getBranchIcon,
  type TalentPurchasedState,
} from "../game/talents";

type TalentPanelProps = {
  mirrorShards: number;
  talentsPurchased: TalentPurchasedState;
  onPurchaseTalent: (talentId: string) => void;
};

function TalentPanel({ mirrorShards, talentsPurchased, onPurchaseTalent }: TalentPanelProps) {
  return (
    <div className="talent-panel">
      <div className="talent-panel-header">
        <h2 className="talent-panel-title">Talents</h2>
        <span className="talent-shard-display">
          {formatCurrencyValue(mirrorShards)} Mirror Shards
        </span>
      </div>

      <div className="talent-branches">
        {talentBranches.map((branch) => {
          const branchTalents = getTalentsByBranch(branch);
          return (
            <div key={branch} className="talent-branch">
              <div className="talent-branch-header">
                <span className="talent-branch-icon">{getBranchIcon(branch)}</span>
                <span className="talent-branch-name">{getBranchLabel(branch)}</span>
              </div>
              <div className="talent-node-list">
                {branchTalents.map((talent) => {
                  const rank = talentsPurchased[talent.id] ?? 0;
                  const maxed = rank >= talent.maxRank;
                  const available = isTalentAvailable(talent, talentsPurchased);
                  const affordable = canPurchaseTalent(talent, talentsPurchased, mirrorShards);
                  const cost = getTalentCost(talent, rank);

                  let nodeClass = "talent-node";
                  if (maxed) nodeClass += " talent-node-maxed";
                  else if (!available) nodeClass += " talent-node-locked";
                  else if (affordable) nodeClass += " talent-node-available";

                  return (
                    <div key={talent.id} className={nodeClass}>
                      <div className="talent-node-info">
                        <div className="talent-node-header">
                          <span className="talent-node-name">{talent.name}</span>
                          <span className="talent-node-rank">
                            {rank}/{talent.maxRank}
                          </span>
                        </div>
                        <p className="talent-node-desc">{talent.description}</p>
                      </div>
                      {!maxed && available && (
                        <button
                          type="button"
                          className="btn btn-sm btn-talent"
                          disabled={!affordable}
                          onClick={() => onPurchaseTalent(talent.id)}
                        >
                          {formatCurrencyValue(cost)} Shards
                        </button>
                      )}
                      {maxed && <span className="talent-node-maxed-label">MAX</span>}
                      {!available && !maxed && talent.prerequisite && (
                        <span className="talent-node-prereq">Requires: {talentMap[talent.prerequisite]?.name ?? talent.prerequisite}</span>
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

export default TalentPanel;
