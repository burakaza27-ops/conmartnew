"use client";

// =============================================================================
// Econ — Seller Multi-Item Batch Listing Form (Yakob Dan Review v2)
// =============================================================================
// Redesigned per client feedback:
// - Category-first material selection with filtered templates
// - Buyer-friendly unit labels filtered by selected category
// - Enter Price / Ask for Price toggle
// - Availability status (In Stock / Limited / On Order / Out of Stock)
// - Simplified location section (business location first)
// - Auto-generated material title from structured fields
// =============================================================================

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Package,
  Layers,
  MapPin,
  Building2,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Sparkles,
  MessageSquareMore,
  Wrench,
  Eye,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getProductFallback } from "@/lib/data/category-images";
import {
  createBatchSellerListingsAction,
  type BatchListingItemInput,
} from "@/app/actions/listings";
import { ProductUnit, StockState } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  formatPrice,
} from "@/lib/i18n/translations";
import {
  getUnitLabel,
  getUnitsForCategory,
  getStockStateLabel,
  STOCK_STATE_LABELS,
  CATEGORY_SPEC_HINTS,
  type PriceMode,
} from "@/lib/data/material-catalog-config";
import type { CuratedProductOption } from "./new-listing-form";
import {
  REGIONS,
  CITIES,
  getCitiesForRegion,
  getMarketAreasForCity,
  formatStoredLocation,
} from "@/lib/data/market-areas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatchCategoryOption {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface BatchListingFormProps {
  categories: BatchCategoryOption[];
  curatedProducts?: CuratedProductOption[];
  sellerCompanyName: string;
  savedLocations?: string[];
  onSuccess?: () => void;
}

interface BatchItemRow {
  id: string;
  title: string;
  titleManuallyEdited: boolean; // true once user types in title directly
  categoryId: string;
  description: string;
  unit: ProductUnit;
  unitPrice: number | "";
  priceMode: PriceMode;
  availableQty: number | "";
  stockState: StockState;
  brand: string;
  imageUrl: string;
  existingProductId?: string;
  specs: Record<string, string>; // category-specific spec values
  packageSize: string; // e.g. "50 kg" when selling by bag
  vatMode: "included" | "excluded" | "confirm";
  showMoreDetails: boolean; // collapse toggle for description/image
}

const POPULAR_BRANDS = [
  "Dangote",
  "Derba",
  "Mugher",
  "National",
  "Habesha",
  "Steel R",
  "Abyssinia Cold Rolled",
  "Kadisco",
  "Super Mega",
  "Bright",
  "Standard Ethiopian",
];

// ---------------------------------------------------------------------------
// Searchable Template Combobox Component
// ---------------------------------------------------------------------------

interface SearchableTemplateComboboxProps {
  templates: CuratedProductOption[];
  onSelect: (curatedId: string) => void;
  locale: "en" | "am";
  selectedTitle?: string;
}

