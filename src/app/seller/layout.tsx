import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
import { getUnreadCountAction } from "@/app/actions/notifications";
import {
  SellerSidebarNav,
  SellerBottomNav,
  SellerSignOutButton,
} from "./seller-nav";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["SELLER", "ADMIN"], "/seller/dashboard");
  const notifResult = await getUnreadCountAction();
  const unreadNotifications = notifResult.success ? notifResult.data : 0;

  return (
    <AppShell
      portal="Seller"
      userName={user.name}
      userEmail={user.email ?? ""}
      userId={user.id}
      unreadNotifications={unreadNotifications}
      sidebarNav={<SellerSidebarNav />}
      sidebarFooter={<SellerSignOutButton />}
      mobileNav={<SellerBottomNav />}
    >
      {children}
    </AppShell>
  );
}
