import { memo } from "react";
import { MapPanel } from "@/components/MapPanel";
import { formatCurrencyValue } from "@/game/currencies";
import { useGameStore } from "@/store/useGameStore";

export const MapsScreen = memo(function MapsScreen() {
  const prestige = useGameStore((s) => s.prestige);

  return (
    <div className="grid gap-4 animate-[section-enter_350ms_ease-out]">
      <section className="grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)] content-start">
        <div className="flex items-stretch justify-between gap-3">
          <div>
            <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Atlas</p>
            <h2 className="m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]">Prepare maps in a dedicated flow</h2>
            <p className="mt-1.5 mb-0 max-w-[640px] text-[0.76rem] text-[#98a5b9]">
              Shape the route, set encounter intent, and commit a smaller set of meaningful device choices without crowding the stash screen.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(3,minmax(88px,1fr))] gap-2.5 min-w-[min(300px,100%)]">
            <div className="grid gap-0.5 px-3 py-2.5 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-border-subtle">
              <span className="m-0 text-[0.95rem] font-extrabold text-[#f7f3e8]">{prestige.mapsCompleted}</span>
              <span className="text-[0.64rem] font-extrabold tracking-[0.08em] uppercase text-[#7f8ca3]">Maps</span>
            </div>
            <div className="grid gap-0.5 px-3 py-2.5 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-border-subtle">
              <span className="m-0 text-[0.95rem] font-extrabold text-[#f7f3e8]">{prestige.encounterMapsCompleted}</span>
              <span className="text-[0.64rem] font-extrabold tracking-[0.08em] uppercase text-[#7f8ca3]">Encounters</span>
            </div>
            <div className="grid gap-0.5 px-3 py-2.5 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-border-subtle">
              <span className="m-0 text-[0.95rem] font-extrabold text-[#f7f3e8]">{formatCurrencyValue(prestige.mirrorShards)}</span>
              <span className="text-[0.64rem] font-extrabold tracking-[0.08em] uppercase text-[#7f8ca3]">Shards</span>
            </div>
          </div>
        </div>
      </section>

      <MapPanel />
    </div>
  );
});
