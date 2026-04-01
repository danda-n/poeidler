import { memo, useMemo, useState } from "react";
import { formatCurrencyValue } from "@/game/currencies";
import {
  canPurchaseUpgrade,
  getAffordableUpgradeCount,
  getUpgradeCost,
  isUpgradeUnlocked,
  upgradeMap,
  type UpgradeAvailabilityState,
  type UpgradeId,
  upgrades,
} from "@/game/upgradeEngine";
import {
  describeUpgradeEffect,
  formatUpgradeCost,
  getUpgradePresentation,
  type UpgradeNodeKind,
} from "@/game/upgradeTree";
import { UpgradeCard } from "@/components/upgrades/UpgradeCard";
import { useGameStore } from "@/store/useGameStore";
import { useActions } from "@/store/selectors/useActions";

type SmartUpgrade = {
  id: UpgradeId;
  definition: (typeof upgrades)[number];
  level: number;
  kind: UpgradeNodeKind;
  nextEffect: string;
  costLabel: string;
  costValue: number;
  canBuy: boolean;
  isMaxed: boolean;
};

function getTotalCostValue(cost: Partial<Record<string, number>>): number {
  return Object.values(cost).reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

export const UpgradePanel = memo(function UpgradePanel() {
  const currenciesState = useGameStore((s) => s.currencies);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const unlockedCurrencies = useGameStore((s) => s.unlockedCurrencies);
  const prestige = useGameStore((s) => s.prestige);
  const { buyUpgrade } = useActions();

  const [showAll, setShowAll] = useState(false);

  const availabilityState = useMemo<UpgradeAvailabilityState>(
    () => ({ currencies: currenciesState, purchasedUpgrades, unlockedCurrencies, prestige }),
    [currenciesState, prestige, purchasedUpgrades, unlockedCurrencies],
  );

  const allUpgrades = useMemo<SmartUpgrade[]>(() => {
    return upgrades.map((definition) => {
      const level = purchasedUpgrades[definition.id];
      const presentation = getUpgradePresentation(definition.id);
      const isMaxed = definition.maxLevel !== undefined && level >= definition.maxLevel;
      const canBuy = canPurchaseUpgrade(availabilityState, definition.id);
      const cost = getUpgradeCost(definition.id, level);
      const nextLevel = isMaxed ? level : level + 1;

      return {
        id: definition.id,
        definition,
        level,
        kind: presentation.kind,
        nextEffect: isMaxed
          ? "Maxed"
          : describeUpgradeEffect(definition, nextLevel, prestige.totalMirrorShards),
        costLabel: formatUpgradeCost(cost),
        costValue: getTotalCostValue(cost),
        canBuy,
        isMaxed,
      };
    });
  }, [purchasedUpgrades, prestige.totalMirrorShards, availabilityState]);

  // Smart queue: ready upgrades sorted by affordable first, then cheapest
  const smartQueue = useMemo(() => {
    return allUpgrades
      .filter((u) => !u.isMaxed && isUpgradeUnlocked(availabilityState, u.id))
      .sort((a, b) => {
        // Affordable first
        if (a.canBuy !== b.canBuy) return a.canBuy ? -1 : 1;
        // Then cheapest
        return a.costValue - b.costValue;
      })
      .slice(0, 9);
  }, [allUpgrades, availabilityState]);

  const totalAffordable = useMemo(() => getAffordableUpgradeCount(availabilityState), [availabilityState]);
  const ownedCount = useMemo(
    () => Object.values(purchasedUpgrades).filter((level) => level > 0).length,
    [purchasedUpgrades],
  );

  // "Show all" grouped by category
  const allGrouped = useMemo(() => {
    if (!showAll) return [];
    const groups = new Map<string, SmartUpgrade[]>();
    allUpgrades
      .filter((u) => !u.isMaxed)
      .forEach((u) => {
        const cat = u.definition.category;
        const existing = groups.get(cat) ?? [];
        existing.push(u);
        groups.set(cat, existing);
      });
    return Array.from(groups.entries());
  }, [showAll, allUpgrades]);

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden animate-[section-enter_350ms_ease-out]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <span className="text-[0.78rem] font-bold text-text-bright">Upgrades</span>
        <div className="flex items-center gap-3 text-[0.66rem]">
          <span className="text-text-secondary"><span className="font-bold text-accent-gold">{totalAffordable}</span> ready</span>
          <span className="text-text-secondary"><span className="font-bold text-text-bright">{ownedCount}</span> owned</span>
        </div>
      </div>

      {/* Smart queue grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[700px] mx-auto">
          {smartQueue.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {smartQueue.map((u) => (
                <UpgradeCard
                  key={u.id}
                  id={u.id}
                  definition={u.definition}
                  level={u.level}
                  kind={u.kind}
                  nextEffect={u.nextEffect}
                  costLabel={u.costLabel}
                  canBuy={u.canBuy}
                  isMaxed={u.isMaxed}
                  onBuy={buyUpgrade}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[0.74rem] text-text-secondary">
              All upgrades maxed or locked
            </div>
          )}

          {/* Show all toggle */}
          <button
            type="button"
            className="mt-4 w-full py-2 text-[0.68rem] font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Hide all upgrades" : "Show all upgrades"}
          </button>

          {/* Expanded full list */}
          {showAll && (
            <div className="mt-2 grid gap-4">
              {allGrouped.map(([category, items]) => (
                <section key={category}>
                  <span className="text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-[#7f8ca3] mb-1.5 block">
                    {category}
                  </span>
                  <div className="grid gap-1">
                    {items.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        disabled={!u.canBuy}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                          u.canBuy
                            ? "border-[rgba(244,213,140,0.2)] bg-[rgba(244,213,140,0.04)] hover:bg-[rgba(244,213,140,0.1)]"
                            : "border-[rgba(255,255,255,0.06)] bg-transparent"
                        }`}
                        onClick={() => buyUpgrade(u.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[0.7rem] font-semibold text-text-bright truncate">{u.definition.name}</span>
                          <span className="text-[0.58rem] text-text-secondary shrink-0">Lv {u.level}</span>
                        </div>
                        <span className="text-[0.6rem] font-semibold text-text-secondary tabular-nums shrink-0">{u.costLabel}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
