// =============================================================================
// ConMart — Category Catalog View (Product-Grouped, Image-First)
// =============================================================================
// Each card = one product type (e.g. "Dangote Cement 42.5N")
// Clicking opens /buyer/product/[id] which lists all competing suppliers.
// UI style: image-dominant cards, clean price range, supplier count badge.
// =============================================================================

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  ChevronRight,
  Users,
  SlidersHorizontal,
  Store,
  ArrowUpDown,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getCategoryDescription,
  getLocalizedUnit,
} from "@/lib/i18n/translations";
import type { ProductCatalogRow } from "@/lib/data/catalog";
import { CategoryToolbar } from "./category-toolbar";

// Curated category cover images (fallback for categories without DB images)
const CATEGORY_IMAGES: Record<string, string> = {
  cement:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=75",
  steel:
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=75",
  aggregates:
    "https://images.unsplash.com/photo-1620733723572-11c53f73a416?auto=format&fit=crop&w=800&q=75",
  finishing:
    "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=75",
  timber:
    "https://images.unsplash.com/photo-1542621334-a254cf47733d?auto=format&fit=crop&w=800&q=75",
  electrical:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=75",
  plumbing:
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=75",
  "safety-gear":
    "https://images.unsplash.com/photo-1530099486328-e021101a494a?auto=format&fit=crop&w=800&q=75",
};

const PRODUCT_FALLBACK =
  "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=75";

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
}: CategoryViewProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const isAll = categorySlug === "all";

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
        <div className="flex items-center gap-2 flex-wrap">
          {availableBrands.length > 0 && (
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Brand:</span>
              <div className="flex flex-wrap gap-1">
                <Link
                  href={`/buyer/category/${categorySlug}?${new URLSearchParams({
                    ...(searchQuery ? { search: searchQuery } : {}),
                    ...(sortBy && sortBy !== "supplier_count" ? { sort: sortBy } : {}),
                  }).toString()}`}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                    !brandFilter || brandFilter === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  All
                </Link>
                {availableBrands.slice(0, 8).map((brand) => (
                  <Link
                    key={brand}
                    href={`/buyer/category/${categorySlug}?${new URLSearchParams({
                      ...(searchQuery ? { search: searchQuery } : {}),
                      brand,
                      ...(sortBy && sortBy !== "supplier_count" ? { sort: sortBy } : {}),
                    }).toString()}`}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                      brandFilter === brand
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
            {[
              { key: "supplier_count", label: "Most suppliers" },
              { key: "price_asc", label: "Price ↑" },
              { key: "price_desc", label: "Price ↓" },
            ].map(({ key, label }) => (
              <Link
                key={key}
                href={`/buyer/category/${categorySlug}?${new URLSearchParams({
                  ...(searchQuery ? { search: searchQuery } : {}),
                  ...(brandFilter && brandFilter !== "all" ? { brand: brandFilter } : {}),
                  sort: key,
                }).toString()}`}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                  (sortBy || "supplier_count") === key
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
          4. PRODUCT GRID
      ============================================================ */}
      {products.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.productId} product={product} categorySlug={categorySlug} />
          ))}
        </div>
      )}
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
    CATEGORY_IMAGES[product.category.slug] ||
    CATEGORY_IMAGES[categorySlug] ||
    PRODUCT_FALLBACK;

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
