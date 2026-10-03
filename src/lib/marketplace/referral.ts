// =============================================================================
// ECON — Supplier Referral System
// =============================================================================
// Business logic for the "Refer 10 Suppliers, Get 3 Months Free" program.
//
// Qualification gate: a referral only counts when the referred supplier has
// at least one active listing. This prevents ghost-account farming.
//
// Milestone tiers (incremental, not cumulative):
//   3 qualified → 1 month free subscription
//   6 qualified → 2 months free subscription
//  10 qualified → 3 months free subscription
//
// Grants are idempotent. Re-running `checkAndGrantMilestone` after the same
// count will not extend the subscription a second time.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Milestone thresholds mapping qualified referral count → months of free sub. */
export const REFERRAL_MILESTONES = [
  { count: 3, months: 1 },
  { count: 6, months: 2 },
  { count: 10, months: 3 },
] as const;

/** Maximum referral tier — once reached, no further grants are possible. */
export const MAX_REFERRAL_MONTHS = 3;

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

/**
 * Generates a URL-safe referral code (8 alphanumeric characters).
 *
 * Collision probability for 8 base-36 chars (≈ 41 bits) is negligible for the
 * expected supplier population (<100k). The `unique` constraint on the column
 * catches the astronomically unlikely collision case.
 */
export function generateReferralCode(): string {
  const hex = randomBytes(5).toString("hex");
  // Convert hex to base-36 alphanumeric string
  const num = BigInt(`0x${hex}`);
  return num.toString(36).padStart(8, "0").slice(0, 8).toUpperCase();
}


/**
 * Returns (and lazily creates) the referral code for a seller.
 * Idempotent: calling twice returns the same code.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const profile = await db.sellerProfile.findUnique({
    where: { userId },
    select: { referralCode: true },
  });

  if (profile?.referralCode) {
    return profile.referralCode;
  }

  // Generate and persist a new code. Retry once on the unlikely unique violation.
  for (let attempt = 0; attempt < 2; attempt++) {
    const code = generateReferralCode();
    try {
      await db.sellerProfile.update({
        where: { userId },
        data: { referralCode: code },
      });
      return code;
    } catch {
      // Unique constraint violation — regenerate
      if (attempt === 1) throw new Error("Failed to generate unique referral code");
    }
  }

  throw new Error("Failed to generate unique referral code");
}

// ---------------------------------------------------------------------------
// Referral link
// ---------------------------------------------------------------------------

/** Builds the full referral registration URL. */
export function buildReferralLink(code: string, baseUrl: string): string {
  return `${baseUrl}/register?ref=${encodeURIComponent(code)}`;
}

// ---------------------------------------------------------------------------
// Qualification check
// ---------------------------------------------------------------------------

/**
 * Counts the number of qualified referrals for a given referrer.
 * A referral qualifies when the `qualified` flag is true (set after the
 * referred user creates their first active listing).
 */
export async function countQualifiedReferrals(referrerId: string): Promise<number> {
  return db.referral.count({
    where: { referrerId, qualified: true },
  });
}

/**
 * Counts the total referrals (qualified + pending) for a given referrer.
 */
export async function countTotalReferrals(referrerId: string): Promise<number> {
  return db.referral.count({
    where: { referrerId },
  });
}

/**
 * Returns detailed referral records for a referrer (for the dashboard).
 */
