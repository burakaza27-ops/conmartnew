// =============================================================================
// ECON — Seller Dashboard Client View (Bilingual English & Amharic)
// =============================================================================
// Displays supplier inventory, image thumbnails, volume price tiers,
// order counters, active status toggles, referral program card, and
// direct "List New Material" CTA.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Package,
  ShoppingCart,
  PlusCircle,
  ExternalLink,
  MapPin,
  Pencil,
  Lock,
  Unlock,
  MessageCircle,
  Gift,
  Copy,
  Check,
  Users,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatETB } from "@/lib/types";
import { ListingStatusButton } from "./listing-status-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getLocalizedUnit,
  getLocalizedLocation,
} from "@/lib/i18n/translations";

export interface SellerListingItem {
  id: string;
  active: boolean;
  location: string;
  imageUrl: string | null;
  productTitle: string;
  productUnit: string;
  categoryName: string;
  orderCount: number;
  enquiryCount: number;
  priceTiers: {
    id: string;
    minQty: number;
    maxQty: number;
    unitPrice: number;
    validUntil: string;
    isExpired: boolean;
  }[];
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  earnedMonths: number;
  currentMilestone: number;
  nextMilestone: { count: number; months: number } | null;
  milestones: { count: number; months: number }[];
  referrals: {
    id: string;
    qualified: boolean;
    qualifiedAt: string | null;
    createdAt: string;
    referredName: string;
    referredCompany: string;
  }[];
}

interface SellerDashboardViewProps {
  listings: SellerListingItem[];
  subscription: {
    storedStatus: string;
    effectiveStatus: string;
    expiresAt: string | null;
    directChatEnabled: boolean;
  };
  referral: ReferralData | null;
}

export function SellerDashboardView({ listings, subscription, referral }: SellerDashboardViewProps) {
  const { t, locale } = useLanguage();
  const totalOrders = listings.reduce((sum, listing) => sum + listing.orderCount, 0);
  const totalEnquiries = listings.reduce((sum, listing) => sum + listing.enquiryCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("seller_inventory_title")}
        description={t("seller_inventory_subtitle")}
        actions={
          <Link
            href="/seller/listings/new"
            className={cn(buttonVariants({ size: "default" }), "font-semibold")}
          >
            <PlusCircle className="size-4" />
            {t("seller_btn_add")}
          </Link>
        }
      />

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
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
          <div className="flex flex-wrap gap-2">
            {!subscription.directChatEnabled ? (
              <Link
                href="/seller/deals"
                className={cn(buttonVariants({ variant: "outline" }), "gap-2 font-semibold")}
              >
                {t("deals_nav", "Agent deals")}
              </Link>
            ) : null}
            <Link
              href="/seller/messages"
              className={cn(buttonVariants({ variant: "outline" }), "gap-2 font-semibold")}
            >
              <MessageCircle className="size-4" />
              {t("chat_inbox_title", "Messages")}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Referral Card */}
      {referral && <ReferralCard referral={referral} locale={locale} t={t} />}

      {listings.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <Package className="size-4 text-muted-foreground" />
              <div>
                <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("seller_stat_listings", "Listings")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{listings.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingCart className="size-4 text-primary" />
              <div>
                <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("seller_stat_orders", "Orders")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{totalOrders}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <MessageCircle className="size-4 text-muted-foreground" />
              <div>
                <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("seller_stat_enquiries", "Enquiries")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{totalEnquiries}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("seller_empty_title")}
          description={t("seller_empty_desc")}
          action={
            <Link
              href="/seller/listings/new"
              className={cn(buttonVariants(), "font-semibold")}
            >
              <PlusCircle className="size-4" />
              {t("seller_btn_list_first")}
            </Link>
          }
          className="rounded-2xl border border-dashed border-border bg-card/40"
        />
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => {
            const unitLabel = getLocalizedUnit(listing.productUnit, locale);
            const localizedLocation = getLocalizedLocation(listing.location, locale);
            const localizedCategory = getCategoryTitle(
              listing.categoryName.toLowerCase(),
              listing.categoryName,
              locale
            );

            const displayImage =
              listing.imageUrl ||
              "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80";

            return (
              <Card key={listing.id} className="overflow-hidden border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Material Title and Thumbnail */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayImage}
                          alt={listing.productTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {localizedCategory}
                          </Badge>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {localizedLocation}
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold mt-1 text-foreground">
                          {listing.productTitle}
                        </CardTitle>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                        <ShoppingCart className="h-3 w-3 text-primary" />
                        <span className="font-semibold text-foreground">
                          {listing.orderCount}
                        </span>{" "}
                        {t("seller_orders_badge")}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                        <span className="font-semibold text-foreground">
                          {listing.enquiryCount}
                        </span>{" "}
                        {t("seller_enquiries_badge", "enquiries")}
                      </div>

                      <ListingStatusButton
                        listingId={listing.id}
                        initialActive={listing.active}
                      />

                      <Link
                        href={`/seller/listings/${listing.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 gap-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                        )}
                        title="Edit Material & Pricing Tiers"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                        <span>{t("seller_btn_edit")}</span>
                      </Link>

                      <Link
                        href={`/buyer/catalog/${listing.id}`}
                        target="_blank"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        )}
                        title="View Public Catalog Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("seller_btn_preview")}</span>
                      </Link>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">{t("seller_col_tier")}</TableHead>
                        <TableHead className="text-xs font-semibold">{t("seller_col_price")}</TableHead>
                        <TableHead className="text-xs font-semibold">{t("seller_col_valid")}</TableHead>
                        <TableHead className="text-xs font-semibold">{t("seller_col_status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listing.priceTiers.map((tier) => (
                        <TableRow
                          key={tier.id}
                          className={tier.isExpired ? "opacity-50" : ""}
                        >
                          <TableCell className="font-medium text-xs">
                            {tier.minQty.toLocaleString()} –{" "}
                            {tier.maxQty.toLocaleString()} {unitLabel}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-foreground">
                            {formatETB(tier.unitPrice, locale)}
                            <span className="text-[10px] font-normal text-muted-foreground ml-1">
                              /{unitLabel}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(tier.validUntil).toLocaleDateString(
                                locale === "am" ? "am-ET" : "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tier.isExpired ? "destructive" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {tier.isExpired ? t("detail_tier_expired") : t("detail_tier_active")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {listing.priceTiers.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-xs text-muted-foreground py-4"
                          >
                            {t("seller_no_tiers")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Referral Card Component
// =============================================================================

function ReferralCard({
  referral,
  locale,
  t,
}: {
  referral: ReferralData;
  locale: string;
  t: (key: string, fallback?: string) => string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referral.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
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
  const progressPercent = Math.min(
    (referral.qualifiedReferrals / maxCount) * 100,
    100
  );

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              {t("referral_card_title", "Refer & Earn Free Subscription")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t(
                "referral_card_desc",
                "Invite suppliers to ECON. When they register and list materials, you earn free Direct Chat months."
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
            {/* Milestone markers */}
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
                  <span className={cn(reached ? "text-green-600" : "text-muted-foreground/60")}>
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

