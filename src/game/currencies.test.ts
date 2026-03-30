import { describe, expect, it } from "vitest";
import {
  currencies,
  formatCurrencyValue,
  getConversionRatio,
  getSpendableAmount,
  getTotalCurrencyValue,
  getTotalProductionValuePerSecond,
  getVisibleCurrencies,
  initialCurrencies,
  initialUnlockedCurrencies,
  unlockCurrencies,
} from "./currencies";

describe("currencies", () => {
  it("defines 11 currency tiers in ascending order", () => {
    expect(currencies).toHaveLength(11);
    for (let i = 1; i < currencies.length; i++) {
      expect(currencies[i].tier).toBeGreaterThan(currencies[i - 1].tier);
    }
  });

  it("initialCurrencies starts all at zero", () => {
    currencies.forEach((c) => {
      expect(initialCurrencies[c.id]).toBe(0);
    });
  });

  it("only fragment is unlocked initially", () => {
    expect(initialUnlockedCurrencies["fragmentOfWisdom"]).toBe(true);
    currencies.filter((c) => c.id !== "fragmentOfWisdom").forEach((c) => {
      expect(initialUnlockedCurrencies[c.id]).toBe(false);
    });
  });
});

describe("unlockCurrencies", () => {
  it("unlocks a currency when its production requirement is met", () => {
    const production = { ...currencies.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {} as Record<string, number>) };
    production["fragmentOfWisdom"] = 8; // meets transmutation unlock requirement

    const result = unlockCurrencies(initialUnlockedCurrencies, production);
    expect(result["transmutationOrb"]).toBe(true);
    expect(result["augmentationOrb"]).toBe(false);
  });

  it("does not unlock when production is below threshold", () => {
    const production = { ...currencies.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {} as Record<string, number>) };
    production["fragmentOfWisdom"] = 7;

    const result = unlockCurrencies(initialUnlockedCurrencies, production);
    expect(result["transmutationOrb"]).toBe(false);
  });
});

describe("getVisibleCurrencies", () => {
  it("returns only fragment when nothing else is unlocked", () => {
    const visible = getVisibleCurrencies(initialUnlockedCurrencies);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("fragmentOfWisdom");
  });
});

describe("getTotalCurrencyValue", () => {
  it("returns 0 for initial currencies", () => {
    expect(getTotalCurrencyValue(initialCurrencies)).toBe(0);
  });

  it("weights currencies by their base value", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 10, transmutationOrb: 1 };
    // fragment baseValue=1, transmutation baseValue=8
    expect(getTotalCurrencyValue(state)).toBe(10 * 1 + 1 * 8);
  });
});

describe("getTotalProductionValuePerSecond", () => {
  it("returns 0 when no production", () => {
    const zeroProd = currencies.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {} as Record<string, number>);
    expect(getTotalProductionValuePerSecond(zeroProd)).toBe(0);
  });
});

describe("getConversionRatio", () => {
  it("returns ratio for adjacent currencies", () => {
    // transmutation baseValue=8, fragment baseValue=1, ratio=8
    expect(getConversionRatio("fragmentOfWisdom", "transmutationOrb")).toBe(8);
  });

  it("returns null when converting to lower-value currency", () => {
    expect(getConversionRatio("transmutationOrb", "fragmentOfWisdom")).toBeNull();
  });
});

describe("getSpendableAmount", () => {
  it("floors the currency amount", () => {
    expect(getSpendableAmount({ fragmentOfWisdom: 5.9 } as Record<string, number>, "fragmentOfWisdom")).toBe(5);
  });
});

describe("formatCurrencyValue", () => {
  it("formats small values with up to 1 decimal", () => {
    expect(formatCurrencyValue(0)).toBe("0");
    expect(formatCurrencyValue(5)).toBe("5");
    expect(formatCurrencyValue(5.5)).toBe("5.5");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCurrencyValue(1000)).toBe("1.00K");
    expect(formatCurrencyValue(1500)).toBe("1.50K");
    expect(formatCurrencyValue(15000)).toBe("15.0K");
    expect(formatCurrencyValue(150000)).toBe("150K");
  });

  it("formats millions with M suffix", () => {
    expect(formatCurrencyValue(1_000_000)).toBe("1.00M");
  });
});
