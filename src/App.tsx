import { useEffect, useMemo, useState } from "react";
import { useAppViewModel } from "@/components/app/useAppViewModel";
import { NewAppShell } from "@/components/layout/NewAppShell";
import type { PageId } from "@/components/layout/NavRail";
import { MapToast } from "@/components/MapToast";
import { QuestToast } from "@/components/quest/QuestToast";
import { FragmentToast } from "@/components/quest/FragmentToast";
import { ProgressView } from "@/components/progress/ProgressView";
import { ProductionView } from "@/components/production/ProductionView";
import { SettingsPanel } from "@/components/SettingsPanel";
import { UpgradePanel } from "@/components/UpgradePanel";
import { MapsScreen } from "@/components/screens/MapsScreen";
import { startStoreGameLoop, startStoreAutosave, stopStoreGameLoop } from "@/store/gameStore";

export function App() {
  const [activePage, setActivePage] = useState<PageId>("home");
  const appView = useAppViewModel();

  useEffect(() => {
    startStoreGameLoop();
    startStoreAutosave();
    return () => stopStoreGameLoop();
  }, []);

  useEffect(() => {
    if (activePage !== "home" && activePage !== "settings" && !appView.unlockedPages[activePage]) {
      setActivePage("home");
    }
  }, [activePage, appView.unlockedPages]);

  const activePageContent = useMemo(() => {
    if (activePage === "settings") {
      return <SettingsPanel />;
    }

    if (activePage === "upgrades" && appView.hasUpgrades) {
      return (
        <div className="h-full animate-[section-enter_350ms_ease-out]">
          <UpgradePanel />
        </div>
      );
    }

    if (activePage === "mapDevice" && appView.hasMapDevice) {
      return <MapsScreen />;
    }

    if (activePage === "progress" && (appView.hasPrestige || appView.hasTalents)) {
      return <ProgressView />;
    }

    return <ProductionView />;
  }, [activePage, appView.hasUpgrades, appView.hasMapDevice, appView.hasPrestige, appView.hasTalents]);

  return (
    <>
      <NewAppShell activePage={activePage} onNavigate={setActivePage}>
        {activePageContent}
      </NewAppShell>
      <MapToast />
      <QuestToast />
      <FragmentToast />
    </>
  );
}
