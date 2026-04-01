import { useEffect, useMemo, useRef, useState } from "react";
import { useAppViewModel, pageCopy } from "@/components/app/useAppViewModel";
import { ActiveMapBanner } from "@/components/ActiveMapBanner";
import { AppShell } from "@/components/AppShell";
import { MapToast } from "@/components/MapToast";
import { ProgressScreen } from "@/components/ProgressScreen";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Sidebar, type PageId } from "@/components/Sidebar";
import { TopStatusStrip } from "@/components/TopStatusStrip";
import { UpgradePanel } from "@/components/UpgradePanel";
import { CurrencyScreen } from "@/components/screens/CurrencyScreen";
import { MapsScreen } from "@/components/screens/MapsScreen";
import { useGameStore } from "@/store/useGameStore";
import { startStoreGameLoop, startStoreAutosave, stopStoreGameLoop } from "@/store/gameStore";

export function App() {
  const [activePage, setActivePage] = useState<PageId>("home");
  const appView = useAppViewModel();
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const hasScrolledBetweenPagesRef = useRef(false);
  const lastSaveTime = useGameStore((s) => s.lastSaveTime);
  const version = useGameStore((s) => s.settings.version);

  useEffect(() => {
    startStoreGameLoop();
    startStoreAutosave();
    return () => stopStoreGameLoop();
  }, []);

  useEffect(() => {
    if (activePage !== "home" && !appView.unlockedPages[activePage]) {
      setActivePage("home");
    }
  }, [activePage, appView.unlockedPages]);

  useEffect(() => {
    if (!hasScrolledBetweenPagesRef.current) {
      hasScrolledBetweenPagesRef.current = true;
      return;
    }

    mainScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  const activePageCopy = pageCopy[activePage];
  const activeContentWidth = activePage === "home" ? "default" : "wide";
  const activePageContent = useMemo(() => {
    if (activePage === "upgrades" && appView.hasAnyGenerator) {
      return (
        <div className="animate-[section-enter_350ms_ease-out]">
          <UpgradePanel />
        </div>
      );
    }

    if (activePage === "mapDevice" && appView.hasTier4) {
      return <MapsScreen />;
    }

    if (activePage === "progress" && (appView.hasPrestige || appView.hasTalents)) {
      return <ProgressScreen />;
    }

    return <CurrencyScreen onNavigate={setActivePage} />;
  }, [activePage, appView.hasAnyGenerator, appView.hasPrestige, appView.hasTalents, appView.hasTier4]);

  return (
    <>
      <AppShell
        ref={mainScrollRef}
        brandTitle="PoE Idle"
        statusText={lastSaveTime ? `Saved ${new Date(lastSaveTime).toLocaleTimeString()}` : "Autosave active"}
        pageTitle={activePageCopy.title}
        pageDescription={activePageCopy.description}
        contentWidth={activeContentWidth}
        headerActions={<SettingsPanel />}
        topBar={<TopStatusStrip />}
        sidebar={<Sidebar activePage={activePage} onNavigate={setActivePage} />}
        footer={<footer className="mt-1.5 flex items-center justify-start gap-4 pl-0.5 text-[0.68rem] text-[#667389]">v{version}</footer>}
      >
        <ActiveMapBanner mapsUnlocked={appView.hasTier4} />
        {activePageContent}
      </AppShell>

      <MapToast />
    </>
  );
}
