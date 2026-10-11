// =============================================================================
// ConMart — Seller Subscription Page (Server Component)
// =============================================================================

import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  getSubscriptionPlans,
  getSupplierLeadsSummary,
} from "@/lib/subscription/subscription-service";
import { SubscriptionView, type PaymentRecordItem } from "./subscription-view";
import type { SubscriptionTier } from "@prisma/client";

export default async function SellerSubscriptionPage() {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    redirect("/login?next=/seller/subscription");
  }

  let summary: Awaited<ReturnType<typeof getSupplierLeadsSummary>> | null = null;
  let plans: Awaited<ReturnType<typeof getSubscriptionPlans>> = [];
  let payments: PaymentRecordItem[] = [];

  try {
    const [s, p, rawPayments] = await Promise.all([
      getSupplierLeadsSummary(auth.user.id),
      getSubscriptionPlans(),
      db.subscriptionPayment.findMany({
        where: { sellerId: auth.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    summary = s;
    plans = p;
    payments = rawPayments.map((pm) => ({
      id: pm.id,
      tier: pm.tier as SubscriptionTier,
      amount: Number(pm.amount),
      paymentMethod: pm.paymentMethod,
      referenceCode: pm.referenceCode,
      slipUrl: pm.slipUrl,
      status: pm.status,
      notes: pm.notes,
      createdAt: pm.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("[seller/subscription] data fetch failed:", err);
    // summary will remain null, use safe defaults below
    summary = await getSupplierLeadsSummary(auth.user.id);
  }

  return (
    <SubscriptionView
      currentTier={summary.tier}
      status={summary.status}
      expiresAt={summary.expiresAt ? summary.expiresAt.toISOString() : null}
      daysRemaining={summary.daysRemaining}
      isExpired={summary.isExpired}
      needsRenewalNotice={summary.needsRenewalNotice}
      plans={plans}
      payments={payments}
    />
  );
}
