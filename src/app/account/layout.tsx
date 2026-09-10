import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ALL_APP_ROLES, requireRole } from "@/lib/auth/session";
import { signOut } from "@/app/actions/auth";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer, CartTriggerButton } from "@/components/cart/cart-drawer";
import { BuyerSidebarNav, BuyerMobileBottomNav } from "@/app/buyer/buyer-nav";
import {
  SellerSidebarNav,
  SellerBottomNav,
  SellerSignOutButton,
} from "@/app/seller/seller-nav";
import {
  AgentBottomNav,
  AgentSidebarNav,
  AgentSignOutButton,
} from "@/app/agent/agent-nav";
import {
  AdminBottomNav,
  AdminSidebarNav,
  AdminSignOutButton,
} from "@/app/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole(ALL_APP_ROLES, "/account/settings");

  if (user.role === "SELLER") {
    return (
      <AppShell
        portal="Seller"
        userName={user.name}
        userEmail={user.email ?? ""}
        sidebarNav={<SellerSidebarNav />}
        sidebarFooter={<SellerSignOutButton />}
        mobileNav={<SellerBottomNav />}
      >
        {children}
      </AppShell>
    );
  }

  if (user.role === "FIELD_AGENT") {
    return (
      <AppShell
        portal="Agent"
        userName={user.name}
        userEmail={user.email ?? ""}
        sidebarNav={<AgentSidebarNav />}
        sidebarFooter={<AgentSignOutButton />}
        mobileNav={<AgentBottomNav />}
      >
        {children}
      </AppShell>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <AppShell
        portal="Admin"
        userName={user.name}
        userEmail={user.email ?? ""}
        sidebarNav={<AdminSidebarNav />}
        sidebarFooter={<AdminSignOutButton />}
        mobileNav={<AdminBottomNav />}
        contentClassName="max-w-7xl"
      >
        {children}
      </AppShell>
    );
  }

  return (
    <CartProvider>
      <AppShell
        portal="Buyer"
        userName={user.name}
        userEmail={user.email ?? ""}
        sidebarNav={<BuyerSidebarNav />}
        sidebarFooter={
          <div className="space-y-2">
            <CartTriggerButton />
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
          </div>
        }
        mobileNav={<BuyerMobileBottomNav signOutAction={signOut} />}
        mobileActions={<CartTriggerButton />}
      >
        {children}
      </AppShell>
      <CartDrawer />
    </CartProvider>
  );
}
