import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PublicBrowseShell } from "@/components/layout/public-browse-shell";
import { getSessionUser, defaultRouteForRole } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getUnreadCountAction } from "@/app/actions/notifications";
import { BuyerSidebarNav, BuyerMobileBottomNav } from "./buyer-nav";

// =============================================================================
// ECON — Buyer Layout (Dual-Mode: Authenticated + Public Browse)
// =============================================================================

export const dynamic = "force-dynamic";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  // ── Anonymous visitor on a public browse route ─────────────────────────
  if (!user) {
    return <PublicBrowseShell>{children}</PublicBrowseShell>;
  }

  // ── Authenticated user role enforcement ───────────────────────────────
  const allowedRoles = ["BUYER", "FIELD_AGENT", "ADMIN"] as const;
  if (!allowedRoles.includes(user.role as (typeof allowedRoles)[number])) {
    redirect(defaultRouteForRole(user.role));
  }

  const assistMode = user.role === "FIELD_AGENT";
  const notifResult = await getUnreadCountAction();
  const unreadNotifications = notifResult.success ? notifResult.data : 0;

  return (
    <AppShell
      portal={assistMode ? "Agent assist" : "Buyer"}
      userName={user.name}
      userEmail={user.email ?? ""}
      userId={user.id}
      userRole={user.role}
      unreadNotifications={unreadNotifications}
      sidebarNav={<BuyerSidebarNav assistMode={assistMode} />}
      sidebarFooter={<SignOutButton variant="sidebar-item" />}
      mobileNav={<BuyerMobileBottomNav assistMode={assistMode} />}
    >
      {children}
    </AppShell>
  );
}
