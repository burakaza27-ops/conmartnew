"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { useLanguage } from "@/lib/i18n/language-context";

export interface InboxRoomItem {
  id: string;
  type: string;
  ticketId: string | null;
  ticketReference: string | null;
  ticketStatus: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
}

interface InboxViewProps {
  rooms: InboxRoomItem[];
  basePath: string;
}

function roomLabel(type: string, t: (key: string, fallback?: string) => string) {
  if (type === "DIRECT") return t("chat_type_direct", "Direct chat");
  if (type === "BUYER_AGENT") return t("chat_type_buyer_agent", "You ↔ Agent");
  return t("chat_type_seller_agent", "Supplier ↔ Agent");
}

export function InboxView({ rooms, basePath }: InboxViewProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("chat_inbox_title", "Messages")}
        description={t(
          "chat_inbox_desc",
          "Direct chats with subscribed suppliers, and agent-mediated channels for everyone else."
        )}
      />

      {rooms.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={t("chat_inbox_empty", "No conversations yet")}
          description={t(
            "chat_inbox_empty_desc",
            "Start from a listing or an enquiry. Free suppliers are routed to a local agent."
          )}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`${basePath}/${room.id}`}
                className="flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {roomLabel(room.type, t)}
                    {room.ticketReference ? ` · ${room.ticketReference}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {room.lastMessage ?? t("chat_no_messages", "No messages yet")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {room.ticketStatus ? (
                    <StatusBadge domain="dealTicket" status={room.ticketStatus} locale={locale} size="sm" />
                  ) : (
                    <StatusBadge domain="subscription" status="ACTIVE" locale={locale} size="sm" />
                  )}
                  <span className="text-2xs text-muted-foreground">
                    {new Date(room.lastMessageAt).toLocaleString(
                      locale === "am" ? "am-ET" : "en-US",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
