// =============================================================================
// ConMart — Agent Guided Leads Page (Server Component)
// =============================================================================

import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth/session";
import { getGuidedLeadsAction } from "@/app/actions/leads";
import { AgentLeadsView } from "./agent-leads-view";

export const dynamic = "force-dynamic";

export default async function AgentLeadsPage() {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    redirect("/login?next=/agent/leads");
  }

  const result = await getGuidedLeadsAction({ limit: 100 });
  const leads = result.success ? result.data : [];

  return <AgentLeadsView initialLeads={leads} currentAgentId={auth.user.id} />;
}
