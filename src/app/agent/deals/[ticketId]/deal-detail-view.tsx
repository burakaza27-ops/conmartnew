"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  completeDealTicketAction,
  transitionDealTicketAction,
} from "@/app/actions/marketplace";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatETB } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AgentDealDetail {
  id: string;
  referenceCode: string;
  status: string;
  zoneName: string;
  productTitle: string;
  location: string;
  orderTotal: number;
  buyerBriefing: string | null;
  roomId: string | null;
  sellerRoomId: string | null;
  buyerRoomId: string | null;
  commission: {
    platformAmount: number;
    agentAmount: number;
    payoutStatus: string;
  } | null;
}

export function AgentDealDetailView({ ticket }: { ticket: AgentDealDetail }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [orderTotal, setOrderTotal] = useState(
    ticket.orderTotal > 0 ? String(ticket.orderTotal) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.referenceCode}
        description={`${ticket.productTitle} · ${ticket.location}`}
        actions={<StatusBadge domain="dealTicket" status={ticket.status} locale={locale} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              {t(
                "agent_deal_channels",
                "Keep the buyer and the free supplier on separate channels. Do not introduce phone numbers."
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {ticket.buyerRoomId ? (
                <Link
                  href={`/agent/messages/${ticket.buyerRoomId}`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  {t("agent_chat_buyer", "Buyer channel")}
                </Link>
              ) : null}
              {ticket.sellerRoomId ? (
                <Link
                  href={`/agent/messages/${ticket.sellerRoomId}`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  {t("agent_chat_seller", "Supplier channel")}
                </Link>
              ) : null}
            </div>
            {ticket.buyerBriefing ? (
              <p className="rounded-lg bg-muted/50 p-3 text-sm">{ticket.buyerBriefing}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-1">
            {ticket.status === "AGENT_ASSIGNED" ? (
              <Button
                type="button"
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    transitionDealTicketAction({ ticketId: ticket.id, to: "IN_INSPECTION" })
                  )
                }
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("agent_start_inspection", "Start inspection")}
              </Button>
            ) : null}

            {ticket.status === "IN_INSPECTION" ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const amount = Number(orderTotal);
                  run(() => completeDealTicketAction({ ticketId: ticket.id, orderTotal: amount }));
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="orderTotal">{t("agent_order_total", "Closed order total (ETB)")}</Label>
                  <Input
                    id="orderTotal"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={orderTotal}
                    onChange={(event) => setOrderTotal(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {t("agent_complete", "Complete & calculate commission")}
                </Button>
              </form>
            ) : null}

            {ticket.status !== "COMPLETED" && ticket.status !== "CANCELLED" ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    transitionDealTicketAction({ ticketId: ticket.id, to: "CANCELLED" })
                  )
                }
              >
                {t("agent_cancel", "Cancel deal")}
              </Button>
            ) : null}

            {ticket.commission ? (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p>
                  {t("agent_commission", "Commission")}: {formatETB(ticket.commission.agentAmount, locale)}
                </p>
                <p className="text-muted-foreground">
                  {t("agent_platform_share", "Platform")}: {formatETB(ticket.commission.platformAmount, locale)}
                </p>
                <StatusBadge
                  domain="payout"
                  status={ticket.commission.payoutStatus}
                  locale={locale}
                  size="sm"
                />
              </div>
            ) : null}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
