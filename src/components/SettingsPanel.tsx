import { useEffect, useRef, useState } from "react";

type SettingsPanelProps = {
  version: string;
  lastSaveTime: number | null;
  onResetSave: () => void;
};

function SettingsPanel({ version, lastSaveTime, onResetSave }: SettingsPanelProps) {
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
    <div className="settings-gear" ref={dropdownRef}>
      <button className="gear-button" type="button" onClick={() => setIsOpen((v) => !v)} aria-label="Settings">
        &#9881;
      </button>
      {isOpen && (
        <div className="settings-dropdown">
          <p className="settings-info">{saveLabel}</p>
          <p className="settings-info">Version {version}</p>
          <button
            className="btn btn-danger btn-sm btn-full"
            type="button"
            onClick={() => {
              if (window.confirm("Reset all progress? This cannot be undone.")) {
                onResetSave();
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

export default SettingsPanel;
