"use client";

import { Package, PlusCircle, LogOut, Wallet, Inbox, MessageCircle, Handshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileTabLink, SidebarNavLink } from "@/components/layout/nav-link";
import { useLanguage } from "@/lib/i18n/language-context";
import { signOut } from "@/app/actions/auth";

export function SellerSidebarNav() {
  const { t } = useLanguage();

  const links = [
    { href: "/seller/dashboard", label: t("seller_my_listings"), icon: Package, exact: true },
    { href: "/seller/enquiries", label: t("enquiries_title"), icon: Inbox },
    { href: "/seller/messages", label: t("chat_inbox_title", "Messages"), icon: MessageCircle },
    { href: "/seller/deals", label: t("deals_nav", "Agent deals"), icon: Handshake },
    { href: "/seller/wallet", label: t("wallet_title"), icon: Wallet, exact: true },
    { href: "/seller/listings/new", label: t("seller_add_material"), icon: PlusCircle, exact: true },
  ];

  return (
    <nav className="space-y-1">
      {links.map((item) => (
        <SidebarNavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}

export function SellerBottomNav() {
  const { t } = useLanguage();

  return (
    <>
      <MobileTabLink href="/seller/dashboard" label={t("seller_my_listings")} icon={Package} exact />
      <MobileTabLink href="/seller/enquiries" label={t("enquiries_tab_all")} icon={Inbox} />
      <MobileTabLink href="/seller/messages" label={t("chat_inbox_title", "Chat")} icon={MessageCircle} />
      <MobileTabLink href="/seller/deals" label={t("deals_nav", "Deals")} icon={Handshake} />
      <MobileTabLink href="/seller/wallet" label={t("wallet_title")} icon={Wallet} exact />
      <MobileTabLink href="/seller/listings/new" label={t("seller_add_material")} icon={PlusCircle} exact />
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

export function SellerSignOutButton() {
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
