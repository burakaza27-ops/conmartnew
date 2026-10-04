"use client";

// =============================================================================
// ConMart — Seller Referral Program Card
// =============================================================================
// Visual referral dashboard showing copyable link, milestone progress,
// unlocked subscription months, and recent supplier referrals.
// =============================================================================

import { useState } from "react";
import { Gift, Copy, Check, Users, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import type { ReferralData } from "./types";

interface SellerReferralCardProps {
  referral: ReferralData;
}

export function SellerReferralCard({ referral }: SellerReferralCardProps) {
  const { t, locale } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referral.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = referral.referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const maxCount = referral.milestones[referral.milestones.length - 1]?.count ?? 10;
  const progressPercent = Math.min((referral.qualifiedReferrals / maxCount) * 100, 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              {t("referral_card_title", "Refer & Earn Free Subscription")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t(
                "referral_card_desc",
                "Invite suppliers to ConMart. When they register and list materials, you earn free Direct Chat months."
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Link */}
        <div className="space-y-1.5">
          <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("referral_your_link", "Your referral link")}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="truncate text-xs font-mono text-foreground">
                {referral.referralLink}
              </p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 font-semibold shrink-0 transition-colors",
                copied && "border-green-500/50 bg-green-500/10 text-green-600"
              )}
            >
              {copied ? (
                <>
                  <Check className="size-3.5" />
                  {t("referral_copied", "Copied!")}
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  {t("referral_copy", "Copy")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                {referral.qualifiedReferrals}
              </span>
              <span className="text-xs text-muted-foreground">
                / {maxCount} {t("referral_qualified", "qualified")}
              </span>
            </div>
            {referral.earnedMonths > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 bg-green-500/10 text-green-700 border-green-500/20 text-[10px]"
              >
                <Trophy className="size-3" />
                {referral.earnedMonths} {t("referral_months_earned", "month(s) earned")}
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
            {referral.milestones.map((milestone) => (
              <div
                key={milestone.count}
                className="absolute top-1/2 -translate-y-1/2 h-3 w-px bg-foreground/20"
                style={{ left: `${(milestone.count / maxCount) * 100}%` }}
              />
            ))}
          </div>

          {/* Milestone labels */}
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {referral.milestones.map((milestone) => {
              const reached = referral.qualifiedReferrals >= milestone.count;
              return (
                <div
                  key={milestone.count}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors",
                    reached && "text-primary font-semibold"
                  )}
                >
                  <span>
                    {milestone.count} {t("referral_refs", "refs")}
                  </span>
                  <span className={cn(reached ? "text-green-600 font-medium" : "text-muted-foreground/60")}>
                    {milestone.months} {t("referral_mo", "mo")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending vs Qualified breakdown */}
        {referral.totalReferrals > 0 && (
          <div className="rounded-lg border border-border/50 bg-card/50 p-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  {t("referral_qualified_label", "Qualified")}:
                </span>
                <span className="font-semibold text-foreground">
                  {referral.qualifiedReferrals}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground">
                  {t("referral_pending_label", "Pending")}:
                </span>
                <span className="font-semibold text-foreground">
                  {referral.totalReferrals - referral.qualifiedReferrals}
                </span>
              </div>
            </div>
            {referral.totalReferrals > referral.qualifiedReferrals && (
              <p className="mt-1.5 text-2xs text-muted-foreground">
                {t(
                  "referral_pending_hint",
                  "Pending referrals qualify once the supplier lists at least one material."
                )}
              </p>
            )}
          </div>
        )}

        {/* Referred suppliers list */}
        {referral.referrals.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("referral_recent", "Recent referrals")}
            </p>
            <div className="space-y-1">
              {referral.referrals.slice(0, 5).map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between rounded-md bg-muted/20 px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {ref.referredCompany || ref.referredName}
                    </p>
                    <p className="text-2xs text-muted-foreground">
                      {new Date(ref.createdAt).toLocaleDateString(
                        locale === "am" ? "am-ET" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={ref.qualified ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] shrink-0",
                      ref.qualified
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : "text-muted-foreground"
                    )}
                  >
                    {ref.qualified
                      ? t("referral_status_qualified", "Qualified")
                      : t("referral_status_pending", "Pending")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
