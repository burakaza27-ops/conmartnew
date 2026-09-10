// =============================================================================
// ConMart — Seller Dashboard Client View (Bilingual English & Amharic)
// =============================================================================
// Displays supplier inventory, image thumbnails, volume price tiers,
// order counters, and active status toggles with direct "List New Material" CTA.
// =============================================================================

"use client";

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

interface SellerDashboardViewProps {
  listings: SellerListingItem[];
  subscription: {
    storedStatus: string;
    effectiveStatus: string;
    expiresAt: string | null;
    directChatEnabled: boolean;
  };
}

export function SellerDashboardView({ listings, subscription }: SellerDashboardViewProps) {
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
