"use client";

// =============================================================================
// ConMart — Seller Subscription Status Card
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

  return (
    <Card className="border-border/60">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {subscription.directChatEnabled ? (
              <Unlock className="size-5 text-primary" />
            ) : (
              <Lock className="size-5 text-warning" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {t("seller_sub_title", "Chat subscription")}
              </p>
              <StatusBadge
                domain="subscription"
                status={subscription.effectiveStatus}
                locale={locale}
                size="sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {subscription.directChatEnabled
                ? t(
                    "seller_sub_active_desc",
                    "Direct 1-on-1 chat with buyers is unlocked. Phone numbers may be exchanged in that channel."
                  )
                : t(
                    "seller_sub_free_desc",
                    "Direct chat is locked. Every buyer conversation is routed to a local agent in the listing's zone."
                  )}
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
          {!subscription.directChatEnabled ? (
            <Link
              href="/seller/deals"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 font-semibold text-xs")}
            >
              {t("deals_nav", "Agent deals")}
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
