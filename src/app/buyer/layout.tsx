import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { PublicBrowseShell } from "@/components/layout/public-browse-shell";
import { getSessionUser, defaultRouteForRole } from "@/lib/auth/session";
import { signOut } from "@/app/actions/auth";
import { getUnreadCountAction } from "@/app/actions/notifications";
import { BuyerSidebarNav, BuyerMobileBottomNav } from "./buyer-nav";

// =============================================================================
// ConMart — Buyer Layout (Dual-Mode: Authenticated + Public Browse)
// =============================================================================

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
      unreadNotifications={unreadNotifications}
      sidebarNav={<BuyerSidebarNav assistMode={assistMode} />}
      sidebarFooter={
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      }
      mobileNav={<BuyerMobileBottomNav signOutAction={signOut} assistMode={assistMode} />}
    >
      {children}
    </AppShell>
  );
}
