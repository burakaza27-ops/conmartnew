// =============================================================================
// ECON — Role Router
// =============================================================================
// Single authenticated entry point. Sign-in, the proxy, and any "take me home"
// link can target /dashboard without knowing the caller's role, and the
// destination is resolved from the `users` table rather than the JWT.
// =============================================================================

import { redirect } from "next/navigation";

import { defaultRouteForRole, getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  redirect(defaultRouteForRole(user.role));
}
