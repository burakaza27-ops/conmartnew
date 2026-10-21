"use client";

import { BarChart3, CreditCard, LogOut, Settings, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileTabLink, SidebarNavLink } from "@/components/layout/nav-link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useLanguage } from "@/lib/i18n/language-context";

export function AdminSidebarNav() {
  const { t, locale } = useLanguage();

  return (
    <nav className="space-y-1">
      <SidebarNavLink
        href="/admin/command-center"
        label={t("nav_command_center")}
        icon={BarChart3}
        exact
      />
      <SidebarNavLink
        href="/admin/subscriptions"
        label={locale === "am" ? "የአቅራቢዎች ደንበኝነት" : "Supplier Subscriptions"}
        icon={CreditCard}
        exact
      />
      <SidebarNavLink
        href="/admin/agents"
        label={locale === "am" ? "የወኪሎች ማረጋገጫ" : "Agent Vetting"}
        icon={Users}
        exact
      />
      <SidebarNavLink
        href="/agent/leads"
        label={locale === "am" ? "የገዢዎች መሪዎች (Leads)" : "Guided Leads Inbox"}
        icon={UserCheck}
        exact
      />
      <SidebarNavLink
        href="/account/settings"
        label={t("nav_account_settings", "Settings")}
        icon={Settings}
        exact
      />
    </nav>
  );
}

export function AdminBottomNav() {
  const { t, locale } = useLanguage();

  return (
    <>
      <MobileTabLink
        href="/admin/command-center"
        label={t("nav_command_center")}
        icon={BarChart3}
        exact
      />
      <MobileTabLink
        href="/admin/subscriptions"
        label={locale === "am" ? "ደንበኝነት" : "Subscriptions"}
        icon={CreditCard}
        exact
      />
      <MobileTabLink
        href="/admin/agents"
        label={locale === "am" ? "ወኪሎች" : "Agents"}
        icon={Users}
        exact
      />
      <MobileTabLink
        href="/agent/leads"
        label={locale === "am" ? "መሪዎች" : "Leads"}
        icon={UserCheck}
        exact
      />

      <SignOutButton variant="mobile-tab" />
    </>
  );
}

export function AdminSignOutButton() {
  return <SignOutButton variant="sidebar-item" />;
}
