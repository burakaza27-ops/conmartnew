// =============================================================================
// ConMart — In-App Notification Bell (Server Action + Client Component)
// =============================================================================
// Supplies a bell icon in the app shell nav with an unread count badge.
// Notifications are stored in the database (AppNotification model).
// Realtime: subscribes to postgres_changes on app_notifications for the
// current user so new notifications appear without a page reload.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  /** Initial count from the server so first render has no flash */
  initialUnread: number;
  /** The authenticated user's ID, used for Realtime filter. Optional — skip Realtime if absent. */
  userId?: string;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function NotificationBell({ initialUnread, userId }: NotificationBellProps) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const channelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof getSupabaseClient>>["channel"]
  > | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // A new notification arrived — bump the count and refresh server state
          setUnread((prev) => prev + 1);
          refresh();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return (
    <a
      href="/notifications"
      id="notification-bell"
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-lg",
        "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      )}
      aria-label={
        unread > 0
          ? `${unread} unread notification${unread === 1 ? "" : "s"}`
          : "Notifications"
      }
    >
      <Bell className="size-4" aria-hidden="true" />
      {unread > 0 && (
        <span
          className={cn(
            "absolute right-1 top-1 flex items-center justify-center",
            "rounded-full bg-destructive text-destructive-foreground",
            "font-mono text-[9px] font-bold leading-none",
            unread > 9 ? "size-4" : "size-3.5"
          )}
          aria-hidden="true"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </a>
  );
}
