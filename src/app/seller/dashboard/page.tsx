// =============================================================================
// ECON — Seller Dashboard (Server Component)
// =============================================================================
// Authenticates seller/admin, loads inventory from database, and delegates
// rendering to the bilingual SellerDashboardView client component.
// =============================================================================

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { fetchSellerListings } from "@/lib/data/admin";
import { db } from "@/lib/db";
import { SellerDashboardView } from "./seller-dashboard-view";
import { resolveSubscription } from "@/lib/marketplace/subscription";
import { getReferralDashboardAction } from "@/app/actions/referral";
import { getSupplierLeadsSummary } from "@/lib/subscription/subscription-service";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/seller/dashboard");
  }

  let dbUser: { id: string; role: string; sellerProfile: { subscriptionStatus: string; subscriptionExpiresAt: Date | null } | null } | null = null;
  try {
    dbUser = await db.user.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        role: true,
        sellerProfile: {
          select: {
            subscriptionStatus: true,
            subscriptionExpiresAt: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("[seller/dashboard] db.user.findUnique failed:", err);
    // Let the page render with empty state rather than crashing
  }

  if (!dbUser || (dbUser.role !== "SELLER" && dbUser.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  const [listings, referralResult, leadsSummary] = await Promise.all([
    fetchSellerListings(user.id),
    getReferralDashboardAction(),
    getSupplierLeadsSummary(dbUser.id),
  ]);

  const effectiveStatus = resolveSubscription(dbUser.sellerProfile);

  return (
    <SellerDashboardView
      listings={listings}
      subscription={{
        storedStatus: dbUser.sellerProfile?.subscriptionStatus ?? "FREE",
        effectiveStatus,
        expiresAt: dbUser.sellerProfile?.subscriptionExpiresAt?.toISOString() ?? null,
        directChatEnabled: effectiveStatus === "ACTIVE",
      }}
      referral={referralResult.success ? referralResult.data : null}
      leadsSummary={leadsSummary}
    />
  );
}


