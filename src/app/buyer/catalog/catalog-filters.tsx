"use client";

// =============================================================================
// ConMart — Buyer Catalog Interactive Filters & Category Showcase
// =============================================================================
// Rich visual Category Showcase Grid + Instant Search & Location Filtering.
// =============================================================================

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  X,
  Package,
  CheckCircle2,
  Container,
  Columns3,
  Mountain,
  LayoutGrid,
  Home,
  Pipette,
  TreePine,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/data/catalog";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getCategoryDescription,
  getLocalizedLocation,
} from "@/lib/i18n/translations";
import { getCategoryImage } from "@/lib/data/category-images";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Container,
  Columns3,
  Mountain,
  LayoutGrid,
  Home,
  Pipette,
  TreePine,
  Zap,
};

const ETHIOPIAN_LOCATIONS = [
  "Addis Ababa",
  "Adama (Nazret)",
  "Bahir Dar",
  "Hawassa",
  "Dire Dawa",
  "Sululta",
  "Mekelle",
];

interface CatalogFiltersProps {
  categories: CategoryWithCount[];
  activeCategory?: string;
  initialSearch?: string;
  initialLocation?: string;
  totalListings: number;
}

export function CatalogFilters({
  categories,
  activeCategory,
  initialSearch = "",
  initialLocation = "",
}: CatalogFiltersProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  const updateFilters = (newParams: {
    category?: string | null;
    search?: string | null;
    location?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newParams.category !== undefined) {
      if (newParams.category && newParams.category !== "all") {
        params.set("category", newParams.category);
      } else {
        params.delete("category");
      }
    }

    if (newParams.search !== undefined) {
      if (newParams.search && newParams.search.trim()) {
        params.set("search", newParams.search.trim());
      } else {
        params.delete("search");
      }
    }

    if (newParams.location !== undefined) {
      if (newParams.location && newParams.location !== "all") {
        params.set("location", newParams.location);
      } else {
        params.delete("location");
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedLocation("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(
    activeCategory || search || selectedLocation
  );

  return (
    <div className="space-y-8">
      {/* ===================================================================== */}
      {/* 1. CATEGORY SHOWCASE GRID ("Choose What You Want to Buy")           */}
      {/* ===================================================================== */}
      <div>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{t("filter_what_needed")}</span>
              <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                {t("filter_click_to_filter")}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("filter_subtitle")}
            </p>
          </div>

          <Button
            variant={!activeCategory ? "secondary" : "outline"}
            size="sm"
            onClick={() => updateFilters({ category: null })}
            className={cn(
              "h-8 text-xs font-medium self-start sm:self-auto",
              !activeCategory && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {t("filter_all_materials")} ({categories.reduce((a, c) => a + c.listingCount, 0)})
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.iconName] || Package;
            const isSelected = activeCategory === cat.slug;
            const localizedCatName = getCategoryTitle(cat.slug, cat.name, locale);
            const localizedCatDesc = getCategoryDescription(cat.slug, cat.description || "", locale);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  updateFilters({
                    category: isSelected ? null : cat.slug,
                  })
                }
                className={cn(
                  "group relative overflow-hidden rounded-xl border text-left transition-all duration-300",
                  "hover:shadow-lg hover:-translate-y-0.5",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 shadow-md bg-primary/5"
                    : "border-border/60 bg-card hover:border-primary/40"
                )}
              >
                {/* Category Cover Image with Scrim */}
                <div className="relative h-24 w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.imageUrl || getCategoryImage(cat.slug, 600)}
                    alt={localizedCatName}
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-500",
                      isSelected ? "scale-105" : "group-hover:scale-110"
                    )}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Icon badge overlay */}
                  <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-md transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-black/50 text-white group-hover:bg-primary group-hover:text-primary-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium text-white/90 drop-shadow">
                      {cat.listingCount}{" "}
                      {locale === "am"
                        ? t("catalog_offers_count")
                        : cat.listingCount === 1
                        ? t("catalog_offer_single")
                        : t("catalog_offers_count")}
                    </span>
                  </div>

                  {/* Selected checkmark indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Category Body Details */}
                <div className="p-3">
                  <h3
                    className={cn(
                      "font-semibold text-sm leading-tight transition-colors line-clamp-1",
                      isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                    )}
                  >
                    {localizedCatName}
                  </h3>
                  {localizedCatDesc && (
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {localizedCatDesc}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SEARCH & LOCATION TOOLBAR                                         */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur-sm">
        {/* Search input */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md flex items-center"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalog_search_placeholder")}
            className="pl-9 pr-16 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                updateFilters({ search: "" });
              }}
              className="absolute right-12 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 h-7 px-2.5 text-xs font-medium"
          >
            {t("catalog_find_btn")}
          </Button>
        </form>

        {/* Location selector and active filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{t("filter_yard_location")}</span>
          </div>

          <select
            value={selectedLocation}
            onChange={(e) => {
              const loc = e.target.value;
              setSelectedLocation(loc);
              updateFilters({ location: loc });
            }}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t("filter_all_cities")}</option>
            {ETHIOPIAN_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {getLocalizedLocation(loc, locale)}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <X className="h-3 w-3" />
              {t("filter_reset_btn")}
            </Button>
          )}
        </div>
      </div>

      {/* Loading state indicator */}
      {isPending && (
        <div className="h-0.5 w-full bg-primary/20 overflow-hidden rounded-full">
          <div className="h-full bg-primary animate-pulse w-1/3" />
        </div>
      )}
    </div>
  );
}
