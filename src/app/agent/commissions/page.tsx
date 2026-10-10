// =============================================================================
// ConMart — Agent Commission Ledger Page (Server Component)
// =============================================================================

import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth/session";
import { getAgentCommissionSummaryAction } from "@/app/actions/leads";
import { CommissionView } from "./commission-view";

export const dynamic = "force-dynamic";

export default async function AgentCommissionsPage() {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    redirect("/login?next=/agent/commissions");
  }

  const result = await getAgentCommissionSummaryAction();
  if (!result.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {result.error}
      </div>
    );
  }

  const summary = result.data;

  return (
    <CommissionView
      records={summary.records.map((r) => ({
        id: r.id,
        feeAmount: Number(r.feeAmount),
        status: r.status,
        notes: r.notes,
        recordedAt: r.recordedAt.toISOString(),
        settledAt: r.paidAt ? r.paidAt.toISOString() : null,
        guidedLead: {
          referenceCode: r.guidedLead.referenceCode,
          materialNeeded: r.guidedLead.materialNeeded,
          areaLocation: r.guidedLead.areaLocation,
        },
      }))}
      totalEarned={summary.totalEarned}
      totalDue={summary.totalDue}
      totalPaid={summary.totalPaid}
    />
  );
}
