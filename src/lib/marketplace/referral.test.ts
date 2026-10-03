import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));

import {
  computeEarnedMonths,
  buildReferralLink,
  REFERRAL_MILESTONES,
  generateReferralCode,
} from "./referral";


describe("Supplier Referral Logic", () => {
  describe("generateReferralCode", () => {
    it("generates an 8-character uppercase alphanumeric code", () => {
      const code = generateReferralCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });

    it("generates distinct codes on consecutive calls", () => {
      const code1 = generateReferralCode();
      const code2 = generateReferralCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe("buildReferralLink", () => {
    it("builds the correct registration URL with ref query parameter", () => {
      const link = buildReferralLink("ABC123XY", "https://econ.et");
      expect(link).toBe("https://econ.et/register?ref=ABC123XY");
    });
  });

  describe("computeEarnedMonths", () => {
    it("returns 0 months for fewer than 3 qualified referrals", () => {
      expect(computeEarnedMonths(0)).toBe(0);
      expect(computeEarnedMonths(1)).toBe(0);
      expect(computeEarnedMonths(2)).toBe(0);
    });

    it("returns 1 month for 3 to 5 qualified referrals", () => {
      expect(computeEarnedMonths(3)).toBe(1);
      expect(computeEarnedMonths(4)).toBe(1);
      expect(computeEarnedMonths(5)).toBe(1);
    });

    it("returns 2 months for 6 to 9 qualified referrals", () => {
      expect(computeEarnedMonths(6)).toBe(2);
      expect(computeEarnedMonths(7)).toBe(2);
      expect(computeEarnedMonths(8)).toBe(2);
      expect(computeEarnedMonths(9)).toBe(2);
    });

    it("returns 3 months for 10 or more qualified referrals", () => {
      expect(computeEarnedMonths(10)).toBe(3);
      expect(computeEarnedMonths(15)).toBe(3);
      expect(computeEarnedMonths(100)).toBe(3);
    });

    it("milestones match the documented policy", () => {
      expect(REFERRAL_MILESTONES).toEqual([
        { count: 3, months: 1 },
        { count: 6, months: 2 },
        { count: 10, months: 3 },
      ]);
    });
  });
});
