import { memo, useMemo, useState } from "react";
import { ClickRow } from "@/components/production/ClickRow";
import { GeneratorRow } from "@/components/production/GeneratorRow";
import {
  currencyMap,
  formatCurrencyValue,
  fragmentCurrencyId,
  getNextLockedCurrencies,
  getVisibleCurrencies,
} from "@/game/currencies";
import {
  GENERATOR_MILESTONES,
  generatorByCurrency,
  generatorIds,
  getGeneratorCost,
  getMaxAffordableGeneratorPurchases,
  getNextGeneratorMilestone,
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
  const { generateFragment, buyGenerator } = useActions();

  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);

  const hasAnyGenerator = useMemo(() => generatorIds.some((id) => generatorsOwned[id] > 0), [generatorsOwned]);

  const generatorRows = useMemo(() => {
    const visibleCurrencies = getVisibleCurrencies(unlockedCurrencies);
    return visibleCurrencies
      .filter((currency) => generatorByCurrency[currency.id] !== undefined)
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
        const milestoneLevel = GENERATOR_MILESTONES.filter((m) => owned >= m).length;
        const nextMilestone = getNextGeneratorMilestone(owned);

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
          milestoneLevel,
          nextMilestone,
        };
      });
  }, [unlockedCurrencies, generatorsOwned, currencies, currencyProduction, buyAmount]);

  const showGenerators = hasAnyGenerator || currencies[fragmentCurrencyId] >= 10;

  const nextUnlock = useMemo(() => {
    const locked = getNextLockedCurrencies(unlockedCurrencies, 1);
    if (locked.length === 0) return null;
    const currency = locked[0];
    const req = currency.unlockRequirement!;
    const currentRate = currencyProduction[req.currencyId] ?? 0;
    const targetRate = req.productionPerSecond;
    const sourceName = currencyMap[req.currencyId].shortLabel;
    return { currentRate, targetRate, sourceName };
  }, [unlockedCurrencies, currencyProduction]);

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

      {/* Generator rows */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[800px] mx-auto flex flex-col gap-0.5">
          <ClickRow
            currenciesState={currencies}
            currencyProduction={currencyProduction}
            clickMultiplier={clickMultiplier}
            onGenerateFragment={generateFragment}
          />

          {showGenerators &&
            generatorRows.map((row, index) => (
              <GeneratorRow
                key={row.id}
                icon={row.icon}
                name={row.name}
                amount={row.amount}
                productionRate={row.productionRate}
                generatorCount={row.generatorCount}
                generatorId={row.generatorId}
                cost={row.cost}
                costCurrencyLabel={row.costCurrencyLabel}
                canAfford={row.canAfford}
                buyAmount={buyAmount}
                onBuy={buyGenerator}
                even={index % 2 === 0}
                milestoneLevel={row.milestoneLevel}
                nextMilestone={row.nextMilestone}
              />
            ))}

          {showGenerators && nextUnlock && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-40">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#7f8ca3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="5" y="9" width="10" height="8" rx="1.5" />
                <path d="M7 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              <span className="text-[0.74rem] font-semibold text-text-secondary">???</span>
              <span className="text-[0.62rem] text-text-secondary tabular-nums ml-auto">
                {formatCurrencyValue(nextUnlock.currentRate)}/{formatCurrencyValue(nextUnlock.targetRate)}/s {nextUnlock.sourceName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
