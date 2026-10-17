import { requireRole } from "@/lib/auth/session";
import { getInboxAction } from "@/app/actions/marketplace";
import { InboxView } from "@/components/chat/inbox-view";

export const dynamic = "force-dynamic";

export default async function AgentMessagesPage() {
  await requireRole(["FIELD_AGENT", "ADMIN"], "/agent/messages");
  const result = await getInboxAction();
  return <InboxView rooms={result.success ? result.data : []} basePath="/agent/messages" />;
}
