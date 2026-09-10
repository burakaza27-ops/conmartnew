// =============================================================================
// ConMart — Product Competing Offers Comparison View
// =============================================================================
// Implements the Programmer's Guide "Competing Offers Comparison":
// - Multiple verified sellers supplying the same product specification
// - Side-by-side table comparing Ex-Works Depot price vs Delivered site estimate
// - MOQ, volume tiers, factory test certificate, and VAT verification badges
// - Direct Purchase Enquiry submission modal attached to each competing offer
// =============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Truck,
  CheckCircle2,
  SendHorizontal,
  Calculator,
  Layers,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  formatPrice,
  getLocalizedUnit,
  getCategoryTitle,
  getLocalizedLocation,
} from "@/lib/i18n/translations";
import { PurchaseRequestModal } from "@/components/enquiry/purchase-request-modal";
import { StartChatButton } from "@/components/chat/start-chat-button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProductWithOffers, CompetingOffer } from "@/lib/data/catalog";

interface ProductOffersViewProps {
  product: ProductWithOffers;
}

export function ProductOffersView({ product }: ProductOffersViewProps) {
  const { locale, t } = useLanguage();
  const [selectedListingForEnquiry, setSelectedListingForEnquiry] = useState<CompetingOffer | null>(
    null
  );
  const [expandedTiersListingId, setExpandedTiersListingId] = useState<string | null>(null);

  const unitLabel = getLocalizedUnit(product.unit, locale);
  const localizedCategory = getCategoryTitle(
    product.category.slug,
    product.category.name,
    locale
  );

  const toggleTiers = (listingId: string) => {
    setExpandedTiersListingId((prev) => (prev === listingId ? null : listingId));
  };

  return (
    <div className="space-y-8">
      {/* Product Hero Header */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-background p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-semibold text-xs">
                {localizedCategory}
              </Badge>
              <Badge className="bg-emerald-600 text-white font-medium text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> {t("offers_spec_verified")}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {product.offers.length} {t("offers_competing_count")}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {product.title}
            </h1>

            {/* Specifications Chips */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <span className="font-semibold capitalize text-foreground">
                      {key.replace(/([A-Z])/g, " $1")}:
                    </span>
                    <span>{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Best Price Callout */}
          {product.offers.length > 0 && product.offers[0].lowestPrice !== null && (
            <div className="shrink-0 rounded-xl border border-primary/30 bg-primary/5 p-5 text-right space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("offers_best_rate")}
              </span>
              <div className="font-mono text-3xl font-extrabold text-foreground">
                {formatPrice(product.offers[0].lowestPrice, locale)}
              </div>
              <div className="text-xs text-muted-foreground">
                per {unitLabel} ({t("offers_ex_works_wholesale")})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Competing Offers Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {t("offers_competing_depots_title")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("offers_competing_depots_desc")}
            </p>
          </div>
        </div>

        {/* Indicative Pricing Disclaimer (Guide Section 8 & 25) */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">
              {t("offers_indicative_title")}
            </span>
            <p className="leading-relaxed text-[11px] opacity-90">
              {t("offers_indicative_desc")}
            </p>
          </div>
        </div>

        {product.offers.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">
            {t("offers_empty_notice")}
          </div>
        ) : (
          <div className="grid gap-4">
            {product.offers.map((offer, index) => {
              const isBestPrice = index === 0;
              const isTiersExpanded = expandedTiersListingId === offer.listingId;

              return (
                <Card
                  key={offer.listingId}
                  className={`overflow-hidden border transition-all ${
                    isBestPrice
                      ? "border-primary/50 shadow-xs"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Row: Depot Info & Price */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">
                            {offer.depotName}
                          </span>
                          {isBestPrice && (
                            <Badge className="bg-primary text-primary-foreground font-semibold text-[10px]">
                              {t("offers_lowest_rate")}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            {offer.sellerType}
                          </Badge>
                          <StatusBadge
                            domain="subscription"
                            status={offer.directChatEnabled ? "ACTIVE" : "FREE"}
                            locale={locale}
                            size="sm"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {getLocalizedLocation(offer.location, locale)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {offer.vatRegistered ? t("offers_vat_included") : t("offers_standard_price")}
                          </span>
                          <span>•</span>
                          <span>{t("offers_moq_label")} <strong className="text-foreground">{offer.moq} {unitLabel}</strong></span>
                        </div>
                      </div>

                      {/* Pricing and Actions */}
                      <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                        <div className="text-xs text-muted-foreground uppercase font-semibold">
                          {t("offers_ex_works_wholesale")}
                        </div>
                        <div className="font-mono text-2xl font-extrabold text-foreground">
                          {offer.lowestPrice !== null
                            ? formatPrice(offer.lowestPrice, locale)
                            : "On Inquiry"}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            /{unitLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tier Expand / Collapse Toggle */}
                    {offer.tiers.length > 1 && (
                      <div className="pt-2 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => toggleTiers(offer.listingId)}
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                        >
                          <span>{offer.tiers.length} {t("offers_volume_tiers_toggle")}</span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${
                              isTiersExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isTiersExpanded && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {offer.tiers.map((tier) => (
                              <div
                                key={tier.id}
                                className="rounded-lg border bg-muted/40 p-2.5 space-y-0.5"
                              >
                                <div className="text-muted-foreground text-[11px]">
                                  {tier.minQty.toLocaleString()} – {tier.maxQty.toLocaleString()}{" "}
                                  {unitLabel}
                                </div>
                                <div className="font-mono font-bold text-foreground">
                                  {formatPrice(tier.unitPrice, locale)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="h-4 w-4 text-primary shrink-0" />
                        <span>{t("offers_freight_available")}</span>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Link
                          href={`/buyer/catalog/${offer.listingId}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "gap-1.5 text-xs font-medium"
                          )}
                        >
                          <Calculator className="h-3.5 w-3.5" />
                          {t("offers_btn_proforma")}
                        </Link>

                        <StartChatButton
                          listingId={offer.listingId}
                          directChatEnabled={offer.directChatEnabled}
                          size="sm"
                          variant={offer.directChatEnabled ? "secondary" : "outline"}
                          className="gap-1.5 text-xs font-semibold"
                        />

                        <Button
                          size="sm"
                          onClick={() => setSelectedListingForEnquiry(offer)}
                          className="gap-1.5 text-xs font-semibold shadow-xs"
                        >
                          <SendHorizontal className="h-3.5 w-3.5" />
                          {t("offers_btn_send_enquiry")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase Request Modal */}
      {selectedListingForEnquiry && (
        <PurchaseRequestModal
          isOpen={Boolean(selectedListingForEnquiry)}
          onClose={() => setSelectedListingForEnquiry(null)}
          listingId={selectedListingForEnquiry.listingId}
          productTitle={product.title}
          unit={product.unit}
          basePrice={selectedListingForEnquiry.lowestPrice ?? undefined}
        />
      )}
    </div>
  );
}
