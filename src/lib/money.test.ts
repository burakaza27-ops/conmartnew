import { describe, expect, it } from "vitest";

import { formatAmount, formatCurrency, roundCurrency } from "@/lib/money";

describe("roundCurrency", () => {
  it("leaves an amount that is already exact alone", () => {
    expect(roundCurrency(1234.56)).toBe(1234.56);
  });

  it("rounds a half cent up rather than down", () => {
    // 1.005 is stored as 1.00499999999999989, so a naive
    // Math.round(value * 100) / 100 yields 1.00 here.
    expect(roundCurrency(1.005)).toBe(1.01);
    expect(roundCurrency(2.675)).toBe(2.68);
  });

  it("removes accumulated floating point error", () => {
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
  });

  it("rounds below a half cent down", () => {
    expect(roundCurrency(1.004)).toBe(1.0);
  });

  it("preserves zero and negative amounts", () => {
    expect(roundCurrency(0)).toBe(0);
    expect(roundCurrency(-1.005)).toBe(-1.01);
  });

  it("refuses non-finite input instead of returning NaN downstream", () => {
    expect(() => roundCurrency(Number.NaN)).toThrow(RangeError);
    expect(() => roundCurrency(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("handles magnitudes that stringify in exponential form", () => {
    // Exercises the `scaleToCents` fallback for values like 1e22 whose text
    // contains `e` and cannot take a second exponent in the decimal shift.
    expect(roundCurrency(1e22)).toBe(1e22);
  });
});

describe("formatCurrency", () => {
  it("formats ETB currency in English locale", () => {
    const formatted = formatCurrency(1280.5);
    expect(formatted).toContain("1,280.50");
  });

  it("formats ETB currency in Amharic locale", () => {
    const formatted = formatCurrency(1280.5, "am-ET");
    expect(formatted).toBeDefined();
    expect(formatted).toContain("1,280.50");
  });

  it("reuses formatter cache across multiple invocations", () => {
    const first = formatCurrency(500);
    const second = formatCurrency(500);
    expect(first).toBe(second);
  });
});

describe("formatAmount", () => {
  it("formats amount with comma grouping without currency symbol", () => {
    const formatted = formatAmount(1280.5);
    expect(formatted).toContain("1,281");
  });

  it("formats amount with Amharic locale", () => {
    const formatted = formatAmount(50000, "am-ET");
    expect(formatted).toContain("50,000");
  });
});
