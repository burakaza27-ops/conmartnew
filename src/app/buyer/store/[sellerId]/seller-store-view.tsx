"use client";

// =============================================================================
// ECON — Seller Store View (Client Component)
// =============================================================================

import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  BadgeCheck,
  Package,
  ChevronRight,
  ArrowLeft,
  Clock,
  Star,
  Receipt,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedUnit, type Locale } from "@/lib/i18n/translations";
import type { SellerStoreProfile } from "@/lib/data/catalog";

const SELLER_TYPE_LABELS: Record<string, string> = {
  FACTORY: "Factory Direct",
  IMPORTER: "Importer",
  WHOLESALER: "Wholesaler",
  RETAILER: "Retailer",
  RENTAL: "Rental",
};

const PRODUCT_FALLBACK =
  "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=75";

interface SellerStoreViewProps {
  store: SellerStoreProfile;
}

export function SellerStoreView({ store }: SellerStoreViewProps) {
  const { locale } = useLanguage();

  const isVerified = store.verificationStatus === "VERIFIED";
  const isPro =
    store.subscriptionStatus === "PRO" ||
    store.subscriptionStatus === "ENTERPRISE";

  // Group listings by category for a cleaner store layout
  const byCategory = store.listings.reduce<
    Record<string, { categoryName: string; items: typeof store.listings }>
  >((acc, listing) => {
    const key = listing.categorySlug;
    if (!acc[key]) {
      acc[key] = { categoryName: listing.categoryName, items: [] };
    }
    acc[key].items.push(listing);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Back breadcrumb */}
      <Link
        href="/buyer/stores"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Stores
      </Link>

      {/* ============================================================
          STORE HERO HEADER
      ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        {/* Gradient glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

        <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Store avatar / initials */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-2xl font-black text-primary">
            {store.companyName.charAt(0).toUpperCase()}
          </div>

          {/* Store info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {store.companyName}
              </h1>
              {isVerified && (
                <BadgeCheck className="h-6 w-6 text-primary shrink-0" />
              )}
              {isPro && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                  PRO
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs font-semibold">
                {SELLER_TYPE_LABELS[store.sellerType] ?? store.sellerType}
              </Badge>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Supplier
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Verification Pending
                </span>
              )}
              {store.vatRegistered && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5" />
                  VAT Registered
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="h-4 w-4 text-primary/70" />
                <span>
                  <span className="font-semibold text-foreground">
                    {store.listings.length}
                  </span>{" "}
                  active listings
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-4 w-4 text-amber-500" />
                <span>
                  <span className="font-semibold text-foreground">
                    {store.completedDealsCount}
                  </span>{" "}
                  completed deals
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary/70" />
                <span>
                  Avg response{" "}
                  <span className="font-semibold text-foreground">
                    {store.responseTimeAvgMinutes < 60
                      ? `${store.responseTimeAvgMinutes}m`
                      : `${Math.round(store.responseTimeAvgMinutes / 60)}h`}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          LISTINGS BY CATEGORY
      ============================================================ */}
      {store.listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            This supplier has no active listings yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCategory).map(([slug, group]) => (
            <section key={slug} className="space-y-4">
              {/* Category section header */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  {group.categoryName}
                </h2>
                <Link
                  href={`/buyer/category/${slug}`}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  Browse all {group.categoryName}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Product cards */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((listing) => (
                  <StoreProductCard
                    key={listing.listingId}
                    listing={listing}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground text-center">
        Contact details (phone, address) are revealed only after submitting a purchase enquiry and the supplier accepts it.
        This protects both parties until a genuine business intent is confirmed.
      </div>
    </div>
  );
}

// =============================================================================
// STORE PRODUCT CARD
// =============================================================================
function StoreProductCard({
  listing,
  locale,
}: {
  listing: SellerStoreProfile["listings"][number];
  locale: Locale;
}) {
  const unitLabel = getLocalizedUnit(listing.productUnit, locale);
  const image = listing.imageUrl || PRODUCT_FALLBACK;
  const inStock = listing.stockState === "IN_STOCK";

  return (
    <Link
      href={`/buyer/product/${listing.productId}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={listing.productTitle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Stock state badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border",
              inStock
                ? "bg-emerald-500/90 text-white border-emerald-600"
                : listing.stockState === "LIMITED"
                ? "bg-amber-500/90 text-white border-amber-600"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {inStock ? "In Stock" : listing.stockState === "LIMITED" ? "Limited" : "On Order"}
          </span>
        </div>
        {listing.tierCount > 1 && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Layers className="h-2.5 w-2.5" />
              {listing.tierCount} tiers
            </span>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2">
          {listing.productTitle}
        </h3>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        {listing.lowestPrice !== null ? (
          <div className="mt-auto">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              From
            </p>
            <p className="text-base font-bold text-foreground tabular-nums leading-tight">
              {formatETB(listing.lowestPrice, locale)}
              <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                /{unitLabel}
              </span>
            </p>
          </div>
        ) : (
          <p className="mt-auto text-xs text-muted-foreground italic">Price on enquiry</p>
        )}

        <div className="mt-3 flex items-center justify-end">
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            View offers
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
