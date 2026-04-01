import { memo, useMemo, useState } from "react";
import { QuestLog } from "@/components/quest/QuestLog";
import { getQuestProgress, questMap, quests, isQuestCompleted, isQuestVisible } from "@/game/quests";
import { useGameStore } from "@/store/useGameStore";

export const QuestBar = memo(function QuestBar() {
  const questState = useGameStore((s) => s.questState);
  const currencies = useGameStore((s) => s.currencies);
  const generatorsOwned = useGameStore((s) => s.generatorsOwned);
  const currencyProduction = useGameStore((s) => s.currencyProduction);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);
  const mapFragments = useGameStore((s) => s.mapFragments);

  const [showLog, setShowLog] = useState(false);

  const activeQuest = questState.activeQuestId ? questMap[questState.activeQuestId] : null;
  const hasAnyQuest = activeQuest || Object.keys(questState.completedQuests).length > 0;

  const progress = useMemo(() => {
    if (!activeQuest) return null;
    return getQuestProgress(
      activeQuest.condition,
      currencies,
      generatorsOwned,
      currencyProduction,
      purchasedUpgrades,
      unlockedCurrencies,
      mapFragments,
    );
  }, [activeQuest, currencies, generatorsOwned, currencyProduction, purchasedUpgrades, unlockedCurrencies, mapFragments]);

  if (!hasAnyQuest) return null;

  const completedCount = Object.keys(questState.completedQuests).length;
  const totalVisible = quests.filter((q) => isQuestVisible(questState, q)).length;

  return (
    <>
      <div
        className="shrink-0 flex items-center justify-between gap-3 px-3 py-1.5 border-b border-border-subtle bg-[rgba(244,213,140,0.03)] cursor-pointer hover:bg-[rgba(244,213,140,0.06)] transition-colors"
        onClick={() => setShowLog(true)}
      >
        {activeQuest ? (
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-[#7f8ca3] shrink-0">Quest</span>
            <span className="text-[0.68rem] font-semibold text-accent-gold truncate">{activeQuest.title}</span>
            {progress && (
              <span className="text-[0.62rem] text-text-secondary tabular-nums shrink-0">
                {progress.current}/{progress.target}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[0.62rem] text-text-secondary">All quests complete</span>
        )}
        <span className="text-[0.56rem] text-text-secondary shrink-0">{completedCount}/{totalVisible}</span>
      </div>

      {showLog && (
        <QuestLog
          questState={questState}
          currencies={currencies}
          generatorsOwned={generatorsOwned}
          currencyProduction={currencyProduction}
          purchasedUpgrades={purchasedUpgrades}
          unlockedCurrencies={unlockedCurrencies}
          mapFragments={mapFragments}
          onClose={() => setShowLog(false)}
        />
      )}
    </>
  );
});
