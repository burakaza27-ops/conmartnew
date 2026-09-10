// =============================================================================
// ConMart — Focused Category Client View
// =============================================================================
// Fully localized client view for category switcher, listings grid, and cards.
// Supports instantaneous language switching (Amharic / English).
// =============================================================================

"use client";

import Link from "next/link";
import {
  Package,
  MapPin,
  Tag,
  Building2,
  Calculator,
  ShieldCheck,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getCategoryDescription,
  getLocalizedUnit,
  getLocalizedLocation,
} from "@/lib/i18n/translations";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CatalogListing } from "@/lib/data/catalog";
import { CategoryToolbar } from "./category-toolbar";

interface CategoryViewProps {
  allCategories: {
    id: string;
    name: string;
    slug: string;
    listingCount: number;
  }[];
  categorySlug: string;
  categoryDetail: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  } | null;
  listings: CatalogListing[];
  availableBrands: string[];
  searchQuery?: string;
  locationFilter?: string;
  brandFilter?: string;
  sortBy?: string;
}

export function CategoryView({
  allCategories,
  categorySlug,
  categoryDetail,
  listings,
  availableBrands,
  searchQuery,
  locationFilter,
  brandFilter,
  sortBy,
}: CategoryViewProps) {
  const { t, locale } = useLanguage();
  const isAll = categorySlug === "all";

  const rawTitle = isAll ? "All Construction Materials" : categoryDetail?.name || "";
  const activeCategoryTitle = isAll
    ? t("nav_all_materials")
    : getCategoryTitle(categorySlug, rawTitle, locale);

  const defaultDesc = isAll
    ? locale === "am"
      ? "በኢትዮጵያ ውስጥ ያሉ የሁሉም የግንባታ ዕቃዎች የቀጥታ የፋብሪካና መጋዘን የጅምላ ዋጋዎችን ያወዳድሩ።"
      : "Compare wholesale factory-direct price tiers across all construction material categories in Ethiopia."
    : getCategoryDescription(
        categorySlug,
        categoryDetail?.description || "",
        locale
      );

  return (
    <div className="space-y-6">
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href="/buyer"
          className="hover:text-foreground transition-colors font-medium"
        >
          {t("catalog_breadcrumb_categories")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        <span className="font-semibold text-foreground">
          {activeCategoryTitle}
        </span>
      </nav>

      {/* 2. CATEGORY SWITCHER (NO HORIZONTAL SCROLL ON MOBILE - ALL VISIBLE IN ONE VIEW) */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-md border-y border-border/40">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link
            href="/buyer/category/all"
            className={cn(
              "rounded-full px-2.5 sm:px-3.5 py-1 text-xs font-semibold transition-all shadow-xs",
              isAll
                ? "bg-primary text-primary-foreground font-bold"
                : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {t("nav_all_materials")}
          </Link>

          {allCategories.map((cat) => {
            const isCurrent = categorySlug === cat.slug;
            const localizedCatName = getCategoryTitle(cat.slug, cat.name, locale);
            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.slug}`}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 sm:px-3.5 py-1 text-xs font-semibold transition-all shadow-xs",
                  isCurrent
                    ? "bg-primary text-primary-foreground font-bold"
                    : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <span>{localizedCatName}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isCurrent
                      ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat.listingCount}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. CATEGORY HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading-display text-2xl text-foreground sm:text-3xl">
              {activeCategoryTitle}
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              {listings.length}{" "}
              {locale === "am"
                ? t("catalog_offers_count")
                : listings.length === 1
                ? t("catalog_offer_single")
                : t("catalog_offers_count")}
            </Badge>
          </div>
          {defaultDesc && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {defaultDesc}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/40 self-start sm:self-auto">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>{t("catalog_verified_depot_stocks")}</span>
        </div>
      </div>

      {/* 4. INTERACTIVE TOOLBAR */}
      <CategoryToolbar
        availableBrands={availableBrands}
        initialSearch={searchQuery}
        initialLocation={locationFilter}
        initialBrand={brandFilter}
        initialSort={sortBy}
      />

      {/* 5. LISTINGS GRID */}
      {listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("catalog_empty_title")}
          description={
            searchQuery || brandFilter || locationFilter
              ? t("catalog_empty_desc")
              : locale === "am"
                ? "የተረጋገጡ አቅራቢዎች አዳዲስ የግንባታ ዕቃዎችን ሲመዘግቡ እዚህ ይታያሉ።"
                : "Listings appear here when verified suppliers update inventory."
          }
          action={
            <Link
              href={`/buyer/category/${categorySlug}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("catalog_btn_clear_filters")}
            </Link>
          }
          className="rounded-2xl border border-dashed border-border bg-card/40"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual listing card with bilingual formatting.
 */
function ListingCard({ listing }: { listing: CatalogListing }) {
  const { t, locale } = useLanguage();
  const unitLabel = getLocalizedUnit(listing.product.unit, locale);
  const localizedLocation = getLocalizedLocation(listing.location, locale);
  const localizedCategory = getCategoryTitle(
    listing.product.category.slug,
    listing.product.category.name,
    locale
  );

  const displayImage =
    listing.imageUrl ||
    listing.product.imageUrl ||
    "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80";

  return (
    <Card className="group flex flex-col overflow-hidden border-border bg-card transition-colors hover:border-primary/40">
      {/* Image Banner with Category badge & tier tags */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={listing.product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Category Badge overlay */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="text-[10px] font-semibold backdrop-blur-md bg-background/80 shadow-xs"
          >
            {localizedCategory}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge
            domain="subscription"
            status={listing.directChatEnabled ? "ACTIVE" : "FREE"}
            locale={locale}
            size="sm"
          />
        </div>

        {/* Volume Tiers Indicator overlay */}
        <div className="absolute bottom-2.5 left-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[11px] font-medium text-white">
            <Tag className="h-3 w-3 text-primary" />
            {listing.tierCount}{" "}
            {listing.tierCount !== 1
              ? t("catalog_volume_tiers")
              : t("catalog_volume_tier_single")}
          </span>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        {/* Product Title */}
        <h3 className="mb-1.5 text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {listing.product.title}
        </h3>

        {/* Seller Info */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span className="truncate font-medium text-foreground/80">
            {listing.seller.companyName}
          </span>
          <span className="inline-block h-1 w-1 rounded-full bg-border" />
          <span className="text-2xs font-medium text-success">
            {t("catalog_verified")}
          </span>
        </div>

        {/* Location Yard */}
        <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          <span className="truncate">{localizedLocation}</span>
        </div>

        {/* Price & Action Section */}
        <div className="mt-auto border-t border-border/40 pt-4 flex flex-col gap-2.5">
          <div className="flex items-end justify-between gap-2">
            {listing.lowestPrice !== null ? (
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("catalog_wholesale_from")}
                </span>
                <p className="tabular text-lg font-semibold text-foreground leading-tight">
                  {formatETB(listing.lowestPrice, locale)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground font-sans">
                    / {unitLabel}
                  </span>
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-2xs font-medium text-primary">
                    {locale === "am" ? "ገላጭ ዋጋ · በሻጭ የሚረጋገጥ" : "Indicative · Subject to Confirmation"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {t("catalog_pricing_upon_inquiry")}
              </p>
            )}

            <div className="flex items-center gap-1.5">
              <Link
                href={`/buyer/product/${listing.product.id}`}
                className={cn(
                  buttonVariants({ size: "sm", variant: "default" }),
                  "h-8 gap-1.5 text-xs font-semibold px-3 shadow-xs"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{locale === "am" ? "አወዳድርና እዘዝ" : "Compare Offers"}</span>
              </Link>

              <Link
                href={`/buyer/catalog/${listing.id}`}
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                )}
                title={locale === "am" ? "የባንክ ፕሮፎርማ" : "Bank Proforma"}
              >
                <Calculator className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
