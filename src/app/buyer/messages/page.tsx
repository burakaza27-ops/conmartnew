import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getInboxAction } from "@/app/actions/marketplace";
import { InboxView } from "@/components/chat/inbox-view";

export default async function BuyerMessagesPage() {
  const user = await requireRole(["BUYER", "FIELD_AGENT", "ADMIN"], "/buyer/messages");

  if (user.role === "FIELD_AGENT") {
    redirect("/agent/messages");
  }

  const result = await getInboxAction();
  return <InboxView rooms={result.success ? result.data : []} basePath="/buyer/messages" />;
}
