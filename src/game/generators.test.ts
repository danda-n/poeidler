import { describe, expect, it } from "vitest";
import {
  generators,
  getGeneratorCost,
  getGeneratorMilestoneBonus,
  getGeneratorOutputMultiplier,
  getMaxAffordableGeneratorPurchases,
  getNextGeneratorMilestone,
  initialGeneratorsOwned,
} from "./generators";

describe("generators", () => {
  it("defines 11 generators matching 11 currencies", () => {
    expect(generators).toHaveLength(11);
  });

  it("initialGeneratorsOwned starts all at zero", () => {
    generators.forEach((g) => {
      expect(initialGeneratorsOwned[g.id]).toBe(0);
    });
  });
});

describe("getGeneratorCost", () => {
  it("returns base cost when 0 owned and buying 1", () => {
    const gen = generators[0]; // fragmentFarmer
    expect(getGeneratorCost(gen.id, 0, 1)).toBe(Math.ceil(gen.baseCost));
  });

  it("increases with quantity owned", () => {
    const cost0 = getGeneratorCost("fragmentFarmer", 0, 1);
    const cost10 = getGeneratorCost("fragmentFarmer", 10, 1);
    expect(cost10).toBeGreaterThan(cost0);
  });

  it("buying multiple sums individual costs", () => {
    const costBulk = getGeneratorCost("fragmentFarmer", 5, 3);
    const costSingle =
      getGeneratorCost("fragmentFarmer", 5, 1) +
      getGeneratorCost("fragmentFarmer", 6, 1) +
      getGeneratorCost("fragmentFarmer", 7, 1);
    expect(costBulk).toBe(costSingle);
  });
});

describe("getMaxAffordableGeneratorPurchases", () => {
  it("returns 0 when cannot afford any", () => {
    expect(getMaxAffordableGeneratorPurchases("fragmentFarmer", 0, 0)).toBe(0);
  });

  it("returns correct count for exact budget", () => {
    const cost1 = getGeneratorCost("fragmentFarmer", 0, 1);
    expect(getMaxAffordableGeneratorPurchases("fragmentFarmer", 0, cost1)).toBe(1);
  });

  it("returns multiple when budget allows", () => {
    const costFor3 = getGeneratorCost("fragmentFarmer", 0, 3);
    expect(getMaxAffordableGeneratorPurchases("fragmentFarmer", 0, costFor3)).toBe(3);
  });
});

describe("getGeneratorMilestoneBonus", () => {
  it("returns 0 below 10", () => {
    expect(getGeneratorMilestoneBonus(0)).toBe(0);
    expect(getGeneratorMilestoneBonus(9)).toBe(0);
  });

  it("returns 0.12 at 10", () => {
    expect(getGeneratorMilestoneBonus(10)).toBeCloseTo(0.12);
  });

  it("stacks bonuses at higher milestones", () => {
    expect(getGeneratorMilestoneBonus(25)).toBeCloseTo(0.12 + 0.18);
    expect(getGeneratorMilestoneBonus(50)).toBeCloseTo(0.12 + 0.18 + 0.3);
    expect(getGeneratorMilestoneBonus(100)).toBeCloseTo(0.12 + 0.18 + 0.3 + 0.45);
  });
});

describe("getNextGeneratorMilestone", () => {
  it("returns 10 for 0 owned", () => {
    expect(getNextGeneratorMilestone(0)).toBe(10);
  });

  it("returns 25 when past 10", () => {
    expect(getNextGeneratorMilestone(15)).toBe(25);
  });

  it("returns null when past all milestones", () => {
    expect(getNextGeneratorMilestone(100)).toBeNull();
  });
});

describe("getGeneratorOutputMultiplier", () => {
  it("returns 1 when 0 owned", () => {
    expect(getGeneratorOutputMultiplier(generators[0], 0)).toBe(1);
  });

  it("returns > 1 when generators owned", () => {
    expect(getGeneratorOutputMultiplier(generators[0], 10)).toBeGreaterThan(1);
  });

  it("increases with more owned", () => {
    const mult10 = getGeneratorOutputMultiplier(generators[0], 10);
    const mult50 = getGeneratorOutputMultiplier(generators[0], 50);
    expect(mult50).toBeGreaterThan(mult10);
  });
});
