import { currencyMap, formatCurrencyValue, scrambleName, type CurrencyDefinition, type CurrencyProduction } from "@/game/currencies";

type MysteryRowProps = {
  currency: CurrencyDefinition;
  currencyProduction: CurrencyProduction;
};

export function MysteryRow({ currency, currencyProduction }: MysteryRowProps) {
  const requirement = currency.unlockRequirement;

  if (!requirement) {
    return null;
  }

  const currentRate = currencyProduction[requirement.currencyId];
  const targetRate = requirement.productionPerSecond;
  const progress = Math.min(100, (currentRate / targetRate) * 100);
  const requirementCurrency = currencyMap[requirement.currencyId];

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[rgba(255,211,106,0.04)] border border-[rgba(255,211,106,0.12)]">
      <img className="w-[22px] h-[22px] rounded-[5px] brightness-[0.45] blur-[1.5px] grayscale-[0.6] shrink-0" src={currency.icon} alt="" aria-hidden="true" />
      <div className="grid gap-0.5 flex-1 min-w-0">
        <span className="text-[0.85rem] font-medium text-[#a0a0a0] font-mono tracking-[0.02em] leading-[1.2]">{scrambleName(currency.label)}</span>
        <span className="text-[0.75rem] text-accent-gold-bright font-semibold m-0 leading-[1.2]">
          Reach {formatCurrencyValue(targetRate)} {requirementCurrency.shortLabel}/sec
        </span>
      </div>
      <div className="w-full max-w-[100px] h-[5px] rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden shrink-0">
        <div className="h-full rounded-[inherit] bg-[rgba(255,211,106,0.7)] transition-[width] duration-300 ease-in-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
