import { useEffect, useState } from "react";
import { ActiveMapBanner } from "./components/ActiveMapBanner";
import { AppShell } from "./components/AppShell";
import ClickPanel from "./components/ClickPanel";
import { CurrencyPanel } from "./components/CurrencyPanel";
import ManualConversionRow from "./components/ManualConversionRow";
import { MapPanel } from "./components/MapPanel";
import { MapToast } from "./components/MapToast";
import MysteryRow from "./components/MysteryRow";
import { ProgressScreen } from "./components/ProgressScreen";
import SettingsPanel from "./components/SettingsPanel";
import { Sidebar, type PageId, type PageMeta } from "./components/Sidebar";
import { UpgradePanel } from "./components/UpgradePanel";
import { WealthBar } from "./components/WealthBar";
import {
  fragmentCurrencyId,
  getNextLockedCurrencies,
  getTotalCurrencyValue,
  getTotalProductionValuePerSecond,
  getVisibleCurrencies,
} from "./game/currencies";
import { generatorIds } from "./game/generators";
import { canPrestige } from "./game/prestige";
import { getAffordableUpgradeCount } from "./game/upgradeEngine";
import { useGameEngine } from "./hooks/useGameEngine";

const pageCopy: Record<PageId, { title: string; description: string }> = {
  home: {
    title: "Home",
    description: "Run the core loop, monitor your stash, and focus on the next useful action instead of every system at once.",
  },
  upgrades: {
    title: "Upgrades",
    description: "Spend into production, routing, and long-term value once the base economy is online.",
  },
  mapDevice: {
    title: "Map Device",
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

  const hasAnyGenerator = generatorIds.some((id) => gameState.generatorsOwned[id] > 0);
  const hasNonFragmentCurrency = Object.entries(gameState.currencies).some(([id, amount]) => id !== fragmentCurrencyId && amount > 0);
  const canAffordFirstGenerator = gameState.currencies[fragmentCurrencyId] >= 10;
  const showCurrencyList = hasAnyGenerator || hasNonFragmentCurrency || canAffordFirstGenerator;

  const hasNonFragmentUnlocked = Object.entries(gameState.unlockedCurrencies).some(([id, unlocked]) => id !== fragmentCurrencyId && unlocked);
  const nextLocked = getNextLockedCurrencies(gameState.unlockedCurrencies, 2);
  const showTeasers = hasNonFragmentUnlocked && nextLocked.length > 0;

  const showConversions = hasNonFragmentUnlocked;
  const hasUpgrades = hasAnyGenerator;
  const hasTier4 = gameState.unlockedCurrencies.alterationOrb;
  const hasPrestige =
    hasTier4 && (gameState.prestige.prestigeCount > 0 || gameState.prestige.mapsCompleted >= 1 || gameState.currencies.jewellersOrb >= 1);
  const hasTalents = gameState.prestige.totalMirrorShards > 0;
  const canPrestigeNow = canPrestige(gameState.currencies);

  const unlockedPages: Partial<Record<PageId, boolean>> = {
    upgrades: hasUpgrades,
    mapDevice: hasTier4,
    progress: hasPrestige || hasTalents,
  };

  useEffect(() => {
    if (activePage !== "home" && !unlockedPages[activePage]) {
      setActivePage("home");
    }
  }, [activePage, unlockedPages]);

  const affordableUpgradeCount = getAffordableUpgradeCount({
    currencies: gameState.currencies,
    purchasedUpgrades: gameState.purchasedUpgrades,
    unlockedCurrencies: gameState.unlockedCurrencies,
    prestige: gameState.prestige,
  });

  const pageMeta: Partial<Record<PageId, PageMeta>> = {
    upgrades: affordableUpgradeCount > 0 ? { badge: String(affordableUpgradeCount), tone: "ready" } : undefined,
    mapDevice: gameState.activeMap ? { badge: "Live", tone: "active" } : hasTier4 ? { badge: "Ready", tone: "active" } : undefined,
    progress: canPrestigeNow ? { badge: "Ready", tone: "alert" } : hasTalents ? { badge: "Talents", tone: "active" } : undefined,
  };

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
    .slice(0, 5);
  const wealthBarIds = [fragmentCurrencyId, ...prioritizedHighTier.map((currency) => currency.id)];
  const wealthBarItems = visibleCurrencies
    .filter((currency) => wealthBarIds.includes(currency.id))
    .sort((left, right) => left.tier - right.tier)
    .map((currency) => ({
      id: currency.id,
      label: currency.shortLabel,
      icon: currency.icon,
      amount: gameState.currencies[currency.id],
      productionRate: gameState.currencyProduction[currency.id],
    }));
  const hiddenWealthCount = Math.max(0, wealthCandidates.filter((currency) => currency.id !== fragmentCurrencyId).length - prioritizedHighTier.length);
  const totalWealthValue = getTotalCurrencyValue(gameState.currencies);
  const totalProductionValue = getTotalProductionValuePerSecond(gameState.currencyProduction);
  const activePageCopy = pageCopy[activePage];
  const mapStatusLabel = gameState.activeMap ? "Map running" : hasTier4 ? "Map device unlocked" : "Atlas not unlocked yet";

  const homeHeroCards = [
    {
      eyebrow: "Output",
      value: `${Math.round(totalProductionValue)}/s`,
      label: "Total stash value per second",
      actionLabel: hasUpgrades ? "Open upgrades" : "Build economy first",
      onClick: hasUpgrades ? () => setActivePage("upgrades") : undefined,
      disabled: !hasUpgrades,
    },
    {
      eyebrow: "Atlas",
      value: mapStatusLabel,
      label: gameState.activeMap ? "Your map run is active now" : "Maps stay in their own screen",
      actionLabel: hasTier4 ? "Open map device" : "Unlock alteration tier",
      onClick: hasTier4 ? () => setActivePage("mapDevice") : undefined,
      disabled: !hasTier4,
    },
    {
      eyebrow: "Long-term",
      value: canPrestigeNow ? "Prestige ready" : `${gameState.prestige.mirrorShards} shards`,
      label: hasPrestige || hasTalents ? "Prestige and talents live together now" : "This screen unlocks later",
      actionLabel: hasPrestige || hasTalents ? "Open progress" : "Keep climbing",
      onClick: hasPrestige || hasTalents ? () => setActivePage("progress") : undefined,
      disabled: !(hasPrestige || hasTalents),
    },
  ];

  function renderHomePage() {
    return (
      <div className="screen-stack section-enter">
        <div className="home-hero-grid">
          <section className="shell-card shell-card-highlight home-click-card">
            <div className="shell-card-header">
              <div>
                <p className="shell-card-eyebrow">Core loop</p>
                <h2 className="shell-card-title">Generate fragments and keep the economy moving</h2>
              </div>
            </div>
            <ClickPanel
              currenciesState={gameState.currencies}
              currencyProduction={gameState.currencyProduction}
              clickMultiplier={gameState.clickMultiplier}
              onGenerateFragment={actions.generateFragment}
            />
          </section>

          <div className="home-overview-column">
            {homeHeroCards.map((card) => (
              <section key={card.eyebrow} className="shell-card home-overview-card">
                <p className="shell-card-eyebrow">{card.eyebrow}</p>
                <div className="home-overview-value">{card.value}</div>
                <p className="home-overview-copy">{card.label}</p>
                <button type="button" className="btn" onClick={card.onClick} disabled={card.disabled}>
                  {card.actionLabel}
                </button>
              </section>
            ))}
          </div>
        </div>

        {showCurrencyList && (
          <section className="shell-card">
            <div className="shell-card-header">
              <div>
                <p className="shell-card-eyebrow">Stash</p>
                <h2 className="shell-card-title">Unlocked currencies and generator lines</h2>
              </div>
            </div>
            <CurrencyPanel
              currenciesState={gameState.currencies}
              currencyProduction={gameState.currencyProduction}
              generatorsOwned={gameState.generatorsOwned}
              unlockedCurrencies={gameState.unlockedCurrencies}
              buyMaxEnabled={gameState.unlockedFeatures.buyMax}
              onBuyGenerator={actions.buyGenerator}
            />
          </section>
        )}

        {(showTeasers || showConversions) && (
          <div className="home-secondary-grid">
            {showTeasers && (
              <section className="shell-card">
                <div className="shell-card-header">
                  <div>
                    <p className="shell-card-eyebrow">Next unlocks</p>
                    <h2 className="shell-card-title">Upcoming currency tiers</h2>
                  </div>
                </div>
                <div className="mystery-stack">
                  {nextLocked.map((currency) => (
                    <MysteryRow key={currency.id} currency={currency} currencyProduction={gameState.currencyProduction} />
                  ))}
                </div>
              </section>
            )}

            {showConversions && (
              <section className="shell-card">
                <div className="shell-card-header">
                  <div>
                    <p className="shell-card-eyebrow">Conversion</p>
                    <h2 className="shell-card-title">Manual adjacent-tier upgrades</h2>
                  </div>
                </div>
                <ManualConversionRow
                  currenciesState={gameState.currencies}
                  unlockedCurrencies={gameState.unlockedCurrencies}
                  onConvertCurrency={actions.manualConvert}
                />
              </section>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderActivePage() {
    if (activePage === "upgrades" && hasUpgrades) {
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
        <div className="section-enter">
          <MapPanel
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
        </div>
      );
    }

    if (activePage === "progress" && (hasPrestige || hasTalents)) {
      return (
        <div className="section-enter">
          <ProgressScreen
            currencies={gameState.currencies}
            unlockedCurrencies={gameState.unlockedCurrencies}
            prestige={gameState.prestige}
            talentsPurchased={gameState.talentsPurchased}
            onPrestige={actions.prestige}
            onPurchaseTalent={actions.purchaseTalent}
          />
        </div>
      );
    }

    return renderHomePage();
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
        topBar={<WealthBar items={wealthBarItems} totalWealthValue={totalWealthValue} totalProductionValue={totalProductionValue} hiddenCount={hiddenWealthCount} />}
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
