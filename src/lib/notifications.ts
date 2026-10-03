// =============================================================================
// ConMart — Server-Side Notifications Service (Internal Only)
// =============================================================================
// Internal helper called by domain services and server actions when
// business events occur (new enquiry, acceptance, wallet credit, etc.).
//
// Marked "server-only" to ensure it CANNOT be imported by client components
// or exposed as a client-callable server action endpoint.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
}

/**
 * Creates an in-app notification for a user.
 * Called internally by enquiry, wallet, and deal-ticket operations.
 *
 * Swallows errors so that a notification failure never aborts or rolls back
 * an essential monetary or commercial transaction.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await db.appNotification.create({
      data: {
        userId: input.userId,
        type: input.type as NotificationType,
        title: input.title,
        body: input.body ?? null,
        meta: (input.meta ?? undefined) as never,
      },
    });
  } catch (err) {
    console.error("[notifications] Failed to create internal notification:", err);
  }
}
