import { memo } from "react";
import { useGameStore } from "@/store/useGameStore";

export const FragmentToast = memo(function FragmentToast() {
  const notification = useGameStore((s) => s.questState.fragmentNotification);

  if (!notification) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border-2 border-[rgba(189,147,249,0.4)] bg-[rgba(14,18,24,0.96)] shadow-[0_0_40px_rgba(189,147,249,0.2)] animate-[pop-in_400ms_ease-out] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-[1rem]">🗺️</span>
        <span className="text-accent-purple text-[0.82rem] font-extrabold tracking-wide">MAP FRAGMENT</span>
      </div>
    </div>
  );
});
