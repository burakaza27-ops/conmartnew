"use client";

import { Briefcase, LogOut, MessageCircle, Package, Settings, UserCheck, DollarSign, ShieldCheck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileTabLink, SidebarNavLink } from "@/components/layout/nav-link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useLanguage } from "@/lib/i18n/language-context";

export function AgentSidebarNav() {
  const { t, locale } = useLanguage();

  const links = [
    { href: "/agent/leads", label: locale === "am" ? "የገዢዎች መሪዎች (Leads)" : "Dispatch Leads", icon: UserCheck, exact: true },
    { href: "/agent/wallet", label: locale === "am" ? "የስራ ክሬዲት ቦርሳ (Wallet)" : "Job Credits & Wallet", icon: Wallet, exact: true },
    { href: "/agent/apply", label: locale === "am" ? "የወኪል ማመልከቻ" : "Driver Station & Vetting", icon: ShieldCheck, exact: true },
    { href: "/agent/commissions", label: locale === "am" ? "የኮሚሽን ሂሳብ" : "Commission Ledger", icon: DollarSign, exact: true },
    { href: "/agent", label: t("agent_job_board", "Legacy Job board"), icon: Briefcase, exact: true },
    { href: "/agent/messages", label: t("chat_inbox_title", "Messages"), icon: MessageCircle },
    {
      href: "/buyer/category/all",
      label: t("agent_browse_materials", "Browse materials"),
      icon: Package,
    },
    { href: "/account/settings", label: t("nav_account_settings", "Settings"), icon: Settings, exact: true },
  ];

  return (
    <nav className="space-y-1">
      {links.map((item) => (
        <SidebarNavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}

export function AgentBottomNav() {
  const { t, locale } = useLanguage();

  return (
    <>
      <MobileTabLink href="/agent/leads" label={locale === "am" ? "መሪዎች" : "Leads"} icon={UserCheck} exact />
      <MobileTabLink href="/agent/wallet" label={locale === "am" ? "ቦርሳ" : "Wallet"} icon={Wallet} exact />
      <MobileTabLink href="/agent/commissions" label={locale === "am" ? "ኮሚሽን" : "Earned"} icon={DollarSign} exact />
      <MobileTabLink href="/agent/messages" label={t("chat_inbox_title", "Messages")} icon={MessageCircle} />

      <MobileTabLink
        href="/buyer/category/all"
        label={t("agent_browse_materials", "Catalog")}
        icon={Package}
      />
      <SignOutButton variant="mobile-tab" />
    </>
  );
}

export function AgentSignOutButton() {
  return <SignOutButton variant="sidebar-item" />;
}
