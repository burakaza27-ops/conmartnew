"use client";

import { LayoutGrid, Package, FileText, SendHorizontal, LogOut, MessageCircle } from "lucide-react";

import { MobileTabLink, SidebarNavLink } from "@/components/layout/nav-link";
import { useLanguage } from "@/lib/i18n/language-context";

export function BuyerSidebarNav() {
  const { t } = useLanguage();

  const links = [
    { href: "/buyer", label: t("nav_categories", "Categories"), icon: LayoutGrid, exact: true },
    { href: "/buyer/category/all", label: t("nav_all_materials", "All materials"), icon: Package },
    { href: "/buyer/enquiries", label: t("buyer_enquiries_title", "My enquiries"), icon: SendHorizontal },
    { href: "/buyer/messages", label: t("chat_inbox_title", "Messages"), icon: MessageCircle },
    { href: "/buyer/orders", label: t("nav_bank_proformas", "Bank proformas"), icon: FileText },
  ];

  return (
    <nav className="space-y-1">
      {links.map((item) => (
        <SidebarNavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}

export function BuyerMobileBottomNav({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const { t } = useLanguage();

  const links = [
    { href: "/buyer", label: t("nav_categories", "Home"), icon: LayoutGrid, exact: true },
    { href: "/buyer/category/all", label: t("nav_all_materials", "Materials"), icon: Package },
    { href: "/buyer/enquiries", label: t("buyer_enquiries_title", "Enquiries"), icon: SendHorizontal },
    { href: "/buyer/messages", label: t("chat_inbox_title", "Chat"), icon: MessageCircle },
  ];

  return (
    <>
      {links.map((item) => (
        <MobileTabLink key={item.href} {...item} />
      ))}
      <form action={signOutAction} className="flex flex-1">
        <button
          type="submit"
          className="flex w-full flex-col items-center gap-0.5 px-1 py-1 text-2xs font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-5" />
          <span>{t("nav_sign_out", "Sign out")}</span>
        </button>
      </form>
    </>
  );
}
