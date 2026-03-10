import { useState } from "react";
import { ActiveMapBanner } from "./components/ActiveMapBanner";
import ClickPanel from "./components/ClickPanel";
import CurrencyPanel from "./components/CurrencyPanel";
import GameLayout from "./components/GameLayout";
import ManualConversionRow from "./components/ManualConversionRow";
import MapPanel from "./components/MapPanel";
import { MapToast } from "./components/MapToast";
import MysteryRow from "./components/MysteryRow";
import OtherUpgradesBar from "./components/OtherUpgradesBar";
import PrestigePanel from "./components/PrestigePanel";
import SettingsPanel from "./components/SettingsPanel";
import Sidebar, { type PageId } from "./components/Sidebar";
import TalentPanel from "./components/TalentPanel";
import { fragmentCurrencyId, getNextLockedCurrencies } from "./game/currencies";
import { generatorIds } from "./game/generators";
import { useGameEngine } from "./hooks/useGameEngine";

function App() {
  const { gameState, actions } = useGameEngine();
  const [activePage, setActivePage] = useState<PageId>("currency");

  const hasAnyGenerator = generatorIds.some((id) => gameState.generatorsOwned[id] > 0);
  const hasNonFragmentCurrency = Object.entries(gameState.currencies).some(
    ([id, amount]) => id !== fragmentCurrencyId && amount > 0,
  );
  const canAffordFirstGenerator = gameState.currencies[fragmentCurrencyId] >= 10;
  const showCurrencyList = hasAnyGenerator || hasNonFragmentCurrency || canAffordFirstGenerator;

  const hasNonFragmentUnlocked = Object.entries(gameState.unlockedCurrencies).some(
    ([id, unlocked]) => id !== fragmentCurrencyId && unlocked,
  );
  const nextLocked = getNextLockedCurrencies(gameState.unlockedCurrencies, 2);
  const showTeasers = hasNonFragmentUnlocked && nextLocked.length > 0;

  const showConversions = hasNonFragmentUnlocked;
  const showUpgrades = hasAnyGenerator;

  // Unlock conditions for sidebar pages
  // Maps: unlock when player has alteration orbs unlocked (tier 4+)
  const hasTier4 = gameState.unlockedCurrencies.alterationOrb;
  // Prestige: unlock when maps are unlocked and player has some progression
  const hasPrestige = hasTier4 && (gameState.prestige.prestigeCount > 0 || gameState.prestige.mapsCompleted >= 1 || gameState.currencies.jewellersOrb >= 1);
  // Talents: unlock after first prestige or having any shards
  const hasTalents = gameState.prestige.totalMirrorShards > 0;

  const unlockedPages: Record<string, boolean> = {
    maps: hasTier4,
    prestige: hasPrestige,
    talents: hasTalents,
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} unlockedPages={unlockedPages} onNavigate={setActivePage} />
      <main className="app-main">
        <GameLayout>
          <header className="game-header">
            <div className="header-left">
              <h1 className="game-title">PoE Idle</h1>
              <span className="save-status">
                {gameState.lastSaveTime
                  ? `Saved ${new Date(gameState.lastSaveTime).toLocaleTimeString()}`
                  : ""}
              </span>
            </div>
            <SettingsPanel
              version={gameState.settings.version}
              lastSaveTime={gameState.lastSaveTime}
              onResetSave={actions.resetSave}
            />
          </header>

          {/* Global active map indicator — visible on all pages when maps are unlocked */}
          {hasTier4 && (
            <ActiveMapBanner
              activeMap={gameState.activeMap}
              queuedMap={gameState.queuedMap}
            />
          )}

          {activePage === "currency" && (
            <>
              <ClickPanel
                currenciesState={gameState.currencies}
                currencyProduction={gameState.currencyProduction}
                clickMultiplier={gameState.clickMultiplier}
                onGenerateFragment={actions.generateFragment}
              />

              {showCurrencyList && (
                <div className="section-enter">
                  <CurrencyPanel
                    currenciesState={gameState.currencies}
                    currencyProduction={gameState.currencyProduction}
                    generatorsOwned={gameState.generatorsOwned}
                    unlockedCurrencies={gameState.unlockedCurrencies}
                    buyMaxEnabled={gameState.unlockedFeatures.buyMax}
                    purchasedUpgrades={gameState.purchasedUpgrades}
                    onBuyGenerator={actions.buyGenerator}
                    onBuyUpgrade={actions.buyUpgrade}
                  />
                  {showTeasers && (
                    <div style={{ marginTop: 4 }}>
                      {nextLocked.map((currency) => (
                        <MysteryRow
                          key={currency.id}
                          currency={currency}
                          currencyProduction={gameState.currencyProduction}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showUpgrades && (
                <div className="section-enter">
                  <OtherUpgradesBar
                    currenciesState={gameState.currencies}
                    purchasedUpgrades={gameState.purchasedUpgrades}
                    onBuyUpgrade={actions.buyUpgrade}
                  />
                </div>
              )}

              {showConversions && (
                <div className="section-enter">
                  <ManualConversionRow
                    currenciesState={gameState.currencies}
                    unlockedCurrencies={gameState.unlockedCurrencies}
                    onConvertCurrency={actions.manualConvert}
                  />
                </div>
              )}
            </>
          )}

          {activePage === "maps" && (
            <div className="section-enter">
              <MapPanel
                currencies={gameState.currencies}
                activeMap={gameState.activeMap}
                lastMapResult={gameState.lastMapResult}
                prestige={gameState.prestige}
                talentsPurchased={gameState.talentsPurchased}
                queuedMap={gameState.queuedMap}
                onCraftMap={actions.craftMap}
                onStartMap={actions.startMap}
                onQueueMap={actions.queueMap}
                onCancelQueue={actions.cancelQueue}
              />
            </div>
          )}

          {activePage === "prestige" && (
            <div className="section-enter">
              <PrestigePanel
                currencies={gameState.currencies}
                unlockedCurrencies={gameState.unlockedCurrencies}
                prestige={gameState.prestige}
                talentsPurchased={gameState.talentsPurchased}
                onPrestige={actions.prestige}
              />
            </div>
          )}

          {activePage === "talents" && (
            <div className="section-enter">
              <TalentPanel
                mirrorShards={gameState.prestige.mirrorShards}
                talentsPurchased={gameState.talentsPurchased}
                onPurchaseTalent={actions.purchaseTalent}
              />
            </div>
          )}

          <footer className="game-footer">
            <span>v{gameState.settings.version}</span>
          </footer>
        </GameLayout>

        {/* Map completion toast — fixed position, outside layout flow */}
        <MapToast notification={gameState.mapNotification} />
      </main>
    </div>
  );
}

export default App;
