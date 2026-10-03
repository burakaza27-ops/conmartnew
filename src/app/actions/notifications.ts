"use server";

// ConMart — Notification Server Actions
// getUnreadCountAction: seeds the notification bell badge in the app shell.
// getNotificationsAction: returns recent notifications (capped to 100).
// markAllNotificationsReadAction / markNotificationReadAction: clear the badge.
//
// Internal notification creation lives in src/lib/notifications.ts (server-only)
// and is not exported from this file.

import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { toSafeErrorMessage } from "@/lib/errors";
import { revalidatePath } from "next/cache";

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Returns the caller's unread notification count. Used to seed the bell badge. */
export async function getUnreadCountAction(): Promise<ActionResponse<number>> {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const count = await db.appNotification.count({
      where: {
        userId: auth.user.id,
        readAt: null,
      },
    });
    return { success: true, data: count };
  } catch (err) {
    return { success: false, error: toSafeErrorMessage(err, "getUnreadCount") };
  }
}

/** Fetches the most recent notifications for the authenticated user (capped to 100). */
export async function getNotificationsAction(limit = 30): Promise<
  ActionResponse<
    {
      id: string;
      type: string;
      title: string;
      body: string | null;
      meta: unknown;
      readAt: string | null;
      createdAt: string;
    }[]
  >
> {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) return { success: false, error: auth.error };

  const safeLimit = Math.min(Math.max(1, limit), 100);

  try {
    const notifications = await db.appNotification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    });

    return {
      success: true,
      data: notifications.map((n: { id: string; type: string; title: string; body: string | null; meta: unknown; readAt: Date | null; createdAt: Date }) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        meta: n.meta,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    return { success: false, error: toSafeErrorMessage(err, "getNotifications") };
  }
}

/** Marks all unread notifications as read. Called when visiting the notifications page. */
export async function markAllNotificationsReadAction(): Promise<
  ActionResponse<{ count: number }>
> {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const result = await db.appNotification.updateMany({
      where: {
        userId: auth.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    revalidatePath("/notifications");
    return { success: true, data: { count: result.count } };
  } catch (err) {
    return { success: false, error: toSafeErrorMessage(err, "markAllRead") };
  }
}

/** Marks a single notification as read. */
export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResponse<void>> {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    // Verify ownership before updating
    await db.appNotification.updateMany({
      where: {
        id: notificationId,
        userId: auth.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: toSafeErrorMessage(err, "markNotificationRead") };
  }
}
