import { requireRole } from "@/lib/auth/session";
import { getAgentJobBoardAction } from "@/app/actions/marketplace";
import { AgentJobBoardView } from "./job-board-view";

export default async function AgentJobBoardPage() {
  await requireRole(["FIELD_AGENT", "ADMIN"], "/agent");
  const result = await getAgentJobBoardAction();

  if (!result.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {result.error}
      </div>
    );
  }

  return <AgentJobBoardView zoneName={result.data.zoneName} tickets={result.data.tickets} />;
}
