import ClickPanel from "./components/ClickPanel";
import CurrencyPanel from "./components/CurrencyPanel";
import GameLayout from "./components/GameLayout";
import ManualConversionRow from "./components/ManualConversionRow";
import MysteryRow from "./components/MysteryRow";
import OtherUpgradesBar from "./components/OtherUpgradesBar";
import SettingsPanel from "./components/SettingsPanel";
import Sidebar from "./components/Sidebar";
import { fragmentCurrencyId, getNextLockedCurrencies } from "./game/currencies";
import { generatorIds } from "./game/generators";
import { useGameEngine } from "./hooks/useGameEngine";

function App() {
  const { gameState, actions } = useGameEngine();

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

  return (
    <div className="app-layout">
      <Sidebar activePage="currency" />
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

          <footer className="game-footer">
            <span>v{gameState.settings.version}</span>
          </footer>
        </GameLayout>
      </main>
    </div>
  );
}

export default App;
