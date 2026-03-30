import { describe, expect, it } from "vitest";
import { convertCurrency } from "./conversionEngine";
import { initialCurrencies } from "./currencies";

describe("convertCurrency", () => {
  it("converts fragments to transmutation orbs at 8:1 ratio", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 16 };
    const result = convertCurrency(state, "fragmentOfWisdom", "transmutationOrb", 1);

    expect(result["fragmentOfWisdom"]).toBe(8);
    expect(result["transmutationOrb"]).toBe(1);
  });

  it("converts multiple units at once", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 24 };
    const result = convertCurrency(state, "fragmentOfWisdom", "transmutationOrb", 2);

    expect(result["fragmentOfWisdom"]).toBe(8);
    expect(result["transmutationOrb"]).toBe(2);
  });

  it("returns unchanged state when insufficient funds", () => {
    const state = { ...initialCurrencies, fragmentOfWisdom: 5 };
    const result = convertCurrency(state, "fragmentOfWisdom", "transmutationOrb", 1);

    expect(result).toBe(state);
  });

  it("returns unchanged state when converting to lower value", () => {
    const state = { ...initialCurrencies, transmutationOrb: 10 };
    const result = convertCurrency(state, "transmutationOrb", "fragmentOfWisdom", 1);

    expect(result).toBe(state);
  });
});
