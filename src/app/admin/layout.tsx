import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
import {
  AdminSidebarNav,
  AdminBottomNav,
  AdminSignOutButton,
} from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["ADMIN"], "/admin/command-center");

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
