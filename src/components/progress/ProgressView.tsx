import { memo, useState } from "react";
import { PrestigePanel } from "@/components/PrestigePanel";
import { TalentPanel } from "@/components/TalentPanel";
import { formatCurrencyValue } from "@/game/currencies";
import { useGameStore } from "@/store/useGameStore";

type SubTab = "prestige" | "talents";

export const ProgressView = memo(function ProgressView() {
  const prestige = useGameStore((s) => s.prestige);
  const [activeTab, setActiveTab] = useState<SubTab>("prestige");

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden animate-[section-enter_350ms_ease-out]">
      {/* Stats + tab toggle */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {(["prestige", "talents"] as SubTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-[0.72rem] font-semibold cursor-pointer transition-all duration-150 ${
                activeTab === tab
                  ? "border-[rgba(189,147,249,0.3)] bg-[rgba(189,147,249,0.12)] text-accent-purple"
                  : "border-border-subtle bg-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "prestige" ? "Prestige" : "Talents"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[0.68rem]">
          <span className="text-text-secondary"><span className="font-bold text-text-bright">{prestige.prestigeCount}</span> prestiges</span>
          <span className="text-text-secondary"><span className="font-bold text-text-bright">{prestige.mapsCompleted}</span> maps</span>
          <span className="text-text-secondary"><span className="font-bold text-accent-purple">{formatCurrencyValue(prestige.mirrorShards)}</span> shards</span>
          <span className="text-text-secondary"><span className="font-bold text-text-bright">{formatCurrencyValue(prestige.totalMirrorShards)}</span> total</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "prestige" ? <PrestigePanel /> : <TalentPanel />}
      </div>
    </div>
  );
});
