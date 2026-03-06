type SettingsPanelProps = {
  version: string;
  lastSaveTime: number | null;
  onResetSave: () => void;
};

function SettingsPanel({ version, lastSaveTime, onResetSave }: SettingsPanelProps) {
  const saveLabel = lastSaveTime ? `Last saved ${new Date(lastSaveTime).toLocaleTimeString()}` : "Not saved yet";

  return (
    <div className="settings-panel">
      <div className="settings-meta">
        <p className="settings-line">Save status: {saveLabel}</p>
        <p className="settings-line">Version: {version}</p>
      </div>
      <button className="reset-button" type="button" onClick={onResetSave}>
        Reset Save
      </button>
    </div>
  );
}

export default SettingsPanel;
