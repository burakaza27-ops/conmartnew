"use client";

import { Package, PlusCircle, LogOut, CreditCard, Inbox, MessageCircle, Handshake, Settings, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileTabLink, SidebarNavLink } from "@/components/layout/nav-link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useLanguage } from "@/lib/i18n/language-context";

export function SellerSidebarNav() {
  const { t, locale } = useLanguage();

  const links = [
    { href: "/seller/dashboard", label: locale === "am" ? "የመረጃ ሰሌዳ" : "Leads & Dashboard", icon: Package, exact: true },
    { href: "/seller/subscription", label: locale === "am" ? "የደንበኝነት ምዝገባ" : "Subscription & Billing", icon: CreditCard, exact: true },
    { href: "/seller/enquiries", label: t("enquiries_title"), icon: Inbox },
    { href: "/seller/messages", label: t("chat_inbox_title", "Messages"), icon: MessageCircle },
    { href: "/seller/deals", label: t("deals_nav", "Agent deals"), icon: Handshake },
    { href: "/account/settings", label: t("nav_account_settings", "Settings"), icon: Settings, exact: true },
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
  const { locale, t } = useLanguage();

  return (
    <>
      <MobileTabLink href="/seller/dashboard" label={locale === "am" ? "ዋና ገጽ" : "Home"} icon={Package} exact />
      <MobileTabLink href="/seller/listings/new" label={locale === "am" ? "ቁሳቁስ" : "Materials"} icon={Layers} exact />
      <MobileTabLink href="/seller/enquiries" label={locale === "am" ? "ጥያቄዎች" : "Requests"} icon={Inbox} />
      <MobileTabLink href="/seller/subscription" label={locale === "am" ? "ደንበኝነት" : "Plan"} icon={CreditCard} exact />
      <MobileTabLink href="/account/settings" label={locale === "am" ? "መለያ" : "Account"} icon={Settings} exact />
      <SignOutButton variant="mobile-tab" />
    </>
  );
}


export function SellerSignOutButton() {
  return <SignOutButton variant="sidebar-item" />;
}
