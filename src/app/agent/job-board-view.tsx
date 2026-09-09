"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { claimDealTicketAction } from "@/app/actions/marketplace";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatETB } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AgentJobItem {
  id: string;
  referenceCode: string;
  status: string;
  zoneName: string;
  productTitle: string;
  location: string;
  orderTotal: number;
  buyerBriefing: string | null;
  claimedAt: string | null;
  createdAt: string;
  assignedToMe: boolean;
  commissionDue: number | null;
  payoutStatus: string | null;
}

interface AgentJobBoardViewProps {
  zoneName: string;
  tickets: AgentJobItem[];
}

export function AgentJobBoardView({ zoneName, tickets }: AgentJobBoardViewProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const openJobs = tickets.filter((ticket) => ticket.status === "PENDING_AGENT");
  const mine = tickets.filter((ticket) => ticket.assignedToMe);

  const claim = (ticketId: string) => {
    startTransition(async () => {
      const result = await claimDealTicketAction({ ticketId });
      if (result.success) {
        router.push(`/agent/deals/${result.data.ticketId}`);
      }
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("agent_job_board", "Local job board")}
        description={t(
          "agent_job_board_desc",
          "Unassigned free-supplier deals in your zone. Claim one to mediate buyer and supplier chat."
        )}
        eyebrow={zoneName}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t("agent_open_jobs", "Open in your zone")} ({openJobs.length})
        </h2>
        {openJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={t("agent_no_open", "No unclaimed deals")}
            description={t(
              "agent_no_open_desc",
              "New tickets appear when a buyer contacts a free-tier supplier in this zone."
            )}
          />
        ) : (
          <div className="grid gap-3">
            {openJobs.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{ticket.referenceCode}</p>
                      <StatusBadge domain="dealTicket" status={ticket.status} locale={locale} size="sm" />
                    </div>
                    <p className="text-sm text-foreground">{ticket.productTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.location} · {ticket.zoneName}
                    </p>
                    {ticket.buyerBriefing ? (
                      <p className="text-xs text-muted-foreground">{ticket.buyerBriefing}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => claim(ticket.id)}
                    className="shrink-0 font-semibold"
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t("agent_claim", "Claim deal")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t("agent_my_deals", "My deals")} ({mine.length})
        </h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("agent_my_deals_empty", "Claimed deals will show here.")}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {mine.map((ticket) => (
              <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">
                    {ticket.referenceCode} · {ticket.productTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.orderTotal > 0 ? formatETB(ticket.orderTotal, locale) : t("agent_no_total", "Total pending")}
                    {ticket.commissionDue != null
                      ? ` · ${t("agent_commission", "Commission")} ${formatETB(ticket.commissionDue, locale)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge domain="dealTicket" status={ticket.status} locale={locale} size="sm" />
                  <Link
                    href={`/agent/deals/${ticket.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    {t("agent_open", "Open")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
