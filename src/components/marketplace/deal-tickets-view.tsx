"use client";

import Link from "next/link";
import { Handshake } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export interface PartyDealTicketItem {
  id: string;
  referenceCode: string;
  status: string;
  zoneName: string;
  productTitle: string;
  location: string;
  createdAt: string;
  roomId: string | null;
}

interface DealTicketsViewProps {
  tickets: PartyDealTicketItem[];
  basePath: string;
  messagesBasePath: string;
}

export function DealTicketsView({
  tickets,
  basePath,
  messagesBasePath,
}: DealTicketsViewProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("deals_nav", "Agent deals")}
        description={t(
          "deals_list_desc",
          "Free-tier suppliers are routed through a local agent. Open tickets stay here until an agent claims them."
        )}
      />

      {tickets.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={t("deals_empty", "No agent-routed deals")}
          description={t(
            "deals_empty_desc",
            "These appear when a buyer contacts a free-tier supplier. Subscribed suppliers use Messages instead."
          )}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {ticket.referenceCode} · {ticket.productTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ticket.zoneName} · {ticket.location}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge domain="dealTicket" status={ticket.status} locale={locale} size="sm" />
                {ticket.roomId ? (
                  <Link
                    href={`${messagesBasePath}/${ticket.roomId}`}
                    className={cn(buttonVariants({ size: "sm" }), "font-semibold")}
                  >
                    {t("deals_open_chat", "Open agent chat")}
                  </Link>
                ) : (
                  <Link
                    href={`${basePath}/${ticket.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-semibold")}
                  >
                    {t("deals_view", "View ticket")}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
