import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getDealTicketAction } from "@/app/actions/marketplace";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function BuyerDealTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  await requireRole(["BUYER", "ADMIN"], "/buyer/enquiries");
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
        <CardContent className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            This supplier is not subscribed to direct chat. A vetted local field agent registered in {ticket.zoneName} will assist you, show you the supplier&apos;s physical yard, and guide you to the materials.
          </p>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <span>✓ 0 ETB Agent Fee Guarantee</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              Field agents are compensated directly by the supplier. You pay 0 ETB for agent guidance. Always physically inspect the material at the depot before releasing payment directly to the merchant.
            </p>
          </div>

          {ticket.buyerBriefing ? (
            <p className="rounded-lg bg-muted/50 p-3 text-sm">{ticket.buyerBriefing}</p>
          ) : null}
          {ticket.roomId ? (
            <Link
              href={`/buyer/messages/${ticket.roomId}`}
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
