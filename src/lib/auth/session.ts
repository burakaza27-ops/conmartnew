// =============================================================================
// ConMart — Authoritative Session & Authorization
// =============================================================================
// Every authorization decision in the application resolves the caller's role
// from the `users` table, never from the Supabase JWT.
//
// Supabase stores signup metadata in `user_metadata`, which is writable by the
// account holder. Treating it as a role claim would let any user mint an ADMIN
// token for themselves, so it is used only for cosmetic values such as the
// display name.
// =============================================================================

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  authId: string;
  role: UserRole;
  name: string;
  phone: string;
  companyName: string;
  email: string | null;
}

/**
 * Resolves the current caller to their `users` row.
 *
 * Memoized per request so a layout, a page, and a server action in the same
 * render share one Supabase round-trip and one database query.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { authId: authUser.id },
    select: {
      id: true,
      role: true,
      name: true,
      phone: true,
      companyName: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    authId: authUser.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    companyName: user.companyName,
    email: authUser.email ?? null,
  };
});

/**
 * Route guard for layouts and pages. Redirects rather than returning an error,
 * so an unauthorized visitor never renders a protected shell.
 */
export async function requireRole(
  allowedRoles: readonly UserRole[],
  returnTo: string
): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}

export type AuthorizationResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

/**
 * Guard for server actions, which must return a value to the client rather
 * than redirect. Denials are deliberately indistinguishable from each other so
 * a caller cannot probe for which resources or roles exist.
 */
export async function authorize(
  allowedRoles: readonly UserRole[]
): Promise<AuthorizationResult> {
  const user = await getSessionUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return { ok: false, error: "You are not authorized to perform this action." };
  }

  return { ok: true, user };
}

/** Landing route for a role, used after sign-in and by `/dashboard`. */
export function defaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/command-center";
    case "SELLER":
      return "/seller/dashboard";
    case "FIELD_AGENT":
      return "/agent";
    case "BUYER":
    default:
      return "/buyer";
  }
}
