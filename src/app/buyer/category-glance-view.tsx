"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Container,
  Columns3,
  Mountain,
  Truck,
  Layers,
  Frame,
  Sparkles,
  Home,
  LayoutGrid,
  Paintbrush,
  FlaskConical,
  Box,
  Bath,
  Pipette,
  Zap,
  Wrench,
  Wind,
  Landmark,
  PackagePlus,
  Recycle,
  Package,
  Store,
  Search,
  X,
  Grid2X2,
  LayoutList,
  ArrowRight,
} from "lucide-react";
import { getCategoryImage } from "@/lib/data/category-images";
import type { CategoryWithCount } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

interface CategoryGlanceViewProps {
  categories: CategoryWithCount[];
  totalOffers: number;
}

// Map slug to official Lucide icon
function getCategoryIcon(slug: string) {
  const s = slug.toLowerCase();
  if (s.includes("cement")) return Container;
  if (s.includes("steel") || s.includes("rebar")) return Columns3;
  if (s.includes("aggregate") || s.includes("sand")) return Mountain;
  if (s.includes("concrete") || s.includes("ready")) return Truck;
  if (s.includes("metal")) return Layers;
  if (s.includes("alumin") || s.includes("almun")) return Frame;
  if (s.includes("glass")) return Sparkles;
  if (s.includes("roof")) return Home;
  if (s.includes("tile") || s.includes("finish")) return LayoutGrid;
  if (s.includes("paint") || s.includes("gypsum")) return Paintbrush;
  if (s.includes("admixture") || s.includes("chem")) return FlaskConical;
  if (s.includes("block") || s.includes("hcb")) return Box;
  if (s.includes("sanitary") || s.includes("bath")) return Bath;
  if (s.includes("plumb") || s.includes("pipe")) return Pipette;
  if (s.includes("electr") || s.includes("cable")) return Zap;
  if (s.includes("hardw") || s.includes("tool")) return Wrench;
  if (s.includes("hvac") || s.includes("vent")) return Wind;
  if (s.includes("infra") || s.includes("landscap")) return Landmark;
  if (s.includes("wast") || s.includes("reuse")) return Recycle;
  if (s.includes("other")) return PackagePlus;
  return Package;
}

export function CategoryGlanceView({ categories, totalOffers }: CategoryGlanceViewProps) {
  const [filterQuery, setFilterQuery] = useState("");
  // "dense" fits all 20 categories on a single screen/glance on both mobile & desktop
  // "cards" provides a larger visual showcase
  const [viewMode, setViewMode] = useState<"dense" | "cards">("cards");

  const filteredCategories = useMemo(() => {
    if (!filterQuery.trim()) return categories;
    const q = filterQuery.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [categories, filterQuery]);

  return (
    <div className="space-y-3">
      {/* Category Controls Bar: Quick filter + View Switcher */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Material Categories
            </h2>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              20 Categories
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalOffers} live depot offers from verified yards in Addis Ababa
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Quick filter (e.g. rebar, cement, hcb)…"
              className="h-8 w-full rounded-lg border border-border bg-background/80 pl-8 pr-7 text-xs placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear filter"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Dense Glance vs Visual Cards */}
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("dense")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                viewMode === "dense"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Dense view: see all 20 categories at one glance"
            >
              <LayoutList className="size-3.5" />
              <span className="hidden sm:inline">1-Glance</span>
              <span className="sm:hidden">Glance</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Visual cards view"
            >
              <Grid2X2 className="size-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          VIEW MODE 1: DENSE GLANCE (Fits all 20 categories at a glance)
      ============================================================ */}
      {viewMode === "dense" && (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-5">
          {filteredCategories.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.slug);
            const image = cat.imageUrl || getCategoryImage(cat.slug, 600);

            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.slug}`}
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-2xs transition-all duration-150 hover:border-primary/60 hover:bg-accent/40 hover:shadow-xs active:scale-[0.99]"
              >
                {/* Micro Thumbnail */}
                <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute inset-0 flex items-center justify-center text-white/90">
                    <Icon className="size-4 drop-shadow-sm" />
                  </div>
                </div>

                {/* Text & Number */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] font-bold text-primary/70">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="truncate text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {cat.listingCount} {cat.listingCount === 1 ? "depot" : "depots"}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* All Stores dense card */}
          <Link
            href="/buyer/stores"
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-dashed border-primary/40 bg-primary/5 p-1.5 shadow-2xs transition-all duration-150 hover:border-primary hover:bg-primary/10 active:scale-[0.99]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Store className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                All Stores
              </h3>
              <p className="text-[10px] text-muted-foreground">Browse sellers</p>
            </div>
          </Link>
        </div>
      )}

      {/* ============================================================
          VIEW MODE 2: VISUAL CARDS (High-density photo cards with 20 categories)
      ============================================================ */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
          {filteredCategories.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.slug);
            const image = cat.imageUrl || getCategoryImage(cat.slug, 600);

            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.slug}`}
                className="group relative flex h-24 sm:h-28 flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-border/80 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-md active:translate-y-0"
              >
                {/* Background Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                  loading="lazy"
                />

                {/* Dark Contrast Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35" />

                {/* Card Top: Number pill + Category Icon */}
                <div className="relative flex items-center justify-between p-2 sm:p-2.5">
                  <span className="inline-flex items-center rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white/90 backdrop-blur-xs">
                    #{idx + 1}
                  </span>
                  <div className="flex size-6 items-center justify-center rounded-md bg-white/15 text-white backdrop-blur-xs transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-3.5" />
                  </div>
                </div>

                {/* Card Bottom: Category Title + Depot Count */}
                <div className="relative p-2 sm:p-2.5 pt-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-sm group-hover:text-primary-foreground transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-white/75 font-medium">
                    {cat.listingCount} {cat.listingCount === 1 ? "depot" : "depots"}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* Stores Tile */}
          <Link
            href="/buyer/stores"
            className="group relative flex h-24 sm:h-28 flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-dashed border-primary/50 bg-primary/10 p-2 sm:p-2.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/15 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                Directory
              </span>
              <div className="flex size-6 items-center justify-center rounded-md bg-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Store className="size-3.5" />
              </div>
            </div>

            <div className="pt-0">
              <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                All Stores
              </h3>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-0.5">
                Browse yards <ArrowRight className="size-2.5" />
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Empty Search State */}
      {filteredCategories.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No categories match &ldquo;{filterQuery}&rdquo;.{" "}
          <button
            type="button"
            onClick={() => setFilterQuery("")}
            className="font-medium text-primary hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
