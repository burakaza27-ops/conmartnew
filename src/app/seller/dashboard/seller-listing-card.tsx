"use client";

// =============================================================================
// ECON — Seller Listing Card Component
// =============================================================================
// Displays a supplier listing with header meta, quick action buttons,
// active status toggle, and the responsive PriceTierTable.
// =============================================================================

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  MapPin,
  Pencil,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getLocalizedUnit,
  getLocalizedLocation,
} from "@/lib/i18n/translations";
import { ListingStatusButton } from "./listing-status-button";
import { PriceTierTable } from "./price-tier-table";
import type { SellerListingItem } from "./types";
import { getProductFallback } from "@/lib/data/category-images";
import { confirmListingAvailability } from "@/app/actions/listings";

interface SellerListingCardProps {
  listing: SellerListingItem;
}

export function SellerListingCard({ listing }: SellerListingCardProps) {
  const { t, locale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

  const unitLabel = getLocalizedUnit(listing.productUnit, locale);
  const localizedLocation = getLocalizedLocation(listing.location, locale);
  const localizedCategory = getCategoryTitle(
    listing.categoryName.toLowerCase(),
    listing.categoryName,
    locale
  );

  const displayImage =
    listing.imageUrl ||
    getProductFallback(listing.categoryName);

  const handleConfirmAvailability = () => {
    startTransition(async () => {
      const res = await confirmListingAvailability(listing.id);
      if (res && res.success && res.updatedAt) {
        setConfirmedAt(res.updatedAt);
      }
    });
  };

  const activeTimestamp = confirmedAt || listing.updatedAt;
  const formattedUpdateDate = activeTimestamp
    ? new Date(activeTimestamp).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isConfirmed = Boolean(confirmedAt);

  return (
    <Card className="overflow-hidden border-border/60 bg-card">
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {localizedCategory}
                </Badge>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{localizedLocation}</span>
                </span>
              </div>
              <CardTitle className="text-base font-bold mt-1 text-foreground line-clamp-2 break-words">
                {listing.productTitle}
              </CardTitle>

              {/* Freshness timestamp + Stock state */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {formattedUpdateDate && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {locale === "am" ? "የታደሰው: " : "Updated: "}
                      <strong className="text-foreground">{formattedUpdateDate}</strong>
                    </span>
                  </span>
                )}
                {listing.stockState && (
                  <Badge variant="outline" className="text-[10px] font-normal uppercase py-0 px-1.5 text-muted-foreground">
                    {listing.stockState.replace(/_/g, " ")}
                  </Badge>
                )}
                {listing.availableQty !== null && listing.availableQty !== undefined && listing.availableQty > 0 && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ({listing.availableQty.toLocaleString()} {unitLabel})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
              <ShoppingCart className="h-3 w-3 text-primary" />
              <span className="font-semibold text-foreground">
                {listing.orderCount}
              </span>{" "}
              {t("seller_orders_badge", "orders")}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
              <span className="font-semibold text-foreground">
                {listing.enquiryCount}
              </span>{" "}
              {t("seller_enquiries_badge", "enquiries")}
            </div>

            {/* Confirm Still Available Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConfirmAvailability}
              disabled={isPending}
              className={cn(
                "h-8 gap-1.5 text-xs font-semibold transition-all",
                isConfirmed
                  ? "border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "hover:bg-muted text-foreground"
              )}
              title="Confirm that materials are currently in stock and fresh"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isConfirmed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
              )}
              <span>
                {isConfirmed
                  ? (locale === "am" ? "ዛሬ ተረጋግጧል" : "Confirmed Today")
                  : (locale === "am" ? "አለ አረጋግጥ" : "Confirm Available")}
              </span>
            </Button>

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
              <span>{t("seller_btn_edit", "Edit")}</span>
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
              <span className="hidden sm:inline">{t("seller_btn_preview", "Preview")}</span>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <PriceTierTable priceTiers={listing.priceTiers} unitLabel={unitLabel} />
      </CardContent>
    </Card>
  );
}
