// =============================================================================
// ECON — Streamlined Buyer Product & Competing Offers View (Client Component)
// =============================================================================
// Designed for extreme clarity and simplicity for Ethiopian contractors & buyers:
// 1. Prominent High-Definition Material Photo & Verified Authentic Badge.
// 2. Large, unambiguous Wholesale Unit Price with plain-language VAT status.
// 3. Clear Depot Yard Location (Neighborhood / Market area in Addis Ababa).
// 4. Mandatory Physical Inspection Warning before payment (platform & buyer protection).
// 5. One-tap Primary Actions: Direct Phone Call, Official Proforma, and Free Agent Guide.
// 6. Zero confusing calculators or cluttered tables — fast, intuitive, mobile-first.
// =============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Phone,
  MessageCircle,
  UserCheck,
  ArrowLeft,
  Truck,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getCategoryImage } from "@/lib/data/category-images";
import type { ProductWithOffers, CompetingOffer } from "@/lib/data/catalog";

interface ProductOffersViewProps {
  product: ProductWithOffers;
  /** Whether the current visitor has an active session. */
  isAuthenticated?: boolean;
}

export function ProductOffersView({
  product,
  isAuthenticated = false,
}: ProductOffersViewProps) {
  const { locale, t } = useLanguage();
  const [selectedOfferForEnquiry, setSelectedOfferForEnquiry] =
    useState<CompetingOffer | null>(null);
  const [guidedOfferModal, setGuidedOfferModal] =
    useState<CompetingOffer | null>(null);

  const unitLabel = getLocalizedUnit(product.unit, locale);
  const localizedCategory = getCategoryTitle(
    product.category.slug,
    product.category.name,
    locale
  );

  const primaryOffer = product.offers.length > 0 ? product.offers[0] : null;

  const displayImage =
    product.imageUrl || getCategoryImage(product.category.slug, 1200);

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
    <div className="space-y-6 pb-28 md:pb-12 max-w-5xl mx-auto">
      {/* ── Top Back Navigation ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href={`/buyer/category/${product.category.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors touch-target py-1"
        >
          <ArrowLeft className="size-4" />
          <span>
            {locale === "am"
              ? `ወደ ${localizedCategory} ይመለሱ`
              : `Back to ${localizedCategory}`}
          </span>
        </Link>
        <span className="text-2xs font-mono text-muted-foreground">
          {product.offers.length}{" "}
          {locale === "am" ? "የተረጋገጡ አቅራቢዎች" : "Verified Depots"}
        </span>
      </div>

      {/* ── Main Hero Card: Photo, Specs, Pricing & Primary CTAs ───────── */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left Column: High-Res Material Photo */}
          <div className="relative md:col-span-5 bg-muted min-h-[260px] sm:min-h-[320px] aspect-[4/3] md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={product.title}
              onError={(e) => {
                const fallback = getCategoryImage(product.category.slug, 800);
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 md:hidden" />

            {/* Overlaid Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <Badge
                variant="secondary"
                className="bg-background/90 backdrop-blur-md text-xs font-bold shadow-xs"
              >
                {localizedCategory}
              </Badge>
              <Badge className="bg-emerald-600 text-white text-xs font-semibold gap-1 shadow-xs">
                <CheckCircle2 className="size-3" />
                {locale === "am" ? "ኦሪጅናል ጥራት" : "100% Verified Spec"}
              </Badge>
            </div>
          </div>

          {/* Right Column: Key Details, Price & Direct Action Buttons */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
                {product.title}
              </h1>

              {/* Simplified Key Specs */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {Object.entries(product.specs).slice(0, 4).map(([key, val]) => (
                    <div
                      key={key}
                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-foreground/85"
                    >
                      <span className="font-semibold capitalize text-muted-foreground">
                        {key.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <span className="font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Verified Depot Location */}
              {primaryOffer && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Building2 className="size-3.5 text-primary" />
                    {primaryOffer.depotName}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MapPin className="size-3.5 text-primary" />
                    {getLocalizedLocation(primaryOffer.location, locale)}
                  </span>
                </div>
              )}
            </div>

            {/* Price Card */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {locale === "am" ? "የጅምላ መጋዘን ዋጋ" : "Wholesale Depot Rate"}
                </span>
                {primaryOffer?.vatRegistered ? (
                  <Badge className="bg-emerald-600/90 text-white text-[11px] font-semibold gap-1">
                    <ShieldCheck className="size-3" />
                    {locale === "am" ? "የቫት ደረሰኝ ያለው" : "VAT Included"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {locale === "am" ? "መደበኛ ዋጋ" : "Standard Price"}
                  </Badge>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {primaryOffer?.lowestPrice !== null && primaryOffer?.lowestPrice !== undefined
                    ? formatPrice(primaryOffer.lowestPrice, locale)
                    : locale === "am"
                    ? "በጥያቄ የሚገለጽ"
                    : "On Request"}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  / {unitLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-2xs text-muted-foreground pt-1 border-t border-primary/10">
                <span>
                  {locale === "am" ? "አነስተኛ ትዕዛዝ (MOQ):" : "Minimum Order (MOQ):"}{" "}
                  <strong className="text-foreground">
                    {primaryOffer?.moq ?? 1} {unitLabel}
                  </strong>
                </span>
                <span className="flex items-center gap-1 text-primary">
                  <Truck className="size-3" />
                  {locale === "am" ? "መኪና ጭነት በጥያቄ ይቀርባል" : "Transport available"}
                </span>
              </div>
            </div>

            {/* Direct High-Priority Actions */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Direct Call Supplier */}
                {primaryOffer?.directPhone ? (
                  <a
                    href={`tel:${primaryOffer.directPhone.replace(/\s+/g, "")}`}
                    onClick={() => handleCallClick(primaryOffer)}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all touch-target"
                  >
                    <Phone className="size-4" />
                    <span>{locale === "am" ? "አቅራቢውን ይደውሉ" : "Call Depot Supplier"}</span>
                  </a>
                ) : (
                  <Button
                    onClick={() => setGuidedOfferModal(primaryOffer)}
                    className="min-h-[46px] gap-2 font-bold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-xl active:scale-[0.98] transition-all"
                  >
                    <UserCheck className="size-4" />
                    <span>{locale === "am" ? "ወኪል ይጠይቁ (ነፃ)" : "Request Free Agent"}</span>
                  </Button>
                )}

                {/* 2. Official Proforma Request */}
                {primaryOffer && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOfferForEnquiry(primaryOffer)}
                    className="min-h-[46px] gap-2 font-bold text-sm border-border hover:bg-muted/70 rounded-xl active:scale-[0.98] transition-all touch-target"
                  >
                    <FileText className="size-4 text-primary" />
                    <span>
                      {locale === "am" ? "የዋጋ መጠየቂያ (Proforma)" : "Get Official Proforma"}
                    </span>
                  </Button>
                )}
              </div>

              {/* Secondary Options Strip: WhatsApp & Field Guide */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                {primaryOffer?.whatsappNumber && (
                  <a
                    href={`https://wa.me/${primaryOffer.whatsappNumber.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleWhatsAppClick(primaryOffer)}
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 transition-colors py-1"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setGuidedOfferModal(primaryOffer)}
                  className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline font-semibold ml-auto py-1"
                >
                  <UserCheck className="size-3.5" />
                  <span>
                    {locale === "am"
                      ? "ወኪል ይምረጡ (በቦታው ለመፈተሽ)"
                      : "Need yard guide? Free agent visit"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MANDATORY Physical Inspection & Buyer Protection Notice ──── */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3.5 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-sm block">
            {locale === "am" ? "የገዢዎች ጥንቃቄ ማሳሰቢያ፦" : "Important Security Notice for Buyers:"}
          </span>
          <p className="leading-relaxed opacity-95">
            {locale === "am"
              ? "ገንዘብ ከመክፈልዎ በፊት ሁልጊዜ እቃውን በአቅራቢው መጋዘን በአካል ሄደው ይፈትሹ። ኮንማርት የተረጋገጡ የአቅራቢዎችን አድራሻ እና ስልክ በቀጥታ ያገናኛል።"
              : "Always physically visit and inspect the materials at the supplier's depot yard before making any payment. ECON provides verified depot contacts directly to you."}
          </p>
        </div>
      </div>

      {/* ── Competing Supplying Depots List (Clean & Direct) ───────────── */}
      {product.offers.length > 1 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="size-4.5 text-primary" />
              <span>
                {locale === "am"
                  ? `ሌሎች የሚያቀርቡ መጋዘኖች (${product.offers.length})`
                  : `Other Supplying Depots (${product.offers.length})`}
              </span>
            </h2>
            <span className="text-2xs text-muted-foreground">
              {locale === "am" ? "ዋጋዎችን ያወዳድሩ" : "Compare rates"}
            </span>
          </div>

          <div className="grid gap-3">
            {product.offers.map((offer, idx) => {
              const isBest = idx === 0;

              return (
                <Card
                  key={offer.listingId}
                  className="p-4 sm:p-5 border border-border/80 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-foreground">
                        {offer.depotName}
                      </span>
                      {isBest && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                          {locale === "am" ? "ምርጥ ዋጋ" : "Best Price"}
                        </Badge>
                      )}
                      {offer.vatRegistered && (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600/30">
                          VAT
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 text-primary" />
                        {getLocalizedLocation(offer.location, locale)}
                      </span>
                      <span>•</span>
                      <span>
                        MOQ: <strong className="text-foreground">{offer.moq} {unitLabel}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-foreground">
                      {offer.lowestPrice !== null
                        ? formatPrice(offer.lowestPrice, locale)
                        : "On request"}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        /{unitLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {offer.directPhone ? (
                        <a
                          href={`tel:${offer.directPhone.replace(/\s+/g, "")}`}
                          onClick={() => handleCallClick(offer)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors"
                        >
                          <Phone className="size-3.5" />
                          <span>{locale === "am" ? "ይደውሉ" : "Call"}</span>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setGuidedOfferModal(offer)}
                          className="text-xs font-semibold h-8"
                        >
                          <UserCheck className="size-3.5 text-amber-600" />
                          <span>{locale === "am" ? "ወኪል" : "Agent"}</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedOfferForEnquiry(offer)}
                        className="text-xs font-semibold h-8"
                      >
                        <FileText className="size-3.5" />
                        <span>Proforma</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sticky Mobile Action Bar (Always Accessible for Buyers) ───── */}
      {primaryOffer && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 md:hidden shadow-lg pb-safe-action">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xs font-semibold text-muted-foreground uppercase">
                {locale === "am" ? "የጅምላ ዋጋ" : "Wholesale rate"}
              </div>
              <div className="font-mono text-base font-extrabold text-foreground leading-tight">
                {primaryOffer.lowestPrice !== null
                  ? formatPrice(primaryOffer.lowestPrice, locale)
                  : "On Request"}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  /{unitLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {primaryOffer.directPhone ? (
                <a
                  href={`tel:${primaryOffer.directPhone.replace(/\s+/g, "")}`}
                  onClick={() => handleCallClick(primaryOffer)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all touch-target"
                >
                  <Phone className="size-4" />
                  <span>{locale === "am" ? "ይደውሉ" : "Call"}</span>
                </a>
              ) : (
                <Button
                  onClick={() => setGuidedOfferModal(primaryOffer)}
                  className="min-h-[44px] gap-2 font-bold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 rounded-xl active:scale-95 transition-all"
                >
                  <UserCheck className="size-4" />
                  <span>{locale === "am" ? "ወኪል ይጠይቁ" : "Request Agent"}</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setSelectedOfferForEnquiry(primaryOffer)}
                className="min-h-[44px] gap-1.5 font-bold text-xs px-3 rounded-xl border-border active:scale-95 transition-all touch-target"
              >
                <FileText className="size-3.5" />
                <span>Proforma</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Proforma Request Modal ────────────────────────────── */}
      {selectedOfferForEnquiry && (
        <PurchaseRequestModal
          isOpen={Boolean(selectedOfferForEnquiry)}
          onClose={() => setSelectedOfferForEnquiry(null)}
          listingId={selectedOfferForEnquiry.listingId}
          productTitle={product.title}
          unit={product.unit}
          basePrice={selectedOfferForEnquiry.lowestPrice ?? undefined}
        />
      )}

      {/* ── Free Guided Agent Escort Modal ─────────────────────────────── */}
      {guidedOfferModal && (
        <GetGuidedModal
          isOpen={Boolean(guidedOfferModal)}
          onClose={() => setGuidedOfferModal(null)}
          prefillMaterial={product.title}
          targetSellerId={guidedOfferModal.sellerId}
          targetSellerName={guidedOfferModal.depotName}
        />
      )}
    </div>
  );
}
