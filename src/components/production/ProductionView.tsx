import { memo, useMemo, useState } from "react";
import { ClickCard } from "@/components/production/ClickCard";
import { ConversionStrip } from "@/components/production/ConversionStrip";
import { GeneratorCard } from "@/components/production/GeneratorCard";
import { NextUnlockTeaser } from "@/components/production/NextUnlockTeaser";
import {
  currencyMap,
  formatCurrencyValue,
  fragmentCurrencyId,
  getNextLockedCurrencies,
  getVisibleCurrencies,
} from "@/game/currencies";
import {
  generatorByCurrency,
  generatorIds,
  getGeneratorCost,
  getMaxAffordableGeneratorPurchases,
} from "@/game/generators";
import { useGameStore } from "@/store/useGameStore";
import { useActions } from "@/store/selectors/useActions";

type BuyAmount = 1 | 10 | "max";

export const ProductionView = memo(function ProductionView() {
  const currencies = useGameStore((s) => s.currencies);
  const currencyProduction = useGameStore((s) => s.currencyProduction);
  const clickMultiplier = useGameStore((s) => s.clickMultiplier);
  const generatorsOwned = useGameStore((s) => s.generatorsOwned);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);
  const { generateFragment, buyGenerator, manualConvert } = useActions();

  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);

  const hasAnyGenerator = useMemo(() => generatorIds.some((id) => generatorsOwned[id] > 0), [generatorsOwned]);
  const hasNonFragmentUnlocked = useMemo(
    () => Object.entries(unlockedCurrencies).some(([id, unlocked]) => id !== fragmentCurrencyId && unlocked),
    [unlockedCurrencies],
  );
  const nextLocked = useMemo(() => getNextLockedCurrencies(unlockedCurrencies, 2), [unlockedCurrencies]);

  const generatorCards = useMemo(() => {
    const visibleCurrencies = getVisibleCurrencies(unlockedCurrencies);
    return visibleCurrencies
      .filter((currency) => {
        const generator = generatorByCurrency[currency.id];
        return generator !== undefined;
      })
      .map((currency) => {
        const generator = generatorByCurrency[currency.id];
        const owned = generatorsOwned[generator.id];
        const costCurrency = currencyMap[generator.costCurrency];
        const availableCurrency = Math.floor(currencies[generator.costCurrency]);

        let effectiveQuantity: number;
        let cost: number;
        if (buyAmount === "max") {
          effectiveQuantity = getMaxAffordableGeneratorPurchases(generator.id, owned, availableCurrency);
          cost = effectiveQuantity > 0 ? getGeneratorCost(generator.id, owned, effectiveQuantity) : getGeneratorCost(generator.id, owned, 1);
        } else {
          effectiveQuantity = buyAmount;
          cost = getGeneratorCost(generator.id, owned, buyAmount);
        }

        const canAfford = availableCurrency >= cost && (buyAmount !== "max" || effectiveQuantity > 0);

        return {
          id: currency.id,
          icon: currency.icon,
          name: currency.shortLabel,
          amount: currencies[currency.id],
          productionRate: currencyProduction[currency.id],
          generatorCount: owned,
          generatorId: generator.id,
          cost,
          costCurrencyLabel: costCurrency.shortLabel,
          canAfford,
        };
      });
  }, [unlockedCurrencies, generatorsOwned, currencies, currencyProduction, buyAmount]);

  const showCurrencyList = hasAnyGenerator || currencies[fragmentCurrencyId] >= 10;

  return (
    <div className="h-full flex flex-col gap-2 animate-[section-enter_350ms_ease-out]">
      {/* Buy amount toggle */}
      <div className="shrink-0 flex items-center gap-1">
        {([1, 10, "max"] as BuyAmount[]).map((amount) => (
          <button
            key={String(amount)}
            type="button"
            className={`px-2.5 py-1 rounded-md text-[0.68rem] font-semibold transition-colors duration-100 border cursor-pointer ${
              buyAmount === amount
                ? "bg-[rgba(244,213,140,0.14)] border-[rgba(244,213,140,0.25)] text-accent-gold"
                : "bg-transparent border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default"
            }`}
            onClick={() => setBuyAmount(amount)}
          >
            {amount === "max" ? "Max" : `x${amount}`}
          </button>
        ))}
      </div>

      {/* Generator grid */}
      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-2 content-start">
        <ClickCard
          currenciesState={currencies}
          currencyProduction={currencyProduction}
          clickMultiplier={clickMultiplier}
          hasGenerators={hasAnyGenerator}
          onGenerateFragment={generateFragment}
        />
        {showCurrencyList &&
          generatorCards.map((card) => (
            <GeneratorCard
              key={card.id}
              icon={card.icon}
              name={card.name}
              amount={card.amount}
              productionRate={card.productionRate}
              generatorCount={card.generatorCount}
              generatorId={card.generatorId}
              cost={card.cost}
              costCurrencyLabel={card.costCurrencyLabel}
              canAfford={card.canAfford}
              buyAmount={buyAmount}
              onBuy={buyGenerator}
            />
          ))}
      </div>

      {/* Conversion strip */}
      {hasNonFragmentUnlocked && (
        <ConversionStrip
          currenciesState={currencies}
          unlockedCurrencies={unlockedCurrencies}
          onConvertCurrency={manualConvert}
        />
      )}

      {/* Next unlock teasers */}
      {hasNonFragmentUnlocked && nextLocked.length > 0 && (
        <NextUnlockTeaser nextLocked={nextLocked} currencyProduction={currencyProduction} />
      )}
    </div>
  );
});
