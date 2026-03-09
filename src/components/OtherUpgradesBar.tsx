import { currencyMap, formatCurrencyValue, type CurrencyId, type CurrencyState } from "../game/currencies";
import { canAffordCost, getUpgradeCost, upgrades, type PurchasedUpgradeState, type UpgradeId } from "../game/upgradeEngine";
import InfoIcon from "./InfoIcon";

type OtherUpgradesBarProps = {
  currenciesState: CurrencyState;
  purchasedUpgrades: PurchasedUpgradeState;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
};

const nonProductionUpgrades = upgrades.filter(
  (u) => u.effect.type !== "percentProduction",
);

function OtherUpgradesBar({ currenciesState, purchasedUpgrades, onBuyUpgrade }: OtherUpgradesBarProps) {
  return (
    <div className="other-upgrades-bar">
      {nonProductionUpgrades.map((upgrade) => {
        const level = purchasedUpgrades[upgrade.id as UpgradeId];
        const cost = getUpgradeCost(upgrade.id as UpgradeId, level);
        const affordable = canAffordCost(currenciesState, cost);
        const isCapped = upgrade.maxLevel !== undefined && level >= upgrade.maxLevel;

        const costLabel = Object.entries(cost)
          .map(([cid, amount]) => `${formatCurrencyValue(amount ?? 0)} ${currencyMap[cid as CurrencyId].shortLabel}`)
          .join(", ");

        let label: string;
        let tooltipText: string;

        if (upgrade.effect.type === "percentClickPower") {
          label = `Click Lv ${level}`;
          tooltipText = `${upgrade.name}\n+${Math.round(upgrade.effect.value * 100)}% per level\nCurrent: x${formatCurrencyValue(1 + upgrade.effect.value * level)}\nCost: ${costLabel}`;
        } else if (upgrade.effect.type === "unlockFeature") {
          label = isCapped ? `${upgrade.name} ✓` : upgrade.name;
          tooltipText = `${upgrade.description}\nCost: ${costLabel}`;
        } else {
          label = `${upgrade.name} ${level}`;
          tooltipText = `${upgrade.description}\nCost: ${costLabel}`;
        }

        return (
          <div key={upgrade.id} className={`other-upgrade-chip${isCapped ? " other-upgrade-chip-done" : ""}`}>
            <span className="other-upgrade-label">{label}</span>
            {!isCapped && (
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => onBuyUpgrade(upgrade.id as UpgradeId)}
                disabled={!affordable}
              >
                Buy
              </button>
            )}
            <InfoIcon tooltip={tooltipText} />
          </div>
        );
      })}
    </div>
  );
}

export default OtherUpgradesBar;
