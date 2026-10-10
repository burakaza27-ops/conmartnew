// =============================================================================
// ConMart — Admin Subscriptions Management Page (Server Component)
// =============================================================================

import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth/session";
import {
  getPendingSubscriptionPaymentsAction,
  getSubscriptionPlansAction,
} from "@/app/actions/subscription";
import { AdminSubscriptionsView } from "./admin-subscriptions-view";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    redirect("/login?next=/admin/subscriptions");
  }

  const [paymentsRes, plansRes] = await Promise.all([
    getPendingSubscriptionPaymentsAction(),
    getSubscriptionPlansAction(),
  ]);

  const payments = paymentsRes.success ? paymentsRes.data : [];
  const plans = plansRes.success ? plansRes.data : [];

  return (
    <AdminSubscriptionsView
      initialPayments={payments}
      initialPlans={plans}
    />
  );
}
