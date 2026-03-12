import { useEffect, useMemo, useState } from "react";
import { ActiveMapBanner } from "@/components/ActiveMapBanner";
import { AppShell } from "@/components/AppShell";
import { MapToast } from "@/components/MapToast";
import { ProgressScreen } from "@/components/ProgressScreen";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Sidebar, type PageId, type PageMeta } from "@/components/Sidebar";
import { TopStatusStrip } from "@/components/TopStatusStrip";
import { UpgradePanel } from "@/components/UpgradePanel";
import { CurrencyScreen } from "@/components/screens/CurrencyScreen";
import { MapsScreen } from "@/components/screens/MapsScreen";
import {
  fragmentCurrencyId,
  getTotalCurrencyValue,
  getTotalProductionValuePerSecond,
  getVisibleCurrencies,
} from "@/game/currencies";
import { generatorIds } from "@/game/generators";
import { canPrestige } from "@/game/prestige";
import { getAffordableUpgradeCount } from "@/game/upgradeEngine";
import { useGameEngine } from "@/hooks/useGameEngine";

const pageCopy: Record<PageId, { title: string; description: string }> = {
  home: {
    title: "Currency",
    description: "Run the core loop, monitor your stash, and keep the next few economy actions in one focused screen.",
  },
  upgrades: {
    title: "Upgrades",
    description: "Spend into production, routing, and long-term value once the base economy is online.",
  },
  mapDevice: {
    title: "Maps",
    description: "Choose a map, tune the device, and queue runs without crowding the rest of the game.",
  },
  progress: {
    title: "Progress",
    description: "Check run milestones, prestige readiness, and talent investments in one long-term screen.",
  },
};

export function App() {
  const { gameState, actions } = useGameEngine();
  const [activePage, setActivePage] = useState<PageId>("home");

  const hasAnyGenerator = useMemo(
    () => generatorIds.some((id) => gameState.generatorsOwned[id] > 0),
    [gameState.generatorsOwned],
  );
  const hasTier4 = gameState.unlockedCurrencies.alterationOrb;
  const hasPrestige =
    hasTier4 &&
    (gameState.prestige.prestigeCount > 0 || gameState.prestige.mapsCompleted >= 1 || gameState.currencies.jewellersOrb >= 1);
  const hasTalents = gameState.prestige.totalMirrorShards > 0;
  const canPrestigeNow = canPrestige(gameState.currencies);

  const unlockedPages = useMemo<Partial<Record<PageId, boolean>>>(
    () => ({
      upgrades: hasAnyGenerator,
      mapDevice: hasTier4,
      progress: hasPrestige || hasTalents,
    }),
    [hasAnyGenerator, hasPrestige, hasTalents, hasTier4],
  );

  useEffect(() => {
    if (activePage !== "home" && !unlockedPages[activePage]) {
      setActivePage("home");
    }
  }, [activePage, unlockedPages]);

  const affordableUpgradeCount = useMemo(
    () =>
      getAffordableUpgradeCount({
        currencies: gameState.currencies,
        purchasedUpgrades: gameState.purchasedUpgrades,
        unlockedCurrencies: gameState.unlockedCurrencies,
        prestige: gameState.prestige,
      }),
    [gameState.currencies, gameState.prestige, gameState.purchasedUpgrades, gameState.unlockedCurrencies],
  );

  const pageMeta = useMemo<Partial<Record<PageId, PageMeta>>>(
    () => ({
      upgrades: affordableUpgradeCount > 0 ? { badge: String(affordableUpgradeCount), tone: "ready" } : undefined,
      mapDevice: gameState.activeMap ? { badge: "Live", tone: "active" } : hasTier4 ? { badge: "Ready", tone: "active" } : undefined,
      progress: canPrestigeNow ? { badge: "Ready", tone: "alert" } : hasTalents ? { badge: "Talents", tone: "active" } : undefined,
    }),
    [affordableUpgradeCount, canPrestigeNow, gameState.activeMap, hasTalents, hasTier4],
  );

  const topStripState = useMemo(() => {
    const visibleCurrencies = getVisibleCurrencies(gameState.unlockedCurrencies);
    const wealthCandidates = visibleCurrencies.filter(
      (currency) =>
        currency.id === fragmentCurrencyId ||
        gameState.currencies[currency.id] > 0 ||
        gameState.currencyProduction[currency.id] > 0,
    );
    const prioritizedHighTier = wealthCandidates
      .filter((currency) => currency.id !== fragmentCurrencyId)
      .sort((left, right) => right.tier - left.tier)
      .slice(0, 4);
    const wealthBarIds = [fragmentCurrencyId, ...prioritizedHighTier.map((currency) => currency.id)];
    const items = visibleCurrencies
      .filter((currency) => wealthBarIds.includes(currency.id))
      .sort((left, right) => left.tier - right.tier)
      .map((currency) => ({
        id: currency.id,
        label: currency.shortLabel,
        icon: currency.icon,
        amount: gameState.currencies[currency.id],
        productionRate: gameState.currencyProduction[currency.id],
      }));

    return {
      items,
      hiddenCount: Math.max(0, wealthCandidates.filter((currency) => currency.id !== fragmentCurrencyId).length - prioritizedHighTier.length),
      totalWealthValue: getTotalCurrencyValue(gameState.currencies),
      totalProductionValue: getTotalProductionValuePerSecond(gameState.currencyProduction),
    };
  }, [gameState.currencies, gameState.currencyProduction, gameState.unlockedCurrencies]);

  const activePageCopy = pageCopy[activePage];
  const mapStatusLabel = gameState.activeMap ? "Map running" : hasTier4 ? "Map device unlocked" : "Atlas locked";

  function renderActivePage() {
    if (activePage === "upgrades" && hasAnyGenerator) {
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

    if (activePage === "mapDevice" && hasTier4) {
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

    if (activePage === "progress" && (hasPrestige || hasTalents)) {
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
        activeMapLabel={mapStatusLabel}
        totalProductionValue={topStripState.totalProductionValue}
        onGenerateFragment={actions.generateFragment}
        onBuyGenerator={actions.buyGenerator}
        onConvertCurrency={actions.manualConvert}
        onNavigate={setActivePage}
      />
    );
  }

  return (
    <>
      <AppShell
        brandTitle="PoE Idle"
        statusText={gameState.lastSaveTime ? `Saved ${new Date(gameState.lastSaveTime).toLocaleTimeString()}` : "Autosave active"}
        pageTitle={activePageCopy.title}
        pageDescription={activePageCopy.description}
        headerActions={
          <SettingsPanel version={gameState.settings.version} lastSaveTime={gameState.lastSaveTime} onResetSave={actions.resetSave} />
        }
        topBar={
          <TopStatusStrip
            items={topStripState.items}
            totalWealthValue={topStripState.totalWealthValue}
            totalProductionValue={topStripState.totalProductionValue}
            hiddenCount={topStripState.hiddenCount}
          />
        }
        sidebar={<Sidebar activePage={activePage} unlockedPages={unlockedPages} pageMeta={pageMeta} onNavigate={setActivePage} />}
        footer={<footer className="game-footer">v{gameState.settings.version}</footer>}
      >
        <ActiveMapBanner
          activeMap={gameState.activeMap}
          queuedMap={gameState.queuedMap}
          lastMapResult={gameState.lastMapResult}
          prestige={gameState.prestige}
          mapsUnlocked={hasTier4}
        />
        {renderActivePage()}
      </AppShell>

      <MapToast notification={gameState.mapNotification} />
    </>
  );
}
