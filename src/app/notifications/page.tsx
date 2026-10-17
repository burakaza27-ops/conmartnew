// =============================================================================
// ECON — Notifications Page
// =============================================================================
// Shows all in-app notifications for the authenticated user.
// Marks all as read on load. Realtime updates come via NotificationBell.
// =============================================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, BellOff, MessageSquare, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getNotificationsAction, markAllNotificationsReadAction } from "@/app/actions/notifications";
import { PageHeader } from "@/components/layout/page-header";

const TYPE_LABELS: Record<string, string> = {
  ENQUIRY_RECEIVED: "New enquiry received",
  ENQUIRY_ACCEPTED: "Enquiry accepted",
  ENQUIRY_DECLINED: "Enquiry declined",
  WALLET_TOPPED_UP: "Wallet topped up",
  DEAL_STATUS_CHANGED: "Deal status updated",
  MESSAGE_RECEIVED: "New message",
  DEAL_FAILURE_REFUND: "Deal refund credited",
};

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireRole(
    ["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"],
    "/login"
  );

  if (!user) redirect("/login");

  // Mark all read when page is visited
  await markAllNotificationsReadAction();

  const result = await getNotificationsAction(50);
  const notifications = result.success ? result.data : [];

  const getNotificationLink = (n: (typeof notifications)[number]) => {
    const meta = n.meta as { roomId?: string; enquiryId?: string; ticketId?: string } | null;
    if (meta?.roomId) {
      if (user.role === "SELLER") return `/seller/messages/${meta.roomId}`;
      if (user.role === "FIELD_AGENT") return `/agent/messages/${meta.roomId}`;
      return `/buyer/messages/${meta.roomId}`;
    }
    if (meta?.enquiryId) {
      if (user.role === "SELLER") return `/seller/enquiries`;
      return `/buyer/enquiries`;
    }
    if (meta?.ticketId) {
      if (user.role === "FIELD_AGENT") return `/agent/deals/${meta.ticketId}`;
      if (user.role === "SELLER") return `/seller/deals/${meta.ticketId}`;
      return `/buyer/deals/${meta.ticketId}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Your recent activity and alerts."
        eyebrow={`${notifications.filter((n) => !n.readAt).length} new`}
      />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <BellOff className="mb-4 size-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="font-medium text-foreground">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ll see new enquiries, deal updates, and wallet events here.
          </p>
        </div>
      ) : (
        <ul
          className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
          aria-label="Notifications"
        >
          {notifications.map((n) => {
            const link = getNotificationLink(n);
            return (
              <li key={n.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    {n.type === "MESSAGE_RECEIVED" ? (
                      <MessageSquare className="size-4" />
                    ) : (
                      <Bell className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-1 text-2xs text-muted-foreground">
                      {TYPE_LABELS[n.type] ?? n.type} ·{" "}
                      {new Date(n.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {link && (
                      <div className="mt-2.5">
                        <Link
                          href={link}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
                        >
                          <MessageSquare className="size-3.5" />
                          <span>
                            {n.type === "MESSAGE_RECEIVED"
                              ? "Open Chat & Reply (መልስ ይስጡ)"
                              : "View Details"}
                          </span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
