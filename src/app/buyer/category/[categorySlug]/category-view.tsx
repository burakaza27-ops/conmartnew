// =============================================================================
// ConMart — Category Catalog View (Product-Grouped, Image-First)
// =============================================================================
// Each card = one product type (e.g. "Dangote Cement 42.5N")
// Clicking opens /buyer/product/[id] which lists all competing suppliers.
// UI style: image-dominant cards, clean price range, supplier count badge.
// =============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  ChevronRight,
  Users,
  Store,
  ArrowUpDown,
  X,
  Camera,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getCategoryDescription,
  getLocalizedUnit,
} from "@/lib/i18n/translations";
import type { ProductCatalogRow } from "@/lib/data/catalog";
import type { SiteWastageItem } from "@/lib/data/wastage";
import { GuestWastageModal } from "@/components/wastage/guest-wastage-modal";
import { CategoryToolbar } from "./category-toolbar";

import { getProductFallback } from "@/lib/data/category-images";

interface CategoryViewProps {
  allCategories: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    listingCount: number;
  }[];
  categorySlug: string;
  categoryDetail: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl?: string | null;
  } | null;
  products: ProductCatalogRow[];
  availableBrands: string[];
  searchQuery?: string;
  brandFilter?: string;
  sortBy?: string;
  approvedWastages?: SiteWastageItem[];
}

