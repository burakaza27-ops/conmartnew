import { requireRole } from "@/lib/auth/session";
import { getPartyDealTicketsAction } from "@/app/actions/marketplace";
import { DealTicketsView } from "@/components/marketplace/deal-tickets-view";

export default async function BuyerDealsPage() {
  await requireRole(["BUYER", "ADMIN"], "/buyer/deals");

  const result = await getPartyDealTicketsAction();
  return (
    <DealTicketsView
      tickets={result.success ? result.data : []}
      basePath="/buyer/deals"
      messagesBasePath="/buyer/messages"
    />
  );
}
