import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
import { AgentBottomNav, AgentSidebarNav, AgentSignOutButton } from "./agent-nav";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["FIELD_AGENT", "ADMIN"], "/agent");

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
