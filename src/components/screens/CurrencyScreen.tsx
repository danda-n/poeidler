import { memo, useMemo } from "react";
import { ClickPanel } from "@/components/ClickPanel";
import { CurrencyPanel } from "@/components/CurrencyPanel";
import { ManualConversionRow } from "@/components/ManualConversionRow";
import { MysteryRow } from "@/components/MysteryRow";
import type { PageId } from "@/components/Sidebar";
import {
  fragmentCurrencyId,
  getNextLockedCurrencies,
  type CurrencyId,
  type CurrencyProduction,
  type CurrencyState,
  type UnlockedCurrencyState,
} from "@/game/currencies";
import { generatorIds, type GeneratorId, type GeneratorOwnedState } from "@/game/generators";
import { canPrestige, type PrestigeState } from "@/game/prestige";

type CurrencyScreenProps = {
  currencies: CurrencyState;
  currencyProduction: CurrencyProduction;
  clickMultiplier: number;
  generatorsOwned: GeneratorOwnedState;
  unlockedCurrencies: UnlockedCurrencyState;
  buyMaxEnabled: boolean;
  prestige: PrestigeState;
  activeMapLabel: string;
  totalProductionValue: number;
  onGenerateFragment: () => void;
  onBuyGenerator: (generatorId: GeneratorId) => void;
  onConvertCurrency: (fromCurrencyId: CurrencyId, toCurrencyId: CurrencyId) => void;
  onNavigate: (pageId: PageId) => void;
};

export const CurrencyScreen = memo(function CurrencyScreen({
  currencies,
  currencyProduction,
  clickMultiplier,
  generatorsOwned,
  unlockedCurrencies,
  buyMaxEnabled,
  prestige,
  activeMapLabel,
  totalProductionValue,
  onGenerateFragment,
  onBuyGenerator,
  onConvertCurrency,
  onNavigate,
}: CurrencyScreenProps) {
  const hasAnyGenerator = useMemo(() => generatorIds.some((id) => generatorsOwned[id] > 0), [generatorsOwned]);
  const hasNonFragmentCurrency = useMemo(
    () => Object.entries(currencies).some(([id, amount]) => id !== fragmentCurrencyId && amount > 0),
    [currencies],
  );
  const canAffordFirstGenerator = currencies[fragmentCurrencyId] >= 10;
  const hasNonFragmentUnlocked = useMemo(
    () => Object.entries(unlockedCurrencies).some(([id, unlocked]) => id !== fragmentCurrencyId && unlocked),
    [unlockedCurrencies],
  );
  const nextLocked = useMemo(() => getNextLockedCurrencies(unlockedCurrencies, 2), [unlockedCurrencies]);

  const hasUpgrades = hasAnyGenerator;
  const hasTier4 = unlockedCurrencies.alterationOrb;
  const hasPrestige =
    hasTier4 && (prestige.prestigeCount > 0 || prestige.mapsCompleted >= 1 || currencies.jewellersOrb >= 1);
  const hasTalents = prestige.totalMirrorShards > 0;
  const canPrestigeNow = canPrestige(currencies);
  const showCurrencyList = hasAnyGenerator || hasNonFragmentCurrency || canAffordFirstGenerator;
  const showTeasers = hasNonFragmentUnlocked && nextLocked.length > 0;
  const showConversions = hasNonFragmentUnlocked;

  const heroCards = useMemo(
    () => [
      {
        eyebrow: "Output",
        value: `${Math.round(totalProductionValue)}/s`,
        label: "Total stash value per second",
        actionLabel: hasUpgrades ? "Open upgrades" : "Build economy first",
        pageId: "upgrades" as const,
        disabled: !hasUpgrades,
      },
      {
        eyebrow: "Atlas",
        value: activeMapLabel,
        label: hasTier4 ? "Maps stay in their own screen" : "Unlock alteration tier first",
        actionLabel: hasTier4 ? "Open map device" : "Unlock alteration tier",
        pageId: "mapDevice" as const,
        disabled: !hasTier4,
      },
      {
        eyebrow: "Long-term",
        value: canPrestigeNow ? "Prestige ready" : `${prestige.mirrorShards} shards`,
        label: hasPrestige || hasTalents ? "Prestige and talents live together now" : "This screen unlocks later",
        actionLabel: hasPrestige || hasTalents ? "Open progress" : "Keep climbing",
        pageId: "progress" as const,
        disabled: !(hasPrestige || hasTalents),
      },
    ],
    [activeMapLabel, canPrestigeNow, hasPrestige, hasTalents, hasTier4, hasUpgrades, prestige.mirrorShards, totalProductionValue],
  );

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
            currenciesState={currencies}
            currencyProduction={currencyProduction}
            clickMultiplier={clickMultiplier}
            onGenerateFragment={onGenerateFragment}
          />
        </section>

        <div className="home-overview-column">
          {heroCards.map((card) => (
            <section key={card.eyebrow} className="shell-card home-overview-card">
              <p className="shell-card-eyebrow">{card.eyebrow}</p>
              <div className="home-overview-value">{card.value}</div>
              <p className="home-overview-copy">{card.label}</p>
              <button type="button" className="btn" onClick={() => onNavigate(card.pageId)} disabled={card.disabled}>
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
            currenciesState={currencies}
            currencyProduction={currencyProduction}
            generatorsOwned={generatorsOwned}
            unlockedCurrencies={unlockedCurrencies}
            buyMaxEnabled={buyMaxEnabled}
            onBuyGenerator={onBuyGenerator}
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
                  <MysteryRow key={currency.id} currency={currency} currencyProduction={currencyProduction} />
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
                currenciesState={currencies}
                unlockedCurrencies={unlockedCurrencies}
                onConvertCurrency={onConvertCurrency}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
});
