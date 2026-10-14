"use client";

// =============================================================================
// ECON — Seller Subscription Status Card
// =============================================================================
// Summarizes the supplier's chat subscription tier (Free vs Subscribed Direct Chat),
// expiration details, and quick links to agent deals and inbox messages.
// =============================================================================

import Link from "next/link";
import { Lock, Unlock, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import type { SellerSubscriptionInfo } from "./types";

interface SellerSubscriptionCardProps {
  subscription: SellerSubscriptionInfo;
}

export function SellerSubscriptionCard({ subscription }: SellerSubscriptionCardProps) {
  const { t, locale } = useLanguage();

  const isActive = subscription.directChatEnabled;

  return (
    <Card className={cn(
      "border-border/60",
      isActive
        ? "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10"
        : "border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10"
    )}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            isActive ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"
          )}>
            {isActive ? (
              <Unlock className="size-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock className="size-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {t("seller_sub_title", "Subscription Status")}
              </p>
              <StatusBadge
                domain="subscription"
                status={subscription.effectiveStatus}
                locale={locale}
                size="sm"
              />
            </div>

            {/* Primary message — what subscription status means for buyers */}
            <p className={cn(
              "text-xs font-medium",
              isActive ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            )}>
              {isActive
                ? (locale === "am"
                    ? "✓ ምዝገባዎ ገቢር ነው — ገዢዎች የእርስዎን ዝርዝር የእውቂያ መረጃ ያዩና በቀጥታ ያገኝዎታል።"
                    : "✓ Subscription active — buyers can see your contact details and reach you directly.")
                : (locale === "am"
                    ? "⚠ ምዝገባ ገቢር አይደለም — ገዢዎች በ ECON ወኪል ማስተዋወቂያ ብቻ ያገኝዎታል።"
                    : "⚠ Subscription inactive — buyers can only reach you through an ECON agent introduction.")}
            </p>

            {/* Secondary detail */}
            <p className="text-[11px] text-muted-foreground">
              {isActive
                ? (locale === "am"
                    ? "ቀጥታ ውይይት ተከፍቷል። ስልክ ቁጥሮች በዚህ ሰርጥ ሊለዋወጡ ይችላሉ።"
                    : "Direct 1-on-1 chat with buyers is unlocked. Phone numbers may be exchanged.")
                : (locale === "am"
                    ? "ቀጥታ ውይይት ተዘግቷል። ገዢ ጥያቄዎች ወደ አካባቢ ወኪል ይመራሉ።"
                    : "Direct chat is locked. All buyer enquiries are routed through a local agent.")}
            </p>

            {subscription.expiresAt ? (
              <p className="text-2xs text-muted-foreground">
                {t("seller_sub_expires", "Expires")}{" "}
                {new Date(subscription.expiresAt).toLocaleDateString(
                  locale === "am" ? "am-ET" : "en-US"
                )}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 self-end sm:self-auto">
          {!isActive ? (
            <Link
              href="/seller/subscription"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5 font-semibold text-xs")}
            >
              <Unlock className="size-3.5" />
              {locale === "am" ? "ምዝገባ አሳድግ" : "Upgrade Plan"}
            </Link>
          ) : null}
          <Link
            href="/seller/messages"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 font-semibold text-xs")}
          >
            <MessageCircle className="size-3.5" />
            {t("chat_inbox_title", "Messages")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
