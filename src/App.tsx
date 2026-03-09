import ClickPanel from "./components/ClickPanel";
import ConversionPanel from "./components/ConversionPanel";
import CurrencyPanel from "./components/CurrencyPanel";
import FoldablePanel from "./components/FoldablePanel";
import GameLayout from "./components/GameLayout";
import MysteryRow from "./components/MysteryRow";
import SettingsPanel from "./components/SettingsPanel";
import UpgradePanel from "./components/UpgradePanel";
import { fragmentCurrencyId, getNextLockedCurrencies } from "./game/currencies";
import { generatorIds } from "./game/generators";
import { getConversionReserve } from "./game/upgradeEngine";
import { useGameEngine } from "./hooks/useGameEngine";

function App() {
  const { gameState, actions } = useGameEngine();
  const conversionReserve = getConversionReserve(gameState.purchasedUpgrades, gameState.generatorsOwned);

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

  const showConversions = gameState.unlockedFeatures.autoConversion;
  const showUpgrades = hasAnyGenerator;

  return (
    <main className="app-shell">
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
              onBuyGenerator={actions.buyGenerator}
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

        {showConversions && (
          <div className="section-enter">
            <FoldablePanel title="Conversion" defaultOpen>
              <ConversionPanel
                currenciesState={gameState.currencies}
                unlockedCurrencies={gameState.unlockedCurrencies}
                conversionReserve={conversionReserve}
                onConvertCurrency={actions.manualConvert}
              />
            </FoldablePanel>
          </div>
        )}

        {showUpgrades && (
          <div className="section-enter">
            <FoldablePanel title="Upgrades" defaultOpen>
              <UpgradePanel
                currenciesState={gameState.currencies}
                unlockedCurrencies={gameState.unlockedCurrencies}
                purchasedUpgrades={gameState.purchasedUpgrades}
                onBuyUpgrade={actions.buyUpgrade}
              />
            </FoldablePanel>
          </div>
        )}

        <footer className="game-footer">
          <span>v{gameState.settings.version}</span>
        </footer>
      </GameLayout>
    </main>
  );
}

export default App;
