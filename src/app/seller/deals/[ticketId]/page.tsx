import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getDealTicketAction } from "@/app/actions/marketplace";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function SellerDealTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  await requireRole(["SELLER", "ADMIN"], "/seller/enquiries");
  const { ticketId } = await params;
  const result = await getDealTicketAction(ticketId);
  if (!result.success) {
    notFound();
  }

  const ticket = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.referenceCode}
        description={`${ticket.productTitle} · ${ticket.zoneName}`}
        actions={<StatusBadge domain="dealTicket" status={ticket.status} />}
      />
      <Card>
        <CardContent className="space-y-3 pt-1">
          <p className="text-sm text-muted-foreground">
            Direct buyer chat is locked on the free tier. A local agent in{" "}
            {ticket.zoneName} mediates this deal. Subscribe to unlock 1-on-1 chat.
          </p>
          {ticket.roomId ? (
            <Link
              href={`/seller/messages/${ticket.roomId}`}
              className={cn(buttonVariants(), "font-semibold")}
            >
              Open agent channel
            </Link>
          ) : (
            <p className="text-sm font-medium text-foreground">
              Waiting for a {ticket.zoneName} agent to claim this ticket.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
