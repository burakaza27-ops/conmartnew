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
import { SubscriptionView } from "./subscription-view";

export default async function SellerSubscriptionPage() {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    redirect("/login?next=/seller/subscription");
  }

  const [summary, plans, payments] = await Promise.all([
    getSupplierLeadsSummary(auth.user.id),
    getSubscriptionPlans(),
    db.subscriptionPayment.findMany({
      where: { sellerId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <SubscriptionView
      currentTier={summary.tier}
      status={summary.status}
      expiresAt={summary.expiresAt ? summary.expiresAt.toISOString() : null}
      daysRemaining={summary.daysRemaining}
      isExpired={summary.isExpired}
      needsRenewalNotice={summary.needsRenewalNotice}
      plans={plans}
      payments={payments.map((p) => ({
        id: p.id,
        tier: p.tier,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        referenceCode: p.referenceCode,
        slipUrl: p.slipUrl,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
