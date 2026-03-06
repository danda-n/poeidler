import ConversionPanel from "./components/ConversionPanel";
import CurrencyPanel from "./components/CurrencyPanel";
import FoldablePanel from "./components/FoldablePanel";
import GameLayout from "./components/GameLayout";
import GeneratorPanel from "./components/GeneratorPanel";
import SettingsPanel from "./components/SettingsPanel";
import UpgradePanel from "./components/UpgradePanel";
import { getConversionReserve, getUpgradeCategoryLabel, upgradeCategories, upgrades } from "./game/upgradeEngine";
import { useGameEngine } from "./hooks/useGameEngine";

function App() {
  const { gameState, actions } = useGameEngine();
  const conversionReserve = getConversionReserve(gameState.purchasedUpgrades, gameState.generatorsOwned);

  return (
    <main className="app-shell condensed-shell">
      <section className="game-frame condensed-frame">
        <header className="game-header compact-header">
          <h1 className="game-title">Path of Exile Idle Currency</h1>
          <p className="game-subtitle">
            Currencies unlock as your production climbs, generator buying lives beside each row, and upgrades stay short and readable.
          </p>
        </header>
        <GameLayout
          left={
            <FoldablePanel title="Currencies" defaultOpen>
              <CurrencyPanel
                currenciesState={gameState.currencies}
                currencyProduction={gameState.currencyProduction}
                generatorsOwned={gameState.generatorsOwned}
                unlockedCurrencies={gameState.unlockedCurrencies}
                buyMaxEnabled={gameState.unlockedFeatures.buyMax}
                onBuyGenerator={actions.buyGenerator}
              />
            </FoldablePanel>
          }
          center={
            <>
              <FoldablePanel title="Core Loop" defaultOpen>
                <GeneratorPanel
                  currenciesState={gameState.currencies}
                  currencyProduction={gameState.currencyProduction}
                  unlockedCurrencies={gameState.unlockedCurrencies}
                  onGenerateFragment={actions.generateFragment}
                />
              </FoldablePanel>
              <FoldablePanel title="Conversion" defaultOpen>
                <ConversionPanel
                  currenciesState={gameState.currencies}
                  unlockedCurrencies={gameState.unlockedCurrencies}
                  conversionReserve={conversionReserve}
                  onConvertCurrency={actions.manualConvert}
                />
              </FoldablePanel>
              <FoldablePanel title="Settings" defaultOpen>
                <SettingsPanel version={gameState.settings.version} lastSaveTime={gameState.lastSaveTime} onResetSave={actions.resetSave} />
              </FoldablePanel>
            </>
          }
          right={
            <div className="upgrade-category-grid">
              {upgradeCategories.map((category) => (
                <FoldablePanel key={category} title={getUpgradeCategoryLabel(category)} defaultOpen>
                  <UpgradePanel
                    category={category}
                    upgrades={upgrades.filter((upgrade) => upgrade.category === category)}
                    currenciesState={gameState.currencies}
                    unlockedCurrencies={gameState.unlockedCurrencies}
                    purchasedUpgrades={gameState.purchasedUpgrades}
                    onBuyUpgrade={actions.buyUpgrade}
                  />
                </FoldablePanel>
              ))}
            </div>
          }
        />
      </section>
    </main>
  );
}

export default App;