export function CategoryView({
  allCategories,
  categorySlug,
  categoryDetail,
  products,
  availableBrands,
  searchQuery,
  brandFilter,
  sortBy,
  approvedWastages = [],
}: CategoryViewProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const isAll = categorySlug === "all";
  const isWastage = categorySlug === "reusable-site-wastage";
  const [isWastageModalOpen, setIsWastageModalOpen] = React.useState(false);

  const rawTitle = isAll ? "All Construction Materials" : categoryDetail?.name || "";
  const activeCategoryTitle = isAll
    ? t("nav_all_materials")
    : getCategoryTitle(categorySlug, rawTitle, locale);

  const defaultDesc = isAll
    ? locale === "am"
      ? "የሁሉም የግንባታ ዕቃዎች ዘርዝሮ ይፈልጉ — ሲሚንቶ፣ ብረት፣ ጠጠር እና ሌሎች።"
      : "Browse all construction materials — cement, steel, aggregates, and more. Click any product to compare all supplier prices side by side."
    : getCategoryDescription(
        categorySlug,
        categoryDetail?.description || "",
        locale
      );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get("search") as string)?.trim();
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (brandFilter && brandFilter !== "all") params.set("brand", brandFilter);
    if (sortBy && sortBy !== "supplier_count") params.set("sort", sortBy);
    router.push(`/buyer/category/${categorySlug}?${params.toString()}`);
  };

  const clearSearch = () => {
    const params = new URLSearchParams();
    if (brandFilter && brandFilter !== "all") params.set("brand", brandFilter);
    if (sortBy && sortBy !== "supplier_count") params.set("sort", sortBy);
    const qs = params.toString();
    router.push(`/buyer/category/${categorySlug}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="space-y-0">
      {/* ============================================================
          1. BREADCRUMB
      ============================================================ */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link
          href="/buyer"
          className="hover:text-foreground transition-colors font-medium"
        >
          {t("catalog_breadcrumb_categories")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <span className="font-semibold text-foreground">{activeCategoryTitle}</span>
      </nav>

      {/* ============================================================
          2. CATEGORY STRIP — horizontal scrollable pill row
      ============================================================ */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-md border-b border-border/30 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {/* All Materials */}
          <Link
            href="/buyer/category/all"
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
              isAll
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            All
          </Link>

          {allCategories.map((cat) => {
            const isCurrent = categorySlug === cat.slug;
            const localizedName = getCategoryTitle(cat.slug, cat.name, locale);
            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.slug}`}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
                  isCurrent
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {localizedName}
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1",
                    isCurrent
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat.listingCount}
                </span>
              </Link>
            );
          })}

          {/* Stores link */}
          <Link
            href="/buyer/stores"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all ml-2"
          >
            <Store className="h-3 w-3" />
            Stores
          </Link>
        </div>
      </div>

      {/* ============================================================
          3. HEADER + SEARCH BAR
      ============================================================ */}
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {activeCategoryTitle}
          </h1>
          {defaultDesc && (
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {defaultDesc}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{products.length}</span>{" "}
            {products.length === 1 ? "product type" : "product types"} available
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              name="search"
              defaultValue={searchQuery}
              placeholder={
                locale === "am"
                  ? "ዳንጎቴ፣ ሲሚንቶ፣ ብረት..."
                  : "Search cement, rebar, Dangote…"
              }
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="flex h-11 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
          <button
            type="submit"
            className={cn(
              buttonVariants({ size: "default" }),
              "h-11 rounded-xl px-5 font-semibold"
            )}
          >
            Search
          </button>
        </form>

        {/* Filter row */}
        {/* Sort only — brand chips removed (brands visible on product detail) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
            {[
              { key: "newest", label: "Newest" },
              { key: "price_asc", label: "Price ↑" },
              { key: "price_desc", label: "Price ↓" },
            ].map(({ key, label }) => (
              <Link
                key={key}
                href={`/buyer/category/${categorySlug}?${new URLSearchParams({
                  ...(searchQuery ? { search: searchQuery } : {}),
                  sort: key,
                }).toString()}`}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                  (sortBy || "newest") === key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================
          3B. SITE WASTAGES COMMUNITY HERO BANNER (When on Site Wastages or All)
      ============================================================ */}
      {(isWastage || isAll) && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 sm:p-5 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <Camera className="size-4" />
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {locale === "am"
                    ? "የሳይት ተረፈ ምርት ይሽጡ (መመዝገብ አያስፈልግም)"
                    : "Have Leftover Scrap or Materials? Snap & Sell Freely"}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === "am"
                  ? "በግንባታ ሳይትዎ ላይ የተረፈ የሳንቃ ፎርምዎርክ፣ የፌሮ ብረት ቁራጭ፣ ብሎኬት ወይም ስክራፕ አለዎት? ፎቶ በማንሳት ብቻ ያለምንም ምዝገባ ይለጥፉ። አስተዳዳሪ ሲያጸድቅ እዚህ ይለጠፋል።"
                  : "Have leftover formwork timber, rebar offcuts, scrap metal, or surplus blocks? Snap a photo to list freely without registering. Admin reviews and approves before publishing."}
              </p>
            </div>
            <Button
              onClick={() => setIsWastageModalOpen(true)}
              size="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shrink-0 shadow-xs"
            >
              <Camera className="size-4" />
              <span>{locale === "am" ? "ፎቶ አንስተው ይለጥፉ (ነፃ)" : "Snap & Post Wastage"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================
          3C. APPROVED GUEST SITE WASTAGES (Direct Foreman Contact)
      ============================================================ */}
      {approvedWastages.length > 0 && (isWastage || isAll) && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{locale === "am" ? "የተረጋገጡ የሳይት ተረፈ ምርቶች" : "Verified Site Wastages & Scrap Lots"}</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({approvedWastages.length} lots)
              </span>
            </h2>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {approvedWastages.map((w) => (
              <div
                key={w.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all duration-200"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={w.imageUrl}
                    alt={w.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <CheckCircle2 className="size-3" />
                      Verified Lot
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3.5 space-y-2">
                  <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {w.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">
                      {w.quantity} {w.unit}
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {w.askingPrice > 0 ? formatETB(w.askingPrice, locale) : "Negotiable"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1 truncate pt-0.5">
                    <MapPin className="size-3 text-primary shrink-0" />
                    <span>{w.location}</span>
                  </div>

                  {w.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {w.description}
                    </p>
                  )}

                  <div className="pt-2 mt-auto border-t border-border/60">
                    <a
                      href={`tel:${w.contactPhone.replace(/\s+/g, "")}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-2xs transition-colors"
                    >
                      <Phone className="size-3.5" />
                      <span>{locale === "am" ? "ለፎርማኑ ይደውሉ" : "Call Foreman"} ({w.contactPhone})</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          4. PRODUCT GRID
      ============================================================ */}
      {products.length === 0 && approvedWastages.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("catalog_empty_title")}
          description={
            searchQuery || brandFilter
              ? t("catalog_empty_desc")
              : locale === "am"
              ? "የተረጋገጡ አቅራቢዎች አዳዲስ የግንባታ ዕቃዎችን ሲመዘግቡ እዚህ ይታያሉ።"
              : "Listings appear when verified suppliers add their inventory."
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
      ) : products.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.productId} product={product} categorySlug={categorySlug} />
          ))}
        </div>
      ) : null}

      <GuestWastageModal
        isOpen={isWastageModalOpen}
        onClose={() => setIsWastageModalOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// PRODUCT CARD — image-dominant, one per product type
// =============================================================================

function ProductCard({
  product,
  categorySlug,
}: {
  product: ProductCatalogRow;
  categorySlug: string;
}) {
  const { locale } = useLanguage();
  const unitLabel = getLocalizedUnit(product.unit, locale);

  const image =
    product.imageUrl ||
    getProductFallback(product.category.slug || categorySlug);

  return (
    <Link
      href={`/buyer/product/${product.productId}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.title}
          onError={(e) => {
            const fallback = getProductFallback(product.category.slug || categorySlug);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Supplier count badge */}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm">
            <Users className="h-2.5 w-2.5 text-primary" />
            {product.supplierCount}
          </span>
        </div>
        {/* Category chip */}
        <div className="absolute bottom-2 left-2">
          <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-white">
            {product.category.name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <div className="mb-1">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tracking-wide">
              {product.brand}
            </span>
          </div>
        )}
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {product.title}
        </h3>

        {product.lowestPrice !== null ? (
          <div className="mt-auto">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              From
            </p>
            <p className="text-base font-bold text-foreground tabular-nums leading-tight">
              {formatETB(product.lowestPrice, locale)}
              <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                /{unitLabel}
              </span>
            </p>
            {product.highestPrice !== null &&
              product.highestPrice !== product.lowestPrice && (
                <p className="text-[10px] text-muted-foreground">
                  up to {formatETB(product.highestPrice, locale)}/{unitLabel}
                </p>
              )}
          </div>
        ) : (
          <p className="mt-auto text-xs text-muted-foreground italic">
            Price on enquiry
          </p>
        )}

        {/* CTA row */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {product.supplierCount}{" "}
            {product.supplierCount === 1 ? "supplier" : "suppliers"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Compare
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
