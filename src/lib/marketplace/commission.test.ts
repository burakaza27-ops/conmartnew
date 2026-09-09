import { describe, expect, it } from "vitest";

import { calculateCommission } from "@/lib/marketplace/commission";

describe("calculateCommission", () => {
  it("splits a 5% fee 60/40 by default", () => {
    const result = calculateCommission({ orderTotal: 100_000 });

    expect(result.feeAmount).toBe(5_000);
    expect(result.platformAmount).toBe(3_000);
    expect(result.agentAmount).toBe(2_000);
    expect(result.platformAmount + result.agentAmount).toBe(result.feeAmount);
  });

  it("keeps the split adding up on awkward cents", () => {
    const result = calculateCommission({ orderTotal: 333.33 });
    expect(result.platformAmount + result.agentAmount).toBe(result.feeAmount);
  });

  it("rejects a non-positive order total", () => {
    expect(() => calculateCommission({ orderTotal: 0 })).toThrow(/positive/i);
    expect(() => calculateCommission({ orderTotal: -10 })).toThrow(/positive/i);
  });

  it("rejects share percentages that do not add to 100", () => {
    expect(() =>
      calculateCommission({
        orderTotal: 1_000,
        platformSharePercent: 70,
        agentSharePercent: 20,
      })
    ).toThrow(/100/);
  });
});
