import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getDealTicketAction } from "@/app/actions/marketplace";
import { AgentDealDetailView } from "./deal-detail-view";

export default async function AgentDealPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  await requireRole(["FIELD_AGENT", "ADMIN"], "/agent");
  const { ticketId } = await params;
  const result = await getDealTicketAction(ticketId);
  if (!result.success) {
    notFound();
  }

  return <AgentDealDetailView ticket={result.data} />;
}
