"use client";

import { BarChart3, CreditCard, LogOut, Settings, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileTabLink, SidebarNavLink } from "@/components/layout/nav-link";
import { useLanguage } from "@/lib/i18n/language-context";
import { signOut } from "@/app/actions/auth";

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

      <form action={signOut} className="flex flex-1">
        <button
          type="submit"
          className="flex w-full flex-col items-center gap-0.5 px-1 py-1 text-2xs font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-5" />
          <span>{t("nav_sign_out")}</span>
        </button>
      </form>
    </>
  );
}

export function AdminSignOutButton() {
  const { t } = useLanguage();

  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
      >
        <LogOut className="size-4" />
        {t("nav_sign_out")}
      </Button>
    </form>
  );
}
