// =============================================================================
// ConMart — Notifications Page
// =============================================================================
// Shows all in-app notifications for the authenticated user.
// Marks all as read on load. Realtime updates come via NotificationBell.
// =============================================================================

import { redirect } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
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
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-3 px-4 py-4"
            >
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Bell className="size-4" />
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
