// =============================================================================
// ConMart — Admin Agent Vetting & Approval Queue (01B Specification)
// =============================================================================

import { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getAdminAgentApplicationsAction } from "@/app/actions/agents";
import { AgentReviewQueue } from "./agent-review-queue";

export const metadata: Metadata = {
  title: "Agent Vetting Queue | Admin",
  description: "01B Agent application review, verification checklist, and approval pipeline.",
};

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  await requireRole(["ADMIN"], "/admin/agents");

  const res = await getAdminAgentApplicationsAction();
  const applications = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-8">
      <AgentReviewQueue initialApplications={applications} />
    </div>
  );
}
