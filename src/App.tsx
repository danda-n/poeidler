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
import { useGameEngine } from "@/hooks/useGameEngine";

export function App() {
  const { gameState, actions } = useGameEngine();
  const [activePage, setActivePage] = useState<PageId>("home");
  const appView = useAppViewModel(gameState);
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const hasScrolledBetweenPagesRef = useRef(false);

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
        <div className="section-enter">
          <UpgradePanel
            currenciesState={gameState.currencies}
            purchasedUpgrades={gameState.purchasedUpgrades}
            unlockedCurrencies={gameState.unlockedCurrencies}
            prestige={gameState.prestige}
            onBuyUpgrade={actions.buyUpgrade}
          />
        </div>
      );
    }

    if (activePage === "mapDevice" && appView.hasTier4) {
      return (
        <MapsScreen
          currencies={gameState.currencies}
          currencyProduction={gameState.currencyProduction}
          activeMap={gameState.activeMap}
          lastMapResult={gameState.lastMapResult}
          prestige={gameState.prestige}
          talentsPurchased={gameState.talentsPurchased}
          purchasedUpgrades={gameState.purchasedUpgrades}
          queuedMap={gameState.queuedMap}
          onCraftMap={actions.craftMap}
          onStartMap={actions.startMap}
          onQueueMap={actions.queueMap}
          onCancelQueue={actions.cancelQueue}
        />
      );
    }

    if (activePage === "progress" && (appView.hasPrestige || appView.hasTalents)) {
      return (
        <ProgressScreen
          currencies={gameState.currencies}
          unlockedCurrencies={gameState.unlockedCurrencies}
          prestige={gameState.prestige}
          talentsPurchased={gameState.talentsPurchased}
          onPrestige={actions.prestige}
          onPurchaseTalent={actions.purchaseTalent}
        />
      );
    }

    return (
      <CurrencyScreen
        currencies={gameState.currencies}
        currencyProduction={gameState.currencyProduction}
        clickMultiplier={gameState.clickMultiplier}
        generatorsOwned={gameState.generatorsOwned}
        unlockedCurrencies={gameState.unlockedCurrencies}
        buyMaxEnabled={gameState.unlockedFeatures.buyMax}
        prestige={gameState.prestige}
        activeMapLabel={appView.mapStatusLabel}
        totalProductionValue={appView.topStripState.totalProductionValue}
        onGenerateFragment={actions.generateFragment}
        onBuyGenerator={actions.buyGenerator}
        onConvertCurrency={actions.manualConvert}
        onNavigate={setActivePage}
      />
    );
  }, [activePage, actions, appView.hasAnyGenerator, appView.hasPrestige, appView.hasTalents, appView.hasTier4, appView.mapStatusLabel, appView.topStripState.totalProductionValue, gameState]);

  return (
    <>
      <AppShell
        ref={mainScrollRef}
        brandTitle="PoE Idle"
        statusText={gameState.lastSaveTime ? `Saved ${new Date(gameState.lastSaveTime).toLocaleTimeString()}` : "Autosave active"}
        pageTitle={activePageCopy.title}
        pageDescription={activePageCopy.description}
        contentWidth={activeContentWidth}
        headerActions={
          <SettingsPanel version={gameState.settings.version} lastSaveTime={gameState.lastSaveTime} onResetSave={actions.resetSave} />
        }
        topBar={
          <TopStatusStrip
            items={appView.topStripState.items}
            totalWealthValue={appView.topStripState.totalWealthValue}
            totalProductionValue={appView.topStripState.totalProductionValue}
            hiddenCount={appView.topStripState.hiddenCount}
          />
        }
        sidebar={<Sidebar activePage={activePage} unlockedPages={appView.unlockedPages} pageMeta={appView.pageMeta} onNavigate={setActivePage} />}
        footer={<footer className="game-footer">v{gameState.settings.version}</footer>}
      >
        <ActiveMapBanner
          activeMap={gameState.activeMap}
          queuedMap={gameState.queuedMap}
          lastMapResult={gameState.lastMapResult}
          prestige={gameState.prestige}
          mapsUnlocked={appView.hasTier4}
        />
        {activePageContent}
      </AppShell>

      <MapToast notification={gameState.mapNotification} />
    </>
  );
}
