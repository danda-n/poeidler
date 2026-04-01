import { describe, expect, it } from "vitest";
import {
  applyPassiveGeneration,
  calculateCurrencyProduction,
  createInitialGameState,
  runGameTick,
} from "./gameEngine";
import {
  initialCurrencies,
  initialCurrencyMultipliers,
} from "./currencies";
import { initialGeneratorsOwned } from "./generators";

describe("createInitialGameState", () => {
  it("creates a valid initial state", () => {
    const state = createInitialGameState();
    expect(state.currencies).toBeDefined();
    expect(state.currencyProduction).toBeDefined();
    expect(state.settings.version).toBe("1.0.0");
    expect(state.activeMap).toBeNull();
    expect(state.lastMapResult).toBeNull();
    expect(state.queuedMap).toBeNull();
  });

  it("starts with zero currencies", () => {
    const state = createInitialGameState();
    expect(state.currencies["fragmentOfWisdom"]).toBe(0);
  });

  it("starts with zero production", () => {
    const state = createInitialGameState();
    expect(state.currencyProduction["fragmentOfWisdom"]).toBe(0);
  });
});

describe("calculateCurrencyProduction", () => {
  it("returns zero production when no generators owned", () => {
    const production = calculateCurrencyProduction(initialGeneratorsOwned, initialCurrencyMultipliers);
    Object.values(production).forEach((rate) => {
      expect(rate).toBe(0);
    });
  });

  it("produces fragments when fragment farmer is owned", () => {
    const generators = { ...initialGeneratorsOwned, fragmentFarmer: 1 };
    const production = calculateCurrencyProduction(generators, initialCurrencyMultipliers);
    expect(production["fragmentOfWisdom"]).toBeGreaterThan(0);
  });

  it("scales with generator count", () => {
    const gen1 = { ...initialGeneratorsOwned, fragmentFarmer: 1 };
    const gen5 = { ...initialGeneratorsOwned, fragmentFarmer: 5 };
    const prod1 = calculateCurrencyProduction(gen1, initialCurrencyMultipliers);
    const prod5 = calculateCurrencyProduction(gen5, initialCurrencyMultipliers);
    expect(prod5["fragmentOfWisdom"]).toBeGreaterThan(prod1["fragmentOfWisdom"]);
  });

  it("scales with currency multipliers", () => {
    const generators = { ...initialGeneratorsOwned, fragmentFarmer: 5 };
    const mult1 = calculateCurrencyProduction(generators, initialCurrencyMultipliers);
    const boostedMultipliers = { ...initialCurrencyMultipliers, fragmentOfWisdom: 2 };
    const mult2 = calculateCurrencyProduction(generators, boostedMultipliers);
    expect(mult2["fragmentOfWisdom"]).toBeCloseTo(mult1["fragmentOfWisdom"] * 2);
  });
});

describe("applyPassiveGeneration", () => {
  it("does not change currencies when production is zero", () => {
    const production = { fragmentOfWisdom: 0, transmutationOrb: 0 };
    const result = applyPassiveGeneration(initialCurrencies, production, 1);
    expect(result["fragmentOfWisdom"]).toBe(0);
  });

  it("adds production * deltaTime to currencies", () => {
    const production = { ...initialCurrencies, fragmentOfWisdom: 10 };
    const result = applyPassiveGeneration(initialCurrencies, production, 0.5);
    expect(result["fragmentOfWisdom"]).toBeCloseTo(5);
  });

  it("accumulates across multiple ticks", () => {
    const production = { ...initialCurrencies, fragmentOfWisdom: 10 };
    let currencies = { ...initialCurrencies };
    currencies = applyPassiveGeneration(currencies, production, 0.1);
    currencies = applyPassiveGeneration(currencies, production, 0.1);
    currencies = applyPassiveGeneration(currencies, production, 0.1);
    expect(currencies["fragmentOfWisdom"]).toBeCloseTo(3);
  });
});

describe("runGameTick", () => {
  it("returns state unchanged when nothing is producing", () => {
    const state = createInitialGameState();
    const next = runGameTick(state, 0.1);
    expect(next.currencies["fragmentOfWisdom"]).toBe(0);
  });

  it("produces currency when generators are owned", () => {
    const state = createInitialGameState();
    state.generatorsOwned["fragmentFarmer"] = 5;
    const next = runGameTick({ ...state }, 1.0);
    expect(next.currencies["fragmentOfWisdom"]).toBeGreaterThan(0);
  });

  it("tracks lifetime fragments produced", () => {
    const state = createInitialGameState();
    state.generatorsOwned["fragmentFarmer"] = 5;
    const next = runGameTick({ ...state }, 1.0);
    expect(next.prestige.lifetimeFragmentsProduced).toBeGreaterThan(0);
  });

  it("clears stale map notifications", () => {
    const state = createInitialGameState();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixture shortcut
    (state as any).mapNotification = {
      result: {},
      mapName: "test",
      timestamp: Date.now() - 10000,
    };
    const next = runGameTick({ ...state }, 0.1);
    expect(next.mapNotification).toBeNull();
  });
});
