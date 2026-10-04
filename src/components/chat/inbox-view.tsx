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
  listingTitle: string | null;
  counterpartName: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount?: number;
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
          {rooms.map((room) => {
            const hasUnread = Boolean(room.unreadCount && room.unreadCount > 0);
            return (
              <li key={room.id}>
                <Link
                  href={`${basePath}/${room.id}`}
                  className={`flex flex-col gap-1 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    hasUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {hasUnread && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                      )}
                      <p className={`text-sm ${hasUnread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                        {room.counterpartName}
                      </p>
                      {hasUnread && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs font-bold bg-primary text-primary-foreground">
                          {room.unreadCount} new
                        </span>
                      )}
                    </div>
                    <p className="text-2xs font-medium text-muted-foreground">
                      {roomLabel(room.type, t)}
                      {room.listingTitle ? ` · ${room.listingTitle}` : ""}
                      {room.ticketReference ? ` · ${room.ticketReference}` : ""}
                    </p>
                    <p className={`truncate text-xs ${hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {room.lastMessage ?? t("chat_no_messages", "No messages yet")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {room.ticketStatus ? (
                      <StatusBadge domain="dealTicket" status={room.ticketStatus} locale={locale} size="sm" />
                    ) : (
                      <StatusBadge domain="subscription" status="ACTIVE" locale={locale} size="sm" />
                    )}
                    <span className="text-2xs text-muted-foreground whitespace-nowrap">
                      {new Date(room.lastMessageAt).toLocaleString(
                        locale === "am" ? "am-ET" : "en-US",
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
