import { memo } from "react";
import { questMap } from "@/game/quests";
import { useGameStore } from "@/store/useGameStore";

function getRewardSummary(questId: string): string {
  const quest = questMap[questId];
  if (!quest) return "";
  return quest.rewards
    .map((r) => {
      switch (r.type) {
        case "mapFragment": return `+${r.amount} Map Fragment`;
        case "permanentClickBonus": return `+${Math.round(r.value * 100)}% Click`;
        case "permanentGeneratorSpeed": return `+${Math.round(r.value * 100)}% Speed`;
        case "unlockFeature": return r.feature === "upgrades" ? "Upgrades Unlocked" : r.feature === "mapDevice" ? "Map Device Unlocked" : r.feature;
        case "autoGenerator": return `+${r.amount} Generator`;
        default: return "";
      }
    })
    .filter(Boolean)
    .join(" · ");
}

export const QuestToast = memo(function QuestToast() {
  const notification = useGameStore((s) => s.questState.questNotification);

  if (!notification) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border border-[rgba(244,213,140,0.3)] bg-[rgba(14,18,24,0.95)] shadow-[0_8px_32px_rgba(244,213,140,0.15)] animate-[toast-in_400ms_ease-out] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-accent-gold text-[0.7rem] font-bold">Quest Complete!</span>
        <span className="text-[0.68rem] text-text-bright">{notification.title}</span>
      </div>
      <div className="text-[0.6rem] text-text-secondary mt-0.5">{getRewardSummary(notification.questId)}</div>
    </div>
  );
});
