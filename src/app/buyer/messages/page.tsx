import { requireRole } from "@/lib/auth/session";
import { getInboxAction } from "@/app/actions/marketplace";
import { InboxView } from "@/components/chat/inbox-view";

export default async function BuyerMessagesPage() {
  await requireRole(["BUYER", "FIELD_AGENT", "ADMIN"], "/buyer/messages");
  const result = await getInboxAction();
  return <InboxView rooms={result.success ? result.data : []} basePath="/buyer/messages" />;
}
