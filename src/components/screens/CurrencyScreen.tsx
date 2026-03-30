import { memo, useMemo } from "react";
import { ClickPanel } from "@/components/ClickPanel";
import { CurrencyPanel } from "@/components/CurrencyPanel";
import { ManualConversionRow } from "@/components/ManualConversionRow";
import { MysteryRow } from "@/components/MysteryRow";
import type { PageId } from "@/components/Sidebar";
import {
  fragmentCurrencyId,
  getNextLockedCurrencies,
  getTotalProductionValuePerSecond,
} from "@/game/currencies";
import { generatorIds } from "@/game/generators";
import { canPrestige } from "@/game/prestige";
import { useGameStore } from "@/store/useGameStore";
import { useActions } from "@/store/selectors/useActions";

type CurrencyScreenProps = {
  onNavigate: (pageId: PageId) => void;
};

export const CurrencyScreen = memo(function CurrencyScreen({ onNavigate }: CurrencyScreenProps) {
  const currencies = useGameStore((s) => s.currencies);
  const currencyProduction = useGameStore((s) => s.currencyProduction);
  const clickMultiplier = useGameStore((s) => s.clickMultiplier);
  const generatorsOwned = useGameStore((s) => s.generatorsOwned);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);
  const buyMaxEnabled = useGameStore((s) => s.unlockedFeatures.buyMax);
  const prestige = useGameStore((s) => s.prestige);
  const activeMap = useGameStore((s) => s.activeMap);
  const { generateFragment: onGenerateFragment, buyGenerator: onBuyGenerator, manualConvert: onConvertCurrency } = useActions();

  const totalProductionValue = useMemo(() => getTotalProductionValuePerSecond(currencyProduction), [currencyProduction]);
  const activeMapLabel = activeMap ? "Map running" : unlockedCurrencies.alterationOrb ? "Map device unlocked" : "Atlas locked";
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
    <div className="grid gap-4 animate-[section-enter_350ms_ease-out]">
      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)] gap-4">
        <section className="grid gap-3 p-4 rounded-[20px] bg-gradient-to-b from-[rgba(244,213,140,0.08)] to-[rgba(255,255,255,0.03)] border border-[rgba(244,213,140,0.18)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Core loop</p>
              <h2 className="m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]">Generate fragments and keep the economy moving</h2>
            </div>
          </div>
          <ClickPanel
            currenciesState={currencies}
            currencyProduction={currencyProduction}
            clickMultiplier={clickMultiplier}
            onGenerateFragment={onGenerateFragment}
          />
        </section>

        <div className="grid gap-3">
          {heroCards.map((card) => (
            <section key={card.eyebrow} className="grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)] content-start">
              <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">{card.eyebrow}</p>
              <div className="text-base font-extrabold text-[#f4d58c]">{card.value}</div>
              <p className="m-0 text-[0.76rem] text-[#98a5b9]">{card.label}</p>
              <button type="button" className="px-3 py-1.5 border border-[rgba(255,211,106,0.2)] rounded-md text-[0.78rem] font-semibold text-accent-gold bg-transparent cursor-pointer whitespace-nowrap transition-all duration-100 hover:not-disabled:bg-[rgba(255,211,106,0.1)] hover:not-disabled:border-[rgba(255,211,106,0.35)] active:not-disabled:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => onNavigate(card.pageId)} disabled={card.disabled}>
                {card.actionLabel}
              </button>
            </section>
          ))}
        </div>
      </div>

      {showCurrencyList && (
        <section className="grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Stash</p>
              <h2 className="m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]">Unlocked currencies and generator lines</h2>
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
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4">
          {showTeasers && (
            <section className="grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Next unlocks</p>
                  <h2 className="m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]">Upcoming currency tiers</h2>
                </div>
              </div>
              <div className="grid gap-2">
                {nextLocked.map((currency) => (
                  <MysteryRow key={currency.id} currency={currency} currencyProduction={currencyProduction} />
                ))}
              </div>
            </section>
          )}

          {showConversions && (
            <section className="grid gap-3 p-4 rounded-[20px] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Conversion</p>
                  <h2 className="m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]">Manual adjacent-tier upgrades</h2>
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
