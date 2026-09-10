import { requireRole } from "@/lib/auth/session";
import { getPartyDealTicketsAction } from "@/app/actions/marketplace";
import { DealTicketsView } from "@/components/marketplace/deal-tickets-view";

export default async function SellerDealsPage() {
  await requireRole(["SELLER", "ADMIN"], "/seller/deals");
  const result = await getPartyDealTicketsAction();
  return (
    <DealTicketsView
      tickets={result.success ? result.data : []}
      basePath="/seller/deals"
      messagesBasePath="/seller/messages"
    />
  );
}
