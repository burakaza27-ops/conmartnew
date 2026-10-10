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
  Phone,
  MessageCircle,
  UserCheck,
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
import { AuthGateButton } from "@/components/auth/auth-gate-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { GetGuidedModal } from "@/components/leads/get-guided-modal";
import { logLeadEventAction } from "@/app/actions/leads";
import { SYSTEM_CONTACTS } from "@/lib/config/system-contacts";
import type { ProductWithOffers, CompetingOffer } from "@/lib/data/catalog";


interface ProductOffersViewProps {
  product: ProductWithOffers;
  /** Whether the current visitor has an active session. */
  isAuthenticated?: boolean;
}

export function ProductOffersView({ product, isAuthenticated = false }: ProductOffersViewProps) {
  const { locale, t } = useLanguage();
  const [selectedListingForEnquiry, setSelectedListingForEnquiry] = useState<CompetingOffer | null>(
    null
  );
  const [guidedOfferModal, setGuidedOfferModal] = useState<CompetingOffer | null>(null);
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

  const handleCallClick = (offer: CompetingOffer) => {
    logLeadEventAction({
      sellerId: offer.sellerId,
      eventType: "CALL_CLICK",
      listingId: offer.listingId,
    });
  };

  const handleWhatsAppClick = (offer: CompetingOffer) => {
    logLeadEventAction({
      sellerId: offer.sellerId,
      eventType: "WHATSAPP_CLICK",
      listingId: offer.listingId,
    });
  };


  return (
    <div className="space-y-8 pb-24 md:pb-8">
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
                          <span title={locale === "am" ? "አነስተኛ የትዕዛዝ መጠን" : "Minimum Order Quantity"}>
                            {t("offers_moq_label")} <strong className="text-foreground">{offer.moq} {unitLabel}</strong>
                            <span className="text-[10px] text-muted-foreground opacity-75 ml-1">
                              ({locale === "am" ? "አነስተኛ ትዕዛዝ" : "Min. Order"})
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Pricing and Actions */}
                      <div className="flex flex-col sm:items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground uppercase font-semibold">
                            {t("offers_ex_works_wholesale")}
                          </span>
                          <span
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                            title={locale === "am" ? "በራስዎ ትራንስፖርት ከመጋዘን የሚጫን" : "Pickup from seller depot with your own transport"}
                          >
                            {locale === "am" ? "መጋዘን ጫኝ" : "Depot pickup"}
                          </span>
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

                      <div className="flex flex-wrap items-center gap-2 ml-auto">
                        {offer.isSubscribed && offer.directPhone ? (
                          <>
                            <a
                              href={`tel:${offer.directPhone.replace(/\s+/g, "")}`}
                              onClick={() => handleCallClick(offer)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>{locale === "am" ? "ይደውሉ" : "Call"}</span>
                            </a>
                            {(offer.whatsappNumber || offer.directPhone) && (
                              <a
                                href={`https://wa.me/${(offer.whatsappNumber || offer.directPhone).replace(/[^\d]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleWhatsAppClick(offer)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setGuidedOfferModal(offer)}
                            className="gap-1.5 text-xs font-semibold border-amber-600/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                          >
                            <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                            <span>{locale === "am" ? "ወኪል ይጠይቁ (ነፃ)" : "Request Agent Visit"}</span>
                          </Button>
                        )}

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
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Guided Agent Modal */}
      {guidedOfferModal && (
        <GetGuidedModal
          isOpen={Boolean(guidedOfferModal)}
          onClose={() => setGuidedOfferModal(null)}
          prefillMaterial={product.title}
          targetSellerId={guidedOfferModal.sellerId}
          targetSellerName={guidedOfferModal.depotName}
        />
      )}

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


      {/* Sticky Bottom Mobile Conversion Bar */}
      {product.offers.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 md:hidden shadow-lg pb-safe-action">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                {locale === "am" ? "ምርጥ ዋጋ ከመጋዘን" : "Best Available Rate"}
              </div>
              <div className="font-mono text-base font-extrabold text-foreground leading-tight">
                {product.offers[0].lowestPrice !== null
                  ? formatPrice(product.offers[0].lowestPrice, locale)
                  : "On Inquiry"}
                <span className="text-[11px] font-normal text-muted-foreground ml-0.5">
                  /{unitLabel}
                </span>
              </div>
            </div>

            <AuthGateButton
              isAuthenticated={isAuthenticated}
              redirectTo={`/buyer/product/${product.id}`}
              fallbackLabel={t("offers_btn_send_enquiry")}
              fallbackIcon={<SendHorizontal className="h-4 w-4" />}
              fallbackSize="default"
              fallbackClassName="gap-1.5 font-bold shadow-md bg-primary text-primary-foreground text-xs"
            >
              <Button
                onClick={() => setSelectedListingForEnquiry(product.offers[0])}
                className="gap-1.5 font-bold shadow-md bg-primary text-primary-foreground text-xs h-9 px-3.5"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
                {t("offers_btn_send_enquiry")}
              </Button>
            </AuthGateButton>
          </div>
        </div>
      )}
    </div>
  );
}
