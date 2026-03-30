import { memo, useMemo } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import { PrestigeScreen } from "@/components/screens/progress/PrestigeScreen";
import { TalentsScreen } from "@/components/screens/progress/TalentsScreen";
import { useGameStore } from "@/store/useGameStore";

export const ProgressScreen = memo(function ProgressScreen() {
  const prestige = useGameStore((s) => s.prestige);
  const progressStats = useMemo(
    () => [
      { label: "Prestiges", value: String(prestige.prestigeCount) },
      { label: "Maps completed", value: String(prestige.mapsCompleted) },
      { label: "Encounter maps", value: String(prestige.encounterMapsCompleted) },
      { label: "Mirror shards", value: formatCurrencyValue(prestige.mirrorShards) },
      { label: "Total shards", value: formatCurrencyValue(prestige.totalMirrorShards) },
    ],
    [
      prestige.encounterMapsCompleted,
      prestige.mapsCompleted,
      prestige.mirrorShards,
      prestige.prestigeCount,
      prestige.totalMirrorShards,
    ],
  );

  return (
    <div className="grid gap-4 animate-[section-enter_350ms_ease-out]">
      <section className="grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Run summary</p>
            <h2 className="m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]">Long-term progression at a glance</h2>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2.5">
          {progressStats.map((stat) => (
            <div key={stat.label} className="grid gap-1 p-3 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-border-subtle">
              <span className="text-[0.96rem] font-extrabold text-[#f7f3e8]">{stat.value}</span>
              <span className="text-[0.7rem] text-[#93a0b4] uppercase tracking-[0.06em]">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] gap-4">
        <PrestigeScreen />
        <TalentsScreen />
      </div>
    </div>
  );
});
