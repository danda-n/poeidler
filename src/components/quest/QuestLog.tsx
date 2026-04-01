import { memo } from "react";
import { createPortal } from "react-dom";
import { getQuestProgress, isQuestCompleted, isQuestUnlocked, isQuestVisible, quests, type QuestState } from "@/game/quests";

type QuestLogProps = {
  questState: QuestState;
  currencies: Record<string, number>;
  generatorsOwned: Record<string, number>;
  currencyProduction: Record<string, number>;
  purchasedUpgrades: Record<string, number>;
  unlockedCurrencies: Record<string, boolean>;
  mapFragments: number;
  onClose: () => void;
};

function getRewardLabel(reward: { type: string; value?: number; amount?: number; feature?: string; generatorId?: string }): string {
  switch (reward.type) {
    case "mapFragment": return `+${reward.amount} Map Fragment`;
    case "permanentClickBonus": return `+${Math.round((reward.value ?? 0) * 100)}% Click Power`;
    case "permanentGeneratorSpeed": return `+${Math.round((reward.value ?? 0) * 100)}% Generator Speed`;
    case "unlockFeature": return `Unlock ${reward.feature === "upgrades" ? "Upgrades" : reward.feature === "mapDevice" ? "Map Device" : reward.feature}`;
    case "autoGenerator": return `+${reward.amount} Generator`;
    default: return "Reward";
  }
}

export const QuestLog = memo(function QuestLog({
  questState,
  currencies,
  generatorsOwned,
  currencyProduction,
  purchasedUpgrades,
  unlockedCurrencies,
  mapFragments,
  onClose,
}: QuestLogProps) {
  const visibleQuests = quests.filter((q) => isQuestVisible(questState, q));
  const hiddenCount = quests.length - visibleQuests.length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[480px] max-h-[70vh] bg-bg-base border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[section-enter_250ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <span className="text-[0.82rem] font-bold text-text-bright">Quests</span>
          <button
            type="button"
            className="text-[0.7rem] text-text-secondary hover:text-text-primary cursor-pointer bg-transparent border-none"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid gap-1.5">
          {visibleQuests.map((quest) => {
            const completed = isQuestCompleted(questState, quest.id);
            const active = questState.activeQuestId === quest.id;
            const unlocked = isQuestUnlocked(questState, quest);

            const progress = active
              ? getQuestProgress(quest.condition, currencies, generatorsOwned, currencyProduction, purchasedUpgrades, unlockedCurrencies, mapFragments)
              : null;

            return (
              <div
                key={quest.id}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  completed
                    ? "border-[rgba(80,250,123,0.2)] bg-[rgba(80,250,123,0.04)]"
                    : active
                      ? "border-[rgba(244,213,140,0.25)] bg-[rgba(244,213,140,0.06)]"
                      : unlocked
                        ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"
                        : "border-[rgba(255,255,255,0.05)] bg-transparent opacity-40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {completed && <span className="text-accent-green text-[0.7rem]">✓</span>}
                    <span className={`text-[0.72rem] font-semibold ${completed ? "text-accent-green" : active ? "text-accent-gold" : "text-text-bright"}`}>
                      {quest.title}
                    </span>
                  </div>
                  {progress && (
                    <span className="text-[0.6rem] text-text-secondary tabular-nums shrink-0">
                      {progress.current}/{progress.target}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {quest.rewards.map((reward, i) => (
                    <span key={i} className="text-[0.58rem] px-1.5 py-px rounded-full bg-[rgba(255,255,255,0.05)] text-text-secondary">
                      {getRewardLabel(reward)}
                    </span>
                  ))}
                </div>
                {active && progress && (
                  <div className="mt-1.5 h-1 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-gold transition-[width] duration-200"
                      style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {hiddenCount > 0 && (
            <div className="px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.05)] text-center">
              <span className="text-[0.62rem] text-text-secondary">??? · {hiddenCount} more quest{hiddenCount !== 1 ? "s" : ""} to discover</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
});
