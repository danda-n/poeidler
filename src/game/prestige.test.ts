import { describe, expect, it } from "vitest";
import {
  calculatePrestigeShards,
  canPrestige,
  initialPrestigeState,
  PRESTIGE_BALANCE,
} from "./prestige";
import { initialCurrencies, initialUnlockedCurrencies } from "./currencies";

describe("canPrestige", () => {
  it("returns false when total value is below minimum", () => {
    expect(canPrestige(initialCurrencies)).toBe(false);
  });

  it("returns true when total value meets minimum", () => {
    // fragment baseValue=1, need 5000 total value
    const state = { ...initialCurrencies, fragmentOfWisdom: PRESTIGE_BALANCE.minimumValueForPrestige };
    expect(canPrestige(state)).toBe(true);
  });
});

describe("calculatePrestigeShards", () => {
  it("returns 0 when below minimum value", () => {
    const shards = calculatePrestigeShards(
      initialCurrencies,
      initialUnlockedCurrencies,
      0,
      0,
      0,
    );
    expect(shards).toBe(0);
  });

  it("returns positive shards when value is sufficient", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 10000 };
    const shards = calculatePrestigeShards(
      state,
      initialUnlockedCurrencies,
      0,
      0,
      0,
    );
    expect(shards).toBeGreaterThan(0);
  });

  it("increases with more maps completed", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 10000 };
    const shards0 = calculatePrestigeShards(state, initialUnlockedCurrencies, 0, 0, 0);
    const shards10 = calculatePrestigeShards(state, initialUnlockedCurrencies, 10, 0, 0);
    expect(shards10).toBeGreaterThan(shards0);
  });

  it("increases with cracked mirror rank", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 10000 };
    const shards0 = calculatePrestigeShards(state, initialUnlockedCurrencies, 0, 0, 0);
    const shards3 = calculatePrestigeShards(state, initialUnlockedCurrencies, 0, 0, 3);
    expect(shards3).toBeGreaterThan(shards0);
  });

  it("increases with encounter maps completed", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 10000 };
    const base = calculatePrestigeShards(state, initialUnlockedCurrencies, 5, 0, 0);
    const withEncounters = calculatePrestigeShards(state, initialUnlockedCurrencies, 5, 5, 0);
    expect(withEncounters).toBeGreaterThan(base);
  });
});

describe("initialPrestigeState", () => {
  it("starts at zero for all counters", () => {
    expect(initialPrestigeState.mirrorShards).toBe(0);
    expect(initialPrestigeState.totalMirrorShards).toBe(0);
    expect(initialPrestigeState.prestigeCount).toBe(0);
    expect(initialPrestigeState.mapsCompleted).toBe(0);
    expect(initialPrestigeState.lifetimeFragmentsProduced).toBe(0);
  });
});
