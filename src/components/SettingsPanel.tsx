import { useActions } from "@/store/selectors/useActions";
import { useSettings } from "@/store/selectors/useSettings";

export function SettingsPanel() {
  const { version, lastSaveTime } = useSettings();
  const { resetSave } = useActions();
  const saveLabel = lastSaveTime ? `Saved ${new Date(lastSaveTime).toLocaleTimeString()}` : "Not saved yet";

  const detailCard = "grid gap-1 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-border-subtle";
  const metricLabel = "text-[0.66rem] font-extrabold tracking-[0.08em] uppercase text-[#75839a]";
  const metricValue = "text-[0.78rem] text-text-primary";

  return (
    <div className="h-full flex flex-col gap-4 animate-[section-enter_350ms_ease-out]">
      <div className="max-w-[480px] grid gap-3">
        <div className={detailCard}>
          <span className={metricLabel}>Save Status</span>
          <span className={metricValue}>{saveLabel}</span>
        </div>
        <div className={detailCard}>
          <span className={metricLabel}>Version</span>
          <span className={metricValue}>{version}</span>
        </div>
        <div className={detailCard}>
          <span className={metricLabel}>Danger Zone</span>
          <button
            className="w-fit px-3 py-1.5 border border-[rgba(238,85,85,0.2)] rounded-md text-[0.72rem] font-semibold text-accent-red bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(238,85,85,0.1)] hover:not-disabled:border-[rgba(238,85,85,0.35)] active:not-disabled:scale-[0.97]"
            type="button"
            onClick={() => {
              if (window.confirm("Reset all progress? This cannot be undone.")) {
                resetSave();
              }
            }}
          >
            Reset Save
          </button>
        </div>
      </div>
    </div>
  );
}
