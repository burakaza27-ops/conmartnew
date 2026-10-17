import { requireRole } from "@/lib/auth/session";
import { getInboxAction } from "@/app/actions/marketplace";
import { InboxView } from "@/components/chat/inbox-view";

export const dynamic = "force-dynamic";

export default async function SellerMessagesPage() {
  await requireRole(["SELLER", "ADMIN"], "/seller/messages");
  const result = await getInboxAction();
  return <InboxView rooms={result.success ? result.data : []} basePath="/seller/messages" />;
}
