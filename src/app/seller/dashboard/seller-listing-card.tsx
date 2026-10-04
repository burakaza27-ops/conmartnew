"use client";

// =============================================================================
// ConMart — Seller Listing Card Component
// =============================================================================
// Displays a supplier listing with header meta, quick action buttons,
// active status toggle, and the responsive PriceTierTable.
// =============================================================================

import Link from "next/link";
import { ShoppingCart, MapPin, Pencil, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

interface SellerListingCardProps {
  listing: SellerListingItem;
}

export function SellerListingCard({ listing }: SellerListingCardProps) {
  const { t, locale } = useLanguage();

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
