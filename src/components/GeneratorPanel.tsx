import { currencyMap, formatCurrencyValue, getNextCurrencyUnlock, fragmentCurrencyId, type CurrencyProduction, type CurrencyState, type UnlockedCurrencyState } from "../game/currencies";

type GeneratorPanelProps = {
  currenciesState: CurrencyState;
  currencyProduction: CurrencyProduction;
  unlockedCurrencies: UnlockedCurrencyState;
  onGenerateFragment: () => void;
};

function GeneratorPanel({ currenciesState, currencyProduction, unlockedCurrencies, onGenerateFragment }: GeneratorPanelProps) {
  const nextUnlock = getNextCurrencyUnlock(unlockedCurrencies);
  const unlockCurrencyId = nextUnlock?.unlockRequirement?.currencyId;
  const unlockCurrentRate = unlockCurrencyId ? currencyProduction[unlockCurrencyId] : 0;
  const unlockTargetRate = nextUnlock?.unlockRequirement?.productionPerSecond ?? 0;
  const unlockProgress = unlockTargetRate > 0 ? Math.min(100, (unlockCurrentRate / unlockTargetRate) * 100) : 100;

  return (
    <div className="generator-panel-content compact-generator-panel">
      <button className="generate-button compact-generate-button" type="button" onClick={onGenerateFragment}>
        Generate Fragment
      </button>
      <div className="generator-stats compact-stats">
        <p className="generator-copy">Manual click: +1 Fragment of Wisdom</p>
        <p className="generator-copy">Current stockpile: {formatCurrencyValue(currenciesState[fragmentCurrencyId])}</p>
        <p className="generator-copy">Current passive rate: {formatCurrencyValue(currencyProduction[fragmentCurrencyId])} / sec</p>
        {nextUnlock && unlockCurrencyId ? (
          <>
            <p className="generator-copy">
              Next unlock: {nextUnlock.label} at {unlockTargetRate} {currencyMap[unlockCurrencyId].shortLabel} / sec
            </p>
            <div className="unlock-progress">
              <div className="unlock-progress-bar" style={{ width: `${unlockProgress}%` }} />
            </div>
          </>
        ) : (
          <p className="generator-copy">All currencies unlocked.</p>
        )}
      </div>
    </div>
  );
}

export default GeneratorPanel;
