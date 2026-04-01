import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrencyValue } from "@/game/currencies";

type PrestigeOverlayProps = {
  projectedShards: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PrestigeOverlay({ projectedShards, onConfirm, onCancel }: PrestigeOverlayProps) {
  const [phase, setPhase] = useState<"enter" | "visible">("enter");

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("visible"));
    return () => cancelAnimationFrame(id);
  }, []);

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        phase === "visible" ? "bg-black/80 backdrop-blur-md" : "bg-black/0 backdrop-blur-none"
      }`}
      onClick={onCancel}
    >
      <div
        className={`max-w-[420px] w-full mx-4 grid gap-5 p-8 rounded-2xl bg-bg-surface border border-[rgba(189,147,249,0.25)] shadow-[0_0_80px_rgba(189,147,249,0.15)] text-center transition-all duration-500 ${
          phase === "visible" ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-2">
          <span className="text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-accent-purple">Prestige</span>
          <h2 className="m-0 text-[1.4rem] font-extrabold text-[#f7f3e8]">Your legacy echoes...</h2>
        </div>

        <div className="grid gap-1 py-3">
          <span className="text-[2.2rem] font-extrabold text-accent-purple leading-none animate-[pulse_2s_ease-in-out_infinite]">
            +{formatCurrencyValue(projectedShards)}
          </span>
          <span className="text-[0.82rem] text-text-secondary">Mirror Shards</span>
        </div>

        <div className="grid gap-1 text-[0.72rem] text-text-secondary">
          <span className="text-accent-red font-semibold">Resets: currencies, generators, upgrades, active map</span>
          <span className="text-accent-green font-semibold">Keeps: Mirror Shards, talents</span>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            className="px-5 py-2 border border-transparent rounded-lg text-[0.85rem] font-bold text-bg-surface bg-gradient-to-b from-[#d4a3ff] to-[#9b59d6] cursor-pointer transition-all duration-100 hover:from-[#deb3ff] hover:to-[#a96de0] active:scale-[0.97]"
            onClick={onConfirm}
          >
            Confirm Prestige
          </button>
          <button
            type="button"
            className="px-5 py-2 border border-border-default rounded-lg text-[0.85rem] font-semibold text-text-secondary bg-transparent cursor-pointer transition-all duration-100 hover:text-text-primary hover:border-border-default active:scale-[0.97]"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
