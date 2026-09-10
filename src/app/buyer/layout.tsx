import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
import { signOut } from "@/app/actions/auth";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer, CartTriggerButton } from "@/components/cart/cart-drawer";
import { BuyerSidebarNav, BuyerMobileBottomNav } from "./buyer-nav";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["BUYER", "FIELD_AGENT", "ADMIN"], "/buyer/catalog");
  const assistMode = user.role === "FIELD_AGENT";

  return (
    <CartProvider>
      <AppShell
        portal={assistMode ? "Agent assist" : "Buyer"}
        userName={user.name}
        userEmail={user.email ?? ""}
        sidebarNav={<BuyerSidebarNav assistMode={assistMode} />}
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
        mobileNav={<BuyerMobileBottomNav signOutAction={signOut} assistMode={assistMode} />}
        mobileActions={<CartTriggerButton />}
      >
        {children}
      </AppShell>
      <CartDrawer />
    </CartProvider>
  );
}