export async function getReferralDetails(referrerId: string) {
  return db.referral.findMany({
    where: { referrerId },
    select: {
      id: true,
      qualified: true,
      qualifiedAt: true,
      createdAt: true,
      referred: {
        select: {
          name: true,
          companyName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// ---------------------------------------------------------------------------
// Milestone computation and grant
// ---------------------------------------------------------------------------

/**
 * Determines the earned months based on the number of qualified referrals.
 * Returns the total months earned (not incremental from current milestone).
 */
export function computeEarnedMonths(qualifiedCount: number): number {
  let months = 0;
  for (const milestone of REFERRAL_MILESTONES) {
    if (qualifiedCount >= milestone.count) {
      months = milestone.months;
    }
  }
  return months;
}

/**
 * Checks a referrer's qualified referral count and grants the appropriate
 * subscription extension if a new milestone has been reached.
 *
 * Idempotent: the `referralMilestone` column on SellerProfile tracks the
 * last granted month count. If the new earned months equal the stored value,
 * no update is made.
 *
 * @returns An object with `granted` (whether a new milestone was reached),
 * `previousMonths`, and `newMonths`.
 */
export async function checkAndGrantMilestone(referrerId: string): Promise<{
  granted: boolean;
  previousMonths: number;
  newMonths: number;
  qualifiedCount: number;
}> {
  const [qualifiedCount, profile] = await Promise.all([
    countQualifiedReferrals(referrerId),
    db.sellerProfile.findUnique({
      where: { userId: referrerId },
      select: {
        id: true,
        referralMilestone: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    }),
  ]);

  if (!profile) {
    return { granted: false, previousMonths: 0, newMonths: 0, qualifiedCount };
  }

  const earnedMonths = computeEarnedMonths(qualifiedCount);
  const previousMonths = profile.referralMilestone;

  // No new milestone reached
  if (earnedMonths <= previousMonths) {
    return { granted: false, previousMonths, newMonths: earnedMonths, qualifiedCount };
  }

  // Calculate the incremental months to add (only the difference)
  const incrementalMonths = earnedMonths - previousMonths;

  // Determine the base date for extension: the later of now or current expiry
  const now = new Date();
  const currentExpiry = profile.subscriptionExpiresAt;
  const baseDate =
    currentExpiry && currentExpiry.getTime() > now.getTime()
      ? new Date(currentExpiry)
      : new Date(now);

  // Add the incremental months
  const newExpiry = new Date(baseDate);
  newExpiry.setMonth(newExpiry.getMonth() + incrementalMonths);

  // Update the seller profile
  await db.sellerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: newExpiry,
      referralMilestone: earnedMonths,
    },
  });

  // Create a notification for the referrer
  await db.appNotification.create({
    data: {
      userId: referrerId,
      type: "REFERRAL_MILESTONE",
      title: `🎉 Referral milestone: ${earnedMonths} month${earnedMonths > 1 ? "s" : ""} free!`,
      body: `You've referred ${qualifiedCount} qualified suppliers and earned ${earnedMonths} month${earnedMonths > 1 ? "s" : ""} of free Direct Chat subscription.`,
      meta: {
        qualifiedCount,
        earnedMonths,
        expiresAt: newExpiry.toISOString(),
      },
    },
  });

  return { granted: true, previousMonths, newMonths: earnedMonths, qualifiedCount };
}

// ---------------------------------------------------------------------------
// Qualification trigger (called after listing creation)
// ---------------------------------------------------------------------------

/**
 * Called after a seller creates their first active listing. If this seller was
 * referred, marks the referral as qualified and checks milestones for the
 * referrer.
 *
 * Safe to call multiple times — it's a no-op if the referral is already
 * qualified or if the seller wasn't referred at all.
 */
export async function qualifyReferralIfApplicable(
  referredUserId: string
): Promise<void> {
  // Check if this user was referred and hasn't been qualified yet
  const referral = await db.referral.findUnique({
    where: { referredId: referredUserId },
    select: { id: true, referrerId: true, qualified: true },
  });

  if (!referral || referral.qualified) {
    return; // Not referred or already qualified
  }

  // Verify the referred user has at least one active listing
  const activeListingCount = await db.listing.count({
    where: { sellerId: referredUserId, active: true },
  });

  if (activeListingCount === 0) {
    return; // No active listing yet — don't qualify
  }

  // Mark referral as qualified
  await db.referral.update({
    where: { id: referral.id },
    data: {
      qualified: true,
      qualifiedAt: new Date(),
    },
  });

  // Check and grant milestone for the referrer
  await checkAndGrantMilestone(referral.referrerId);
}

// ---------------------------------------------------------------------------
// Referral record creation (called during registration)
// ---------------------------------------------------------------------------

/**
 * Resolves a referral code to the referrer's user ID.
 * Returns null if the code is invalid or doesn't belong to any seller.
 */
export async function resolveReferralCode(
  code: string
): Promise<{ referrerId: string } | null> {
  if (!code || code.trim().length === 0) {
    return null;
  }

  const profile = await db.sellerProfile.findFirst({
    where: {
      referralCode: code.trim().toUpperCase(),
    },
    select: {
      userId: true,
    },
  });

  if (!profile) {
    return null;
  }

  return { referrerId: profile.userId };
}

/**
 * Creates a referral record linking a newly registered seller to their referrer.
 * Silently fails if the referral code is invalid, the user was already referred,
 * or the referrer is the same as the referred user.
 */
export async function createReferralRecord(
  referredUserId: string,
  referralCode: string
): Promise<void> {
  const resolved = await resolveReferralCode(referralCode);
  if (!resolved) {
    return; // Invalid code
  }

  // Self-referral guard
  if (resolved.referrerId === referredUserId) {
    return;
  }

  // Check if referred user already has a referral record
  const existing = await db.referral.findUnique({
    where: { referredId: referredUserId },
  });

  if (existing) {
    return; // Already referred
  }

  try {
    await db.referral.create({
      data: {
        referrerId: resolved.referrerId,
        referredId: referredUserId,
        qualified: false,
      },
    });
  } catch {
    // Unique constraint — safe to ignore
    console.warn(
      `[referral] Duplicate referral record for user ${referredUserId}, ignoring.`
    );
  }
}
