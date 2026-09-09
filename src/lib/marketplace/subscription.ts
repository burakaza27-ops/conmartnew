// =============================================================================
// ConMart — Supplier Subscription Entitlement
// =============================================================================
// Direct buyer↔supplier chat is a paid privilege. The stored enum alone is not
// the truth: an ACTIVE row past `subscriptionExpiresAt` is FREE. Every chat
// decision must go through `resolveSubscription` so a lapsed supplier cannot
// keep the privilege by leaving the status column untouched.
// =============================================================================

export const SUBSCRIPTION_STATUSES = ["FREE", "ACTIVE"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface SubscriptionRecord {
  subscriptionStatus: SubscriptionStatus | string;
  subscriptionExpiresAt?: Date | string | null;
}

/**
 * Effective entitlement at `now`.
 *
 * ACTIVE with a missing expiry is open-ended (admin-granted). ACTIVE with an
 * expiry at or before `now` collapses to FREE. Any unrecognized stored value
 * is FREE — fail closed, never fail open.
 */
export function resolveSubscription(
  record: SubscriptionRecord | null | undefined,
  now: Date = new Date()
): SubscriptionStatus {
  if (!record) {
    return "FREE";
  }

  if (record.subscriptionStatus !== "ACTIVE") {
    return "FREE";
  }

  if (!record.subscriptionExpiresAt) {
    return "ACTIVE";
  }

  const expiresAt = toDate(record.subscriptionExpiresAt);
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    return "FREE";
  }

  return expiresAt.getTime() > now.getTime() ? "ACTIVE" : "FREE";
}

export function isDirectChatEntitled(
  record: SubscriptionRecord | null | undefined,
  now: Date = new Date()
): boolean {
  return resolveSubscription(record, now) === "ACTIVE";
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
