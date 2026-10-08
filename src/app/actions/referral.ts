// =============================================================================
// ECON — Referral Server Actions
// =============================================================================
// Actions for the seller referral dashboard: fetching referral status,
// generating referral links, and viewing referral progress.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { authorize } from "@/lib/auth/session";
import {
  ensureReferralCode,
  buildReferralLink,
  countQualifiedReferrals,
  countTotalReferrals,
  getReferralDetails,
  computeEarnedMonths,
  REFERRAL_MILESTONES,
} from "@/lib/marketplace/referral";
import type { ActionResult } from "@/lib/types";

export interface ReferralDashboardData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  earnedMonths: number;
  currentMilestone: number;
  nextMilestone: { count: number; months: number } | null;
  milestones: { count: number; months: number }[];
  referrals: {
    id: string;
    qualified: boolean;
    qualifiedAt: string | null;
    createdAt: string;
    referredName: string;
    referredCompany: string;
  }[];
}

/**
 * Fetches the complete referral dashboard data for the authenticated seller.
 * Lazily creates the referral code on first access.
 */
export async function getReferralDashboardAction(): Promise<
  ActionResult<ReferralDashboardData>
> {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    // Ensure referral code exists
    const referralCode = await ensureReferralCode(auth.user.id);

    // Build the referral link from the request origin
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") ?? "http";
    const baseUrl = `${protocol}://${host}`;
    const referralLink = buildReferralLink(referralCode, baseUrl);

    // Fetch counts and details in parallel
    const [totalReferrals, qualifiedReferrals, referralDetails] =
      await Promise.all([
        countTotalReferrals(auth.user.id),
        countQualifiedReferrals(auth.user.id),
        getReferralDetails(auth.user.id),
      ]);

    const earnedMonths = computeEarnedMonths(qualifiedReferrals);

    // Determine the next milestone
    const nextMilestone =
      REFERRAL_MILESTONES.find((m) => qualifiedReferrals < m.count) ?? null;

    return {
      success: true,
      data: {
        referralCode,
        referralLink,
        totalReferrals,
        qualifiedReferrals,
        earnedMonths,
        currentMilestone: earnedMonths,
        nextMilestone: nextMilestone
          ? { count: nextMilestone.count, months: nextMilestone.months }
          : null,
        milestones: REFERRAL_MILESTONES.map((m) => ({
          count: m.count,
          months: m.months,
        })),
        referrals: referralDetails.map((r) => ({
          id: r.id,
          qualified: r.qualified,
          qualifiedAt: r.qualifiedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          referredName: r.referred.name,
          referredCompany: r.referred.companyName,
        })),
      },
    };
  } catch (error) {
    console.error("[getReferralDashboard]", error);
    return {
      success: false,
      error: "Failed to load referral data. Please try again.",
    };
  }
}