function SearchableTemplateCombobox({
  templates,
  onSelect,
  locale,
  selectedTitle,
}: SearchableTemplateComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) => {
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchBrand = (t.specs.brand || "").toLowerCase().includes(q);
      const matchSpecs = Object.values(t.specs).some((v) =>
        String(v).toLowerCase().includes(q)
      );
      return matchTitle || matchBrand || matchSpecs;
    });
  }, [templates, search]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs h-8 rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex items-center justify-between gap-1 text-left hover:border-primary/50 transition-colors"
      >
        <span className="truncate">
          {selectedTitle ||
            (templates.length > 0
              ? locale === "am"
                ? "ቁሳቁስ ምረጥ ወይም ፈልግ..."
                : "Choose or search material..."
              : locale === "am"
              ? "ለዚህ ምድብ ቅድመ-ዝርዝር የለም"
              : "No templates for category")}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-xl p-2 space-y-2 animate-in fade-in zoom-in-95">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                locale === "am"
                  ? "ቁሳቁስ ወይም ብራንድ ፈልግ..."
                  : "Search material, brand, or specs..."
              }
              className="text-xs h-7 pl-8 pr-7"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 text-xs">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground text-[11px]">
                {locale === "am" ? "ምንም አልተገኘም" : "No matching materials found"}
              </div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelect(t.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors flex items-start justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate group-hover:text-primary">
                      {t.title}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {t.specs.brand && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {t.specs.brand} ·
                        </span>
                      )}
                      {Object.entries(t.specs)
                        .filter(([k]) => k !== "brand")
                        .slice(0, 2)
                        .map(([k, v]) => (
                          <span key={k} className="text-[10px] text-muted-foreground">
                            {v}
                          </span>
                        ))}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0 font-normal">
                    {t.unit}
                  </Badge>
                </button>
              ))
            )}

            {/* Custom material fallback */}
            <div className="border-t border-border/50 pt-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full text-left p-1.5 rounded-md hover:bg-muted text-[11px] text-primary font-medium flex items-center gap-1.5"
              >
                <Plus className="h-3 w-3" />
                <span>
                  {locale === "am"
                    ? "ሌላ ቁሳቁስ (በእጅ አስገባ)"
                    : "Other material (enter custom specs)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatchListingForm({
  categories,
  curatedProducts = [],
  sellerCompanyName,
  savedLocations = [],
  onSuccess,
}: BatchListingFormProps) {
  const { locale } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Structured Location state
  const [selectedRegion, setSelectedRegion] = useState<string>("addis-ababa");
  const [selectedCity, setSelectedCity] = useState<string>("addis-ababa");
  const [selectedMarketArea, setSelectedMarketArea] = useState<string>("jemo");
  const [customMarketArea, setCustomMarketArea] = useState<string>("");
  const [isSuggestingArea, setIsSuggestingArea] = useState<boolean>(false);
  const [landmark, setLandmark] = useState<string>("");
  const [branchName, setBranchName] = useState("");

  // Sync formatted location string
  const computedLocation = useMemo(() => {
    return formatStoredLocation({
      cityId: selectedCity,
      marketAreaId: selectedMarketArea,
      customMarketAreaName: isSuggestingArea && customMarketArea.trim() ? customMarketArea.trim() : undefined,
      landmark: landmark.trim() || undefined,
    });
  }, [selectedCity, selectedMarketArea, isSuggestingArea, customMarketArea, landmark]);

  const [savedLocationOverride, setSavedLocationOverride] = useState<string | null>(
    savedLocations[0] || null
  );

  const location = savedLocationOverride ?? computedLocation;

  // Preview item state
  const [previewItem, setPreviewItem] = useState<BatchItemRow | null>(null);

  // Feedback state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // -------------------------------------------------------------------------
  // Row Factory
  // -------------------------------------------------------------------------

  const createInitialRow = (index: number): BatchItemRow => {
    const defaultCat = categories[0]?.id || "";
    const defaultSlug = categories[0]?.slug || "";
    const defaultUnits = getUnitsForCategory(defaultSlug);
    const defaultUnit = (defaultUnits[0] || "BAG") as ProductUnit;

    return {
      id: `row-${crypto.randomUUID()}-${index}`,
      title: "",
      titleManuallyEdited: false,
      categoryId: defaultCat,
      description: "",
      unit: defaultUnit,
      unitPrice: "",
      priceMode: "enter",
      availableQty: "",
      stockState: StockState.IN_STOCK,
      brand: "",
      imageUrl: "",
      specs: {},
      packageSize: "",
      vatMode: "included",
      showMoreDetails: false,
    };
  };

  const [items, setItems] = useState<BatchItemRow[]>([createInitialRow(1)]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleAddItem = () => {
    setItems((prev) => [...prev, createInitialRow(prev.length + 1)]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BatchItemRow>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // -------------------------------------------------------------------------
  // Auto-Title Generator: [Brand] + [Category] + [Key Specs]
  // -------------------------------------------------------------------------

  const generateAutoTitle = (row: BatchItemRow): string => {
    const cat = categories.find((c) => c.id === row.categoryId);
    const catName = cat ? getCategoryTitle(cat.slug, cat.name, "en") : "";
    const parts: string[] = [];

    // Brand first (if present)
    if (row.brand.trim()) parts.push(row.brand.trim());

    // Category / material name
    if (catName) parts.push(catName);

    // Key spec values (first 2 non-empty)
    const specValues = Object.values(row.specs).filter(Boolean).slice(0, 2);
    if (specValues.length > 0) parts.push("—");
    parts.push(...specValues);

    // Package size if present
    if (row.packageSize.trim()) parts.push(`(${row.packageSize.trim()})`);

    return parts.join(" ").trim();
  };

  /**
   * When category changes, reset unit to the first suitable unit for the new
   * category and clear incompatible specs (prevents "Truckload" remaining
   * selected when switching to Tiles, and cement specs persisting on rebar).
   */
  const handleCategoryChange = (rowId: string, newCatId: string) => {
    const cat = categories.find((c) => c.id === newCatId);
    const slug = cat?.slug || "";
    const suitableUnits = getUnitsForCategory(slug);
    const newUnit = (suitableUnits[0] || "PIECE") as ProductUnit;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const updated = {
          ...item,
          categoryId: newCatId,
          unit: newUnit,
          existingProductId: undefined,
          specs: {}, // clear all specs on category change
          packageSize: "",
        };
        // Re-generate auto title if user hasn't manually edited
        if (!item.titleManuallyEdited) {
          updated.title = generateAutoTitle(updated);
        }
        return updated;
      })
    );
  };

  /**
   * Auto-fill from curated product template — only show templates matching
   * the currently selected category.
   */
  const handlePickCurated = (rowId: string, curatedId: string) => {
    if (!curatedId) return;
    const prod = curatedProducts.find((p) => p.id === curatedId);
    if (!prod) return;

    // Extract specs from template (minus brand which is separate)
    const templateSpecs = { ...prod.specs };
    delete templateSpecs.brand;

    updateItem(rowId, {
      title: prod.title,
      titleManuallyEdited: false, // template overwrites → auto-title still active
      categoryId: prod.categoryId,
      unit: prod.unit,
      imageUrl: prod.imageUrl || "",
      brand: prod.specs.brand || "",
      existingProductId: prod.id,
      specs: templateSpecs,
    });
  };

  /**
   * Update a single spec value and optionally re-generate the auto-title.
   */
  const updateSpec = (rowId: string, specLabel: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const newSpecs = { ...item.specs, [specLabel]: value };
        const updated = { ...item, specs: newSpecs };
        if (!item.titleManuallyEdited) {
          updated.title = generateAutoTitle(updated);
        }
        return updated;
      })
    );
  };

  /**
   * Update brand and optionally re-generate auto-title.
   */
  const updateBrand = (rowId: string, brand: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const updated = { ...item, brand };
        if (!item.titleManuallyEdited) {
          updated.title = generateAutoTitle(updated);
        }
        return updated;
      })
    );
  };

  // -------------------------------------------------------------------------
  // Submission
  // -------------------------------------------------------------------------

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setErrorMsg(null);
    setSuccessCount(null);

    if (!location.trim()) {
      setErrorMsg(
        locale === "am"
          ? "እባክዎ ቁሳቁሱ የሚገኝበትን ቦታ ያስገቡ።"
          : "Please specify where this material is available."
      );
      return;
    }

    if (items.length === 0) {
      setErrorMsg(
        locale === "am"
          ? "እባክዎ ቢያንስ አንድ እቃ ያስገቡ።"
          : "Please add at least one material to list."
      );
      return;
    }

    // Validation
    const payloadItems: BatchListingItemInput[] = [];

    // Category–keyword mismatch guard
    const CATEGORY_KEYWORD_MAP: Record<string, { keywords: string[]; conflictKeywords: string[] }> = {
      rebar: { keywords: ["rebar", "steel bar", "deformed bar", "heb", "zuquala", "akaki"], conflictKeywords: ["cement", "ሲሚንቶ", "paint", "tile", "sand", "glass"] },
      cement: { keywords: ["cement", "ሲሚንቶ", "opc", "ppc", "pozzolanic", "portland"], conflictKeywords: ["rebar", "steel bar", "deformed", "pipe", "tile", "paint"] },
      paint: { keywords: ["paint", "primer", "coating", "varnish", "putty"], conflictKeywords: ["cement", "ሲሚንቶ", "rebar", "steel"] },
      tile: { keywords: ["tile", "ceramic", "porcelain", "floor", "wall cladding"], conflictKeywords: ["cement", "rebar", "steel bar"] },
    };

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const rowNum = i + 1;

      if (!it.title.trim()) {
        setErrorMsg(
          locale === "am"
            ? `እቃ #${rowNum}፡ እባክዎ የእቃውን ስም ያስገቡ።`
            : `Item #${rowNum}: Please specify material name.`
        );
        return;
      }

      if (!it.categoryId) {
        setErrorMsg(
          locale === "am"
            ? `እቃ #${rowNum}፡ እባክዎ ምድብ ይምረጡ።`
            : `Item #${rowNum}: Please select a category.`
        );
        return;
      }

      // Category–product mismatch check
      const matchedCat = categories.find((c) => c.id === it.categoryId);
      if (matchedCat) {
        const catSlug = matchedCat.slug.toLowerCase();
        const titleLower = it.title.toLowerCase();
        for (const [slug, { conflictKeywords }] of Object.entries(CATEGORY_KEYWORD_MAP)) {
          if (catSlug.includes(slug)) {
            const conflict = conflictKeywords.find((kw) => titleLower.includes(kw));
            if (conflict) {
              setErrorMsg(
                locale === "am"
                  ? `እቃ #${rowNum} ("${it.title}")፡ ይህ ምርት ለ "${matchedCat.name}" ምድብ አይስማማም። ትክክለኛ ምድብ ይምረጡ።`
                  : `Item #${rowNum} ("${it.title}"): This product does not belong to the "${matchedCat.name}" category. Please select the correct category.`
              );
              return;
            }
            break;
          }
        }
      }

      // Price validation: only if user chose "enter" mode
      const rate = it.priceMode === "enter"
        ? typeof it.unitPrice === "number"
          ? it.unitPrice
          : parseFloat(it.unitPrice || "0")
        : 0; // "ask" mode → 0

      if (it.priceMode === "enter" && (isNaN(rate) || rate <= 0)) {
        setErrorMsg(
          locale === "am"
            ? `እቃ #${rowNum} (${it.title})፡ ዋጋ ከ 0 ብር በላይ መሆን አለበት ወይም "ዋጋ ጠይቅ" ይምረጡ።`
            : `Item #${rowNum} ("${it.title}"): Enter a price greater than 0 ETB, or choose "Ask for price".`
        );
        return;
      }

      const qty =
        it.availableQty === ""
          ? undefined
          : typeof it.availableQty === "number"
          ? it.availableQty
          : parseFloat(it.availableQty || "0");

      if (qty !== undefined && (isNaN(qty) || qty < 0)) {
        setErrorMsg(
          locale === "am"
            ? `እቃ #${rowNum} (${it.title})፡ የሚገኝ ብዛት ከ 0 በታች መሆን አይችልም።`
            : `Item #${rowNum} ("${it.title}"): Available quantity cannot be negative.`
        );
        return;
      }

      payloadItems.push({
        title: it.title.trim(),
        categoryId: it.categoryId,
        description: it.description.trim() || undefined,
        unit: it.unit,
        unitPrice: rate > 0 ? rate : undefined,
        availableQty: qty !== undefined ? Math.round(qty) : undefined,
        brand: it.brand.trim() || undefined,
        imageUrl: it.imageUrl.trim() || undefined,
        existingProductId: it.existingProductId || undefined,
        stockState: it.stockState,
        vatMode: it.vatMode,
      });
    }

    startTransition(async () => {
      const finalLocation = branchName.trim()
        ? `${branchName.trim()} — ${location.trim()}`
        : location.trim();

      const res = await createBatchSellerListingsAction({
        location: finalLocation,
        items: payloadItems,
      });

      if (!res || res.error) {
        setErrorMsg(res?.error || "Failed to create batch listings.");
        return;
      }

      setSuccessCount(res.count || payloadItems.length);
      // Don't auto-redirect — let the user choose "Add another" or "Finish"
      if (onSuccess) {
        onSuccess();
      }
    });
  };

  // -------------------------------------------------------------------------
  // Computed values
  // -------------------------------------------------------------------------

  const totalCalculatedValue = items.reduce((acc, row) => {
    if (row.priceMode !== "enter") return acc;
    const rate = typeof row.unitPrice === "number" ? row.unitPrice : parseFloat(row.unitPrice || "0");
    const qty = typeof row.availableQty === "number" ? row.availableQty : parseFloat(row.availableQty || "0");
    if (!isNaN(rate) && rate > 0 && !isNaN(qty) && qty > 0) {
      return acc + rate * qty;
    }
    return acc;
  }, 0);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Success Notification with Action Buttons */}
      {successCount !== null && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 animate-in fade-in space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-bold">
                {locale === "am"
                  ? `${successCount} የግንባታ እቃዎች በተሳካ ሁኔታ ተመዝግበዋል!`
                  : `Successfully listed ${successCount} construction materials!`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === "am"
                  ? "ተጨማሪ እቃ ማስገባት ወይም መቆጣጠሪያ ገጹን ማየት ይችላሉ።"
                  : "You can add more materials or go to your dashboard."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-8">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSuccessCount(null);
                setItems([createInitialRow(1)]);
              }}
              className="gap-1.5 text-xs font-bold border-primary/50 text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {locale === "am" ? "ተጨማሪ እቃ ጨምር" : "Add more materials"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                router.push("/seller/dashboard");
                router.refresh();
              }}
              className="gap-1.5 text-xs font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {locale === "am" ? "ጨርሻለሁ — ዳሽቦርድ ይመልከቱ" : "Done — go to dashboard"}
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive font-medium flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* =============================================================== */}
        {/* SECTION 1: Location — "Where is this material available?"       */}
        {/* =============================================================== */}
        <Card className="border border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="py-4 px-5 border-b border-border/50 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">
                    {locale === "am"
                      ? "ቁሳቁሱ የት ይገኛል?"
                      : "Where is this material available?"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {locale === "am"
                      ? "ገዢዎች አቅራቢዎችን እንዲያገኙ እና ወኪሎችን ለመመደብ ይጠቅማል"
                      : "Helps buyers find suppliers and assign nearby agents"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono self-start sm:self-auto">
                <Building2 className="h-3 w-3 mr-1 text-primary" />
                {sellerCompanyName}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            {/* Structured Location Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Region */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>{locale === "am" ? "1. ክልል" : "1. Region"}</span>
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    const reg = e.target.value;
                    setSelectedRegion(reg);
                    setSavedLocationOverride(null);
                    const citiesInReg = getCitiesForRegion(reg);
                    if (citiesInReg.length > 0) {
                      const firstCity = citiesInReg[0].id;
                      setSelectedCity(firstCity);
                      const areasInCity = getMarketAreasForCity(firstCity);
                      if (areasInCity.length > 0) {
                        setSelectedMarketArea(areasInCity[0].id);
                      }
                    }
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {locale === "am" ? r.nameAm : r.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. City or Town */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>{locale === "am" ? "2. ከተማ / ወረዳ" : "2. City / Town"}</span>
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCity(cId);
                    setSavedLocationOverride(null);
                    const areasInCity = getMarketAreasForCity(cId);
                    if (areasInCity.length > 0) {
                      setSelectedMarketArea(areasInCity[0].id);
                    }
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {getCitiesForRegion(selectedRegion).length > 0 ? (
                    getCitiesForRegion(selectedRegion).map((c) => (
                      <option key={c.id} value={c.id}>
                        {locale === "am" ? c.nameAm : c.nameEn}
                      </option>
                    ))
                  ) : (
                    CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {locale === "am" ? c.nameAm : c.nameEn}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 3. Market Area / Neighborhood */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <span>{locale === "am" ? "3. የገበያ ቦታ / ሰፈር" : "3. Market Area"}</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsSuggestingArea(!isSuggestingArea)}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    {isSuggestingArea
                      ? locale === "am"
                        ? "ከዝርዝሩ ምረጥ"
                        : "Select from list"
                      : locale === "am"
                      ? "አልተዘረዘረም?"
                      : "Not listed?"}
                  </button>
                </div>

                {!isSuggestingArea ? (
                  <select
                    value={selectedMarketArea}
                    onChange={(e) => {
                      setSavedLocationOverride(null);
                      if (e.target.value === "__SUGGEST__") {
                        setIsSuggestingArea(true);
                      } else {
                        setSelectedMarketArea(e.target.value);
                      }
                    }}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {getMarketAreasForCity(selectedCity).map((m) => (
                      <option key={m.id} value={m.id}>
                        {locale === "am" ? m.nameAm : m.nameEn}
                        {m.isBoundaryArea
                          ? locale === "am"
                            ? " (ድንበር)"
                            : " (Boundary)"
                          : ""}
                      </option>
                    ))}
                    <option value="__SUGGEST__">
                      ✨ {locale === "am" ? "ቦታ ጠቁም (በዝርዝር ውስጥ የሌለ)..." : "Suggest an area not listed..."}
                    </option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <Input
                      value={customMarketArea}
                      onChange={(e) => {
                        setCustomMarketArea(e.target.value);
                        setSavedLocationOverride(null);
                      }}
                      placeholder={
                        locale === "am"
                          ? "የገበያ ቦታውን ስም ያስገቡ"
                          : "Enter suggested market area"
                      }
                      className="h-9 text-xs border-primary/50"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "am"
                        ? "ለአስተዳዳሪው ይላካል እና ወዲያውኑ በካታሎግ ውስጥ ይካተታል"
                        : "Submitted to admin for immediate catalog indexing"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Branch & Landmark Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Business Location / Branch */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {locale === "am"
                    ? "የንግድ ቦታ / ቅርንጫፍ (አማራጭ)"
                    : "Business Location / Branch (Optional)"}
                </Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Main Depot, Branch 2"
                  className="text-xs"
                />
              </div>

              {/* Landmark / Gate Details */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {locale === "am"
                    ? "መለያ ምልክት / በር (አማራጭ)"
                    : "Landmark / Specific Gate (Optional)"}
                </Label>
                <Input
                  value={landmark}
                  onChange={(e) => {
                    setLandmark(e.target.value);
                    setSavedLocationOverride(null);
                  }}
                  placeholder="e.g. Near Total Station, Behind Commercial Bank, Gate 3"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Live Location Preview */}
            <div className="rounded-lg bg-muted/30 border border-border/60 p-2.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>
                  {locale === "am" ? "የሚታየው የመጋዘን አድራሻ፦" : "Buyer-Facing Depot Location:"}
                </span>
              </span>
              <span className="font-semibold text-foreground">
                {branchName.trim()
                  ? `${branchName.trim()} — ${location}`
                  : location}
              </span>
            </div>

            {/* Quick-Pick Popular Addis Ababa & Surrounding Market Hubs */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span>
                    {locale === "am"
                      ? "ዋና ዋና የገበያ ቦታዎች (በ1-ጠቅታ ይምረጡ)፦"
                      : "Major Market Areas (Quick 1-Click Pick):"}
                  </span>
                </Label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "merkato", label: "Merkato", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "jemo", label: "Jemo", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "kality", label: "Kality", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "ayat", label: "Ayat", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "summit", label: "Summit", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "megenagna", label: "Megenagna", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "urael", label: "Urael", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "mexico", label: "Mexico", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "piyassa", label: "Piyassa", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "ayertena", label: "Ayertena", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "betel", label: "Betel", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "alem-bank", label: "Alem Bank", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "tulu-dimtu", label: "Tulu Dimtu", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "koye-feche", label: "Koye Feche (Boundary)", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "ashewa-meda", label: "Ashewa Meda (Boundary)", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "addisu-gebeya", label: "Addisu Gebeya", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "saris", label: "Saris", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "bole", label: "Bole", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "gerji", label: "Gerji", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "gurd-shola", label: "Gurd Shola", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "cmc", label: "CMC", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "kotebe", label: "Kotebe", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "shola", label: "Shola", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "tor-hailoch", label: "Tor Hailoch", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "lideta", label: "Lideta", cityId: "addis-ababa", regionId: "addis-ababa" },
                  { id: "burayu-center", label: "Burayu", cityId: "burayu", regionId: "oromia-surrounding" },
                  { id: "sululta-hub", label: "Sululta", cityId: "sululta", regionId: "oromia-surrounding" },
                  { id: "gelan-dry-port", label: "Gelan", cityId: "gelan", regionId: "oromia-surrounding" },
                  { id: "sebeta-industrial", label: "Sebeta", cityId: "sebeta", regionId: "oromia-surrounding" },
                  { id: "legetafo-center", label: "Legetafo", cityId: "legetafo", regionId: "oromia-surrounding" },
                  { id: "furi-station", label: "Furi", cityId: "furi", regionId: "oromia-surrounding" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(item.regionId);
                      setSelectedCity(item.cityId);
                      setSelectedMarketArea(item.id);
                      setIsSuggestingArea(false);
                      setSavedLocationOverride(null);
                    }}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-md border transition-colors",
                      selectedCity === item.cityId &&
                        selectedMarketArea === item.id &&
                        !isSuggestingArea
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved / Previous Locations Quick Picker */}
            {savedLocations && savedLocations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-primary" />
                  <span>
                    {locale === "am"
                      ? "የተቀመጡ / ያለፉ ቦታዎችዎ"
                      : "Your Saved / Previous Locations"}
                  </span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {savedLocations.map((savedLoc) => (
                    <button
                      key={savedLoc}
                      type="button"
                      onClick={() => setSavedLocationOverride(savedLoc)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1",
                        location === savedLoc
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                          : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                      )}
                    >
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>{savedLoc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* =============================================================== */}
        {/* SECTION 2: Material Batch Items                                */}
        {/* =============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {locale === "am" ? "የእቃዎች ዝርዝር" : "Material Items"}
              </h2>
              <Badge variant="secondary" className="text-xs font-bold">
                {items.length} {items.length === 1
                  ? (locale === "am" ? "እቃ" : "item")
                  : (locale === "am" ? "እቃዎች" : "items")}
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="gap-1.5 text-xs font-bold border-dashed border-primary/50 text-primary hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{locale === "am" ? "ተጨማሪ እቃ ጨምር" : "Add another item"}</span>
            </Button>
          </div>

          {items.map((item, index) => {
            const rowNumber = index + 1;
            const categoryMatch = categories.find((c) => c.id === item.categoryId);
            const catSlug = categoryMatch?.slug || "";
            const suitableUnits = getUnitsForCategory(catSlug);

            // Filter curated products by selected category
            const filteredTemplates = curatedProducts.filter(
              (cp) => cp.categoryId === item.categoryId
            );

            // Category-specific spec fields to render
            const specHints = CATEGORY_SPEC_HINTS[catSlug] || [];

            // Show package-size field for container-like units
            const PACKAGE_UNITS = ["BAG", "BOX", "ROLL", "BUNDLE", "DRUM", "BUCKET"];
            const needsPackageSize = PACKAGE_UNITS.includes(item.unit);

            return (
              <Card
                key={item.id}
                className="border border-border/80 shadow-sm relative overflow-hidden transition-all hover:border-primary/40 bg-card"
              >
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary/70" />

                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Row Header */}
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                        {rowNumber}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {item.title ? item.title : `${locale === "am" ? "እቃ" : "Item"} #${rowNumber}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                        className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-primary"
                        title="Preview Listing"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span className="hidden sm:inline">
                          {locale === "am" ? "ቅድመ-ዕይታ" : "Preview"}
                        </span>
                      </Button>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ===== FORM GRID ===== */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
                    {/* 1. Category (First!) */}
                    <div className="lg:col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{locale === "am" ? "ምድብ" : "Category"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                        className="w-full text-xs h-8 rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {getCategoryTitle(cat.slug, cat.name, locale)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Material Template (filtered by category with searchable dropdown) */}
                    <div className="lg:col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>{locale === "am" ? "ቁሳቁስ ምረጥ" : "Choose a material"}</span>
                      </Label>
                      <SearchableTemplateCombobox
                        templates={filteredTemplates}
                        onSelect={(curatedId) => handlePickCurated(item.id, curatedId)}
                        locale={locale}
                        selectedTitle={
                          item.existingProductId
                            ? filteredTemplates.find((t) => t.id === item.existingProductId)?.title
                            : undefined
                        }
                      />
                    </div>

                    {/* 3. Brand */}
                    <div className="lg:col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold">
                        {locale === "am" ? "ብራንድ / ፋብሪካ" : "Brand / Manufacturer"}
                      </Label>
                      <Input
                        value={item.brand}
                        onChange={(e) => updateBrand(item.id, e.target.value)}
                        placeholder="e.g. Dangote, Derba"
                        className="text-xs h-8"
                        list={`brands-list-${item.id}`}
                      />
                      <datalist id={`brands-list-${item.id}`}>
                        {POPULAR_BRANDS.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    {/* 4. Category-Specific Specifications */}
                    {specHints.length > 0 && (
                      <>
                        <div className="lg:col-span-12 flex items-center gap-1.5 pt-1">
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {locale === "am" ? "ዝርዝር መግለጫ" : "Specifications"}
                          </span>
                          <div className="flex-1 h-px bg-border/60" />
                        </div>
                        {specHints.map((hint) => (
                          <div key={hint.label} className="lg:col-span-4 space-y-1">
                            <Label className="text-[11px] font-semibold">
                              {locale === "am" ? hint.labelAm : hint.label}
                            </Label>
                            <Input
                              value={item.specs[hint.label] || ""}
                              onChange={(e) => updateSpec(item.id, hint.label, e.target.value)}
                              placeholder={hint.placeholder}
                              className="text-xs h-8"
                            />
                          </div>
                        ))}
                      </>
                    )}

                    {/* 5. Unit (filtered by category) */}
                    <div className="lg:col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{locale === "am" ? "መለኪያ" : "Sold by"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value as ProductUnit })}
                        className="w-full text-xs h-8 rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {suitableUnits.map((u) => (
                          <option key={u} value={u}>
                            {getUnitLabel(u, locale as "en" | "am")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 6. Package Size (conditional — bags, boxes, rolls, etc.) */}
                    {needsPackageSize && (
                      <div className="lg:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold">
                          {locale === "am" ? "የፓኬጅ ይዘት" : `${getUnitLabel(item.unit, "en")} size / contents`}
                        </Label>
                        <Input
                          value={item.packageSize}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((r) => {
                                if (r.id !== item.id) return r;
                                const updated = { ...r, packageSize: val };
                                if (!r.titleManuallyEdited) {
                                  updated.title = generateAutoTitle(updated);
                                }
                                return updated;
                              })
                            );
                          }}
                          placeholder={
                            item.unit === "BAG" ? "e.g. 50 kg"
                            : item.unit === "BOX" ? "e.g. 1.44 m²"
                            : item.unit === "ROLL" ? "e.g. 100m"
                            : item.unit === "DRUM" ? "e.g. 200L"
                            : item.unit === "BUCKET" ? "e.g. 18L"
                            : item.unit === "BUNDLE" ? "e.g. 20 pieces"
                            : "e.g. contents"
                          }
                          className="text-xs h-8"
                        />
                      </div>
                    )}

                    {/* 7. Availability Status + Optional Quantity */}
                    <div className={cn("space-y-1", needsPackageSize ? "lg:col-span-6" : "lg:col-span-9")}>
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{locale === "am" ? "ዝግጁነት" : "Availability"}</span>
                        <span className="text-destructive">*</span>
                      </Label>

                      <div className="flex items-center gap-2">
                        {/* Status Dropdown */}
                        <select
                          value={item.stockState}
                          onChange={(e) => updateItem(item.id, { stockState: e.target.value as StockState })}
                          className={cn(
                            "text-xs h-8 rounded-md border border-input px-2 focus:outline-none focus:ring-1 focus:ring-primary shrink-0 min-w-[130px]",
                            item.stockState === "IN_STOCK"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                              : item.stockState === "LIMITED"
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                              : item.stockState === "ON_ORDER"
                              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800"
                          )}
                        >
                          {Object.keys(STOCK_STATE_LABELS).map((state) => (
                            <option key={state} value={state}>
                              {getStockStateLabel(state, locale as "en" | "am")}
                            </option>
                          ))}
                        </select>

                        {/* Optional Quantity */}
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={item.availableQty}
                            onChange={(e) =>
                              updateItem(item.id, {
                                availableQty: e.target.value === "" ? "" : Number(e.target.value),
                              })
                            }
                            placeholder={locale === "am" ? "ብዛት (አማራጭ)" : "Qty (optional)"}
                            className="text-xs h-8 font-mono pr-16"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            {getUnitLabel(item.unit, locale as "en" | "am").split(" ")[0].toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 8. Price — Enter or Ask */}
                    <div className="lg:col-span-12 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          {locale === "am"
                            ? `ዋጋ በ${getUnitLabel(item.unit, "am")}`
                            : `Price per ${getUnitLabel(item.unit, "en")} (ETB)`}
                        </span>
                        {item.packageSize.trim() && (
                          <span className="text-[10px] text-muted-foreground">
                            — {item.packageSize.trim()}
                          </span>
                        )}
                      </Label>

                      <div className="flex items-center gap-2">
                        {/* Toggle: Enter Price / Ask for Price */}
                        <div className="flex rounded-md border border-input overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { priceMode: "enter" })}
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-bold transition-colors",
                              item.priceMode === "enter"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/30 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {locale === "am" ? "ዋጋ አስገባ" : "Enter price"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { priceMode: "ask", unitPrice: "" })}
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-bold transition-colors border-l border-input",
                              item.priceMode === "ask"
                                ? "bg-amber-500 text-white"
                                : "bg-muted/30 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {locale === "am" ? "ዋጋ ጠይቅ" : "Ask for price"}
                          </button>
                        </div>

                        {/* Price input (only if enter mode) */}
                        {item.priceMode === "enter" ? (
                          <div className="relative flex-1 max-w-xs">
                            <Input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  unitPrice: e.target.value === "" ? "" : Number(e.target.value),
                                })
                              }
                              placeholder="e.g. 950"
                              className="text-xs h-8 pl-12 font-mono font-bold"
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                              ETB
                            </span>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                            <MessageSquareMore className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                              {locale === "am"
                                ? "ገዢዎች ዋጋውን ይጠይቃሉ"
                                : "Buyers will contact you for pricing"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* VAT Indicator */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          {locale === "am" ? "ተ.እ.ታ (VAT):" : "VAT:"}
                        </span>
                        <div className="inline-flex rounded-md border border-input overflow-hidden text-[10px] bg-background">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { vatMode: "included" })}
                            className={cn(
                              "px-2.5 py-0.5 font-medium transition-colors",
                              item.vatMode === "included"
                                ? "bg-primary text-primary-foreground font-bold"
                                : "hover:bg-muted text-muted-foreground"
                            )}
                          >
                            {locale === "am" ? "ያካተተ (Included)" : "VAT Included"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { vatMode: "excluded" })}
                            className={cn(
                              "px-2.5 py-0.5 font-medium transition-colors border-l border-input",
                              item.vatMode === "excluded"
                                ? "bg-primary text-primary-foreground font-bold"
                                : "hover:bg-muted text-muted-foreground"
                            )}
                          >
                            {locale === "am" ? "ያልተካተተ (+15%)" : "Excluded (+15%)"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { vatMode: "confirm" })}
                            className={cn(
                              "px-2.5 py-0.5 font-medium transition-colors border-l border-input",
                              item.vatMode === "confirm"
                                ? "bg-primary text-primary-foreground font-bold"
                                : "hover:bg-muted text-muted-foreground"
                            )}
                          >
                            {locale === "am" ? "ያረጋግጡ" : "Confirm w/ Supplier"}
                          </button>
                        </div>
                      </div>

                      {item.priceMode === "enter" && (
                        <p className="text-[9px] text-muted-foreground">
                          {locale === "am"
                            ? "ይህ ዋጋ አመላካች ነው። ትክክለኛ ዋጋ ከአቅራቢ ጋር ያረጋግጡ።"
                            : "Indicative price. Confirm final price with supplier."}
                        </p>
                      )}
                    </div>

                    {/* 9. Auto-generated Title (editable) */}
                    <div className="lg:col-span-12 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1.5">
                        <Tag className="h-3 w-3" />
                        <span>{locale === "am" ? "የዝርዝር ርዕስ" : "Listing Title"}</span>
                        <span className="text-destructive">*</span>
                        {!item.titleManuallyEdited && item.title && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-normal text-muted-foreground">
                            {locale === "am" ? "ራስ-ሰር" : "auto-generated"}
                          </Badge>
                        )}
                      </Label>
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          updateItem(item.id, {
                            title: e.target.value,
                            titleManuallyEdited: true,
                          });
                        }}
                        placeholder={
                          locale === "am"
                            ? "ምሳሌ: ዳንጎቴ ሲሚንቶ — 42.5R (50 ኪ.ግ ከረጢት)"
                            : "e.g. Dangote Cement — 42.5R (50 kg bag)"
                        }
                        className="text-xs h-8"
                      />
                      <p className="text-[9px] text-muted-foreground">
                        {locale === "am"
                          ? "ይህ ርዕስ ከብራንድ፣ ምድብ እና ዝርዝር መግለጫ ራስ-ሰር ይፈጠራል።"
                          : "Auto-generated from brand, category & specs. Edit directly if needed."}
                      </p>
                    </div>
                  </div>

                  {/* ===== MORE DETAILS (Collapsible) ===== */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { showMoreDetails: !item.showMoreDetails })}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:underline"
                    >
                      {item.showMoreDetails ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {locale === "am" ? "ተጨማሪ ዝርዝሮች" : "More details — optional"}
                    </button>

                    {item.showMoreDetails && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pl-4 border-l-2 border-border/50 animate-in slide-in-from-top-1">
                        {/* Description */}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">
                            {locale === "am" ? "መግለጫ" : "Description / Notes"}
                          </Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder={
                              locale === "am"
                                ? "ምሳሌ: OPC 42.5R ደረጃ, አዲስ ምርት"
                                : "e.g. Grade 42.5R, factory fresh, standard packaging"
                            }
                            className="text-xs h-8"
                          />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">
                            {locale === "am" ? "ፎቶ / ምስል" : "Photo / Image URL"}
                          </Label>
                          <div className="flex items-center gap-2">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageUrl}
                                alt={item.title || "Preview"}
                                className="h-8 w-8 rounded object-cover border border-border shrink-0"
                              />
                            ) : categoryMatch?.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={categoryMatch.imageUrl}
                                alt="Category icon"
                                className="h-8 w-8 rounded object-cover border border-border opacity-60 shrink-0"
                                title="Category fallback"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                            <Input
                              placeholder={locale === "am" ? "የምስል አድራሻ..." : "Image URL..."}
                              value={item.imageUrl}
                              onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                              className="text-[11px] h-8 flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add Another Item Button */}
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="w-full sm:w-auto gap-2 text-xs font-bold py-5 px-6 border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary"
          >
            <Plus className="h-4 w-4" />
            <span>
              {locale === "am"
                ? "+ ተጨማሪ እቃ ጨምር"
                : "+ Add another item"}
            </span>
          </Button>
        </div>

        {/* =============================================================== */}
        {/* BATCH SUBMISSION BAR                                            */}
        {/* =============================================================== */}
        <Card className="border border-primary/30 bg-primary/5 shadow-md">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>{locale === "am" ? "የባች ማጠቃለያ" : "Batch Summary"}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {items.length} {locale === "am" ? "እቃዎች" : "items"}
                  </Badge>
                </p>
                {totalCalculatedValue > 0 && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {locale === "am" ? "የተገመተ ዋጋ፡ " : "Estimated Total Stock Value: "}
                    <span className="font-bold text-foreground">
                      {formatPrice(totalCalculatedValue, locale)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/seller/dashboard")}
                className="text-xs"
              >
                {locale === "am" ? "ሰርዝ" : "Cancel"}
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 px-5 py-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{locale === "am" ? "እየተመዘገበ ነው..." : "Publishing..."}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {locale === "am"
                        ? `ሁሉንም ${items.length} እቃዎች መዝግብ`
                        : `Publish All ${items.length} Items`}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Preview Listing Modal */}
      {previewItem && (
        <Dialog
          open={Boolean(previewItem)}
          onOpenChange={(open) => !open && setPreviewItem(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                <Eye className="h-4 w-4" />
                <span>
                  {locale === "am" ? "የገዢ ካታሎግ ቅድመ-ዕይታ" : "Buyer Catalog Preview"}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                {previewItem.title ||
                  (locale === "am" ? "ያልተሰየመ ቁሳቁስ" : "Untitled Material")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {locale === "am"
                  ? "ይህ ዝርዝር ለገዢዎች በህዝባዊ ካታሎግ ላይ በዚህ መልክ ይታያል"
                  : "This is exactly how buyers will see this listing on the public catalog"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm">
                <div className="relative aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      previewItem.imageUrl ||
                      getProductFallback(
                        categories.find((c) => c.id === previewItem.categoryId)?.name ||
                          "materials"
                      )
                    }
                    alt={previewItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] backdrop-blur-md bg-background/80 font-bold"
                    >
                      {categories.find((c) => c.id === previewItem.categoryId)?.name ||
                        "Material"}
                    </Badge>
                    <Badge
                      variant="default"
                      className="text-[10px] bg-emerald-600 text-white font-medium"
                    >
                      {previewItem.stockState.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-bold text-base text-foreground">
                      {previewItem.title || "Material Title"}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-primary" />
                      {location || "Addis Ababa"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        {previewItem.priceMode === "enter" ? "Indicative Price" : "Pricing"}
                      </span>
                      {previewItem.priceMode === "enter" && previewItem.unitPrice ? (
                        <div className="flex items-baseline gap-1 font-mono">
                          <span className="text-base font-black text-foreground">
                            {formatPrice(Number(previewItem.unitPrice), locale)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {getUnitLabel(previewItem.unit, locale)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {locale === "am" ? "ዋጋ ይጠይቁ" : "Ask for Price"}
                        </span>
                      )}
                    </div>

                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border-primary/30 text-primary"
                    >
                      {previewItem.vatMode === "included"
                        ? "VAT Included"
                        : previewItem.vatMode === "excluded"
                        ? "VAT Excluded (+15%)"
                        : "Confirm VAT"}
                    </Badge>
                  </div>

                  {/* Specs summary */}
                  {(previewItem.brand ||
                    Object.entries(previewItem.specs).some(([, v]) => Boolean(v))) && (
                    <div className="text-xs space-y-1.5 border-t border-border/40 pt-2.5">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {locale === "am" ? "ዝርዝር መግለጫ" : "Specifications"}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {previewItem.brand && (
                          <div className="text-muted-foreground">
                            Brand: <strong className="text-foreground">{previewItem.brand}</strong>
                          </div>
                        )}
                        {Object.entries(previewItem.specs)
                          .filter(([, v]) => Boolean(v))
                          .map(([k, v]) => (
                            <div key={k} className="text-muted-foreground capitalize">
                              {k}: <strong className="text-foreground">{v}</strong>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPreviewItem(null)}
                >
                  {locale === "am" ? "ዝጋ" : "Close Preview"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
