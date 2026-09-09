// =============================================================================
// ConMart — Listing Detail Client View (Bilingual English & Amharic)
// =============================================================================
// Displays hero product photo, verified supplier info, technical specifications,
// volume pricing tier schedule, interactive Proforma calculator, and depot bundling.
// =============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  Truck,
  CheckCircle2,
  SendHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getLocalizedUnit,
  getLocalizedLocation,
} from "@/lib/i18n/translations";
import { PricingCalculator } from "./pricing-calculator";
import { DepotMaterialsTable } from "./depot-materials-table";
import { PurchaseRequestModal } from "@/components/enquiry/purchase-request-modal";
import { StartChatButton } from "@/components/chat/start-chat-button";
import type { CatalogListing, ListingDetail } from "@/lib/data/catalog";

interface ListingDetailViewProps {
  listing: ListingDetail;
  depotListings: CatalogListing[];
  adminPhone: string;
  platformFeePercent: number;
  vatRatePercent: number;
}

export function ListingDetailView({
  listing,
  depotListings,
  adminPhone,
  platformFeePercent,
  vatRatePercent,
}: ListingDetailViewProps) {
  const { t, locale } = useLanguage();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const localizedCategoryName = getCategoryTitle(
    listing.product.category.slug,
    listing.product.category.name,
    locale
  );

  const unitLabel = getLocalizedUnit(listing.product.unit, locale);
  const localizedLocation = getLocalizedLocation(listing.location, locale);

  // Filter to only non-expired tiers for the pricing calculator
  const activeTiers = listing.priceTiers.filter((tier) => !tier.isExpired);

  const displayImage =
    listing.imageUrl ||
    listing.product.imageUrl ||
    "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=1200&q=80";

  const specsEntries = listing.product.specs
    ? Object.entries(listing.product.specs)
    : [];

  return (
    <div className="space-y-6">
      {/* --- Back Navigation --- */}
      <Link
        href={`/buyer/category/${listing.product.category.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("detail_back_to_catalog").replace("{category}", localizedCategoryName)}
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* --- Left Column: Listing Info & Specs (3 cols) --- */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero Product Photo */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-md aspect-[16/10] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={listing.product.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary" className="backdrop-blur-md bg-background/90 text-xs font-semibold">
                {localizedCategoryName}
              </Badge>
              <Badge className="bg-success/90 text-success-foreground backdrop-blur-md text-xs font-medium gap-1">
                <CheckCircle2 className="h-3 w-3" /> {t("detail_in_stock")}
              </Badge>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="heading-display text-2xl text-white drop-shadow-md sm:text-3xl">
                {listing.product.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/90 drop-shadow">
                <span className="flex items-center gap-1 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  {t("detail_partner_depot")}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {localizedLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier Trust Banner */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("detail_managed_title")}</p>
                <p className="text-muted-foreground">{t("detail_managed_subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground hidden sm:flex">
              <Truck className="h-4 w-4 text-primary" />
              <span>{t("detail_freight_badge")}</span>
            </div>
          </div>

          {/* Product Specifications */}
          {specsEntries.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{t("detail_specs_title")}</span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {t("detail_specs_verified")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {specsEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b border-border/30 pb-2 text-xs"
                    >
                      <span className="font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="font-semibold text-foreground text-right">
                        {String(value ?? "")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Volume Price Tier Table */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>
                  {t("detail_pricing_title")} ({unitLabel})
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {t("detail_supplier_schedule")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">{t("detail_col_tier")}</TableHead>
                    <TableHead className="text-xs font-semibold">{t("detail_col_price")}</TableHead>
                    <TableHead className="text-xs font-semibold">{t("detail_col_valid")}</TableHead>
                    <TableHead className="text-xs font-semibold">{t("detail_col_status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listing.priceTiers.map((tier) => (
                    <TableRow
                      key={tier.id}
                      className={tier.isExpired ? "opacity-40" : ""}
                    >
                      <TableCell className="font-semibold text-xs">
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
                          {tier.validUntil.toLocaleDateString(
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
                          variant={tier.isExpired ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {tier.isExpired ? t("detail_tier_expired") : t("detail_tier_active")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Other Materials Available at this Depot (Single-Trip Freight Savings) */}
          <DepotMaterialsTable
            depotName={listing.seller.companyName}
            location={listing.location}
            listings={depotListings}
          />
        </div>

        {/* --- Right Column: Pricing Calculator (2 cols) --- */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <PricingCalculator
              listingId={listing.id}
              sellerId={listing.seller.id}
              depotCode={listing.seller.companyName}
              location={listing.location}
              productTitle={listing.product.title}
              unitLabel={unitLabel}
              tiers={activeTiers.map((tier) => ({
                id: tier.id,
                minQty: tier.minQty,
                maxQty: tier.maxQty,
                unitPrice: tier.unitPrice,
              }))}
              platformFeePercent={platformFeePercent}
              vatRatePercent={vatRatePercent}
            />

            {/* Send Verified Purchase Enquiry Button */}
            <Button
              size="lg"
              onClick={() => setIsEnquiryOpen(true)}
              className="w-full gap-2 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <SendHorizontal className="h-4 w-4" />
              {t("buyer_request_enquiry_btn")}
            </Button>

            <StartChatButton
              listingId={listing.id}
              directChatEnabled={listing.directChatEnabled}
              variant={listing.directChatEnabled ? "secondary" : "outline"}
              className="w-full gap-2 font-semibold"
            />

            {/* Warehouse & Supplier Depot */}
            <Card className="border-border/60 bg-card">
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    {t("detail_yard_label")}
                  </p>
                  <p className="font-medium text-foreground mt-0.5">
                    {localizedLocation}
                  </p>
                </div>
                <div className="border-t border-border/40 pt-2">
                  <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    {t("detail_escrow_desk_title")}
                  </p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {t("detail_escrow_desk_name")}
                  </p>
                  <p className="text-muted-foreground">
                    {t("detail_direct_coordination")} {adminPhone}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Purchase Request Modal */}
      <PurchaseRequestModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        listingId={listing.id}
        productTitle={listing.product.title}
        unit={listing.product.unit}
        basePrice={activeTiers[0]?.unitPrice}
      />
    </div>
  );
}
