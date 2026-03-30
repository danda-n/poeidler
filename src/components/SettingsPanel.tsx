import { useEffect, useRef, useState } from "react";
import { useActions } from "@/store/selectors/useActions";
import { useSettings } from "@/store/selectors/useSettings";

export function SettingsPanel() {
  const { version, lastSaveTime } = useSettings();
  const { resetSave } = useActions();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const saveLabel = lastSaveTime ? `Saved ${new Date(lastSaveTime).toLocaleTimeString()}` : "Not saved yet";

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button className="flex items-center justify-center w-8 h-8 border border-[rgba(255,255,255,0.08)] rounded-lg bg-bg-overlay text-text-secondary cursor-pointer text-[1.1rem] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-[#ccc]" type="button" onClick={() => setIsOpen((v) => !v)} aria-label="Settings">
        &#9881;
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 min-w-[200px] p-3 border border-[rgba(255,255,255,0.08)] rounded-xl bg-bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[100] grid gap-2">
          <p className="text-[0.78rem] text-text-secondary m-0">{saveLabel}</p>
          <p className="text-[0.78rem] text-text-secondary m-0">Version {version}</p>
          <button
            className="w-full px-2 py-1 border border-[rgba(238,85,85,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-red bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(238,85,85,0.1)] hover:not-disabled:border-[rgba(238,85,85,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
            type="button"
            onClick={() => {
              if (window.confirm("Reset all progress? This cannot be undone.")) {
                resetSave();
                setIsOpen(false);
              }
            }}
          >
            Reset Save
          </button>
        </div>
      )}
    </div>
  );
}
