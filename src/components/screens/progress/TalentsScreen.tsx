import { memo } from "react";
import { TalentPanel } from "@/components/TalentPanel";

export const TalentsScreen = memo(function TalentsScreen() {
  return (
    <section className="grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)] content-start">
      <div className="grid gap-1">
        <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Talents</p>
        <h3 className="m-0 text-[0.95rem] font-extrabold text-[#f7f3e8]">Turn shards into long-term leverage</h3>
      </div>
      <TalentPanel />
    </section>
  );
});
