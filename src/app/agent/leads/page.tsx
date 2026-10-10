// =============================================================================
// ConMart — Agent Guided Leads & Assignments Page (01B Specification)
// =============================================================================

import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth/session";
import { getGuidedLeadsAction } from "@/app/actions/leads";
import { getAgentProfile } from "@/lib/agents/agent-onboarding-service";
import { AgentLeadsView } from "./agent-leads-view";

export const dynamic = "force-dynamic";

export default async function AgentLeadsPage() {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    redirect("/login?next=/agent/leads");
  }

  const [leadsRes, profile] = await Promise.all([
    getGuidedLeadsAction({ limit: 100 }),
    getAgentProfile(auth.user.id),
  ]);

  const leads = leadsRes.success && leadsRes.data ? leadsRes.data : [];

  return (
    <AgentLeadsView
      initialLeads={leads}
      currentAgentId={auth.user.id}
      isAdmin={auth.user.role === "ADMIN"}
      agentProfile={
        profile
          ? {
              ...profile,
              createdAt: profile.createdAt.toISOString(),
              updatedAt: profile.updatedAt.toISOString(),
              reviewedAt: profile.reviewedAt?.toISOString() || null,
            }
          : null
      }
    />
  );
}
