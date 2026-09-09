import { describe, expect, it } from "vitest";

import {
  isDirectChatEntitled,
  resolveSubscription,
} from "@/lib/marketplace/subscription";

const now = new Date("2026-09-09T12:00:00.000Z");

describe("resolveSubscription", () => {
  it("treats a missing profile as FREE", () => {
    expect(resolveSubscription(null, now)).toBe("FREE");
    expect(resolveSubscription(undefined, now)).toBe("FREE");
  });

  it("keeps an open-ended ACTIVE grant", () => {
    expect(
      resolveSubscription(
        { subscriptionStatus: "ACTIVE", subscriptionExpiresAt: null },
        now
      )
    ).toBe("ACTIVE");
  });

  it("keeps ACTIVE while the expiry is still in the future", () => {
    expect(
      resolveSubscription(
        {
          subscriptionStatus: "ACTIVE",
          subscriptionExpiresAt: new Date("2026-10-01T00:00:00.000Z"),
        },
        now
      )
    ).toBe("ACTIVE");
  });

  it("collapses an expired ACTIVE row to FREE", () => {
    expect(
      resolveSubscription(
        {
          subscriptionStatus: "ACTIVE",
          subscriptionExpiresAt: new Date("2026-09-01T00:00:00.000Z"),
        },
        now
      )
    ).toBe("FREE");
  });

  it("treats expiry exactly at now as lapsed", () => {
    expect(
      resolveSubscription(
        { subscriptionStatus: "ACTIVE", subscriptionExpiresAt: now },
        now
      )
    ).toBe("FREE");
  });

  it("fails closed on an unrecognized stored status", () => {
    expect(
      resolveSubscription(
        { subscriptionStatus: "GOLD", subscriptionExpiresAt: null },
        now
      )
    ).toBe("FREE");
  });

  it("fails closed on a broken expiry timestamp", () => {
    expect(
      resolveSubscription(
        { subscriptionStatus: "ACTIVE", subscriptionExpiresAt: "not-a-date" },
        now
      )
    ).toBe("FREE");
  });

  it("never entitles a FREE row even with a future expiry leftover", () => {
    expect(
      isDirectChatEntitled(
        {
          subscriptionStatus: "FREE",
          subscriptionExpiresAt: new Date("2027-01-01T00:00:00.000Z"),
        },
        now
      )
    ).toBe(false);
  });
});
