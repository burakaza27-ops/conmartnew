"use client";

// =============================================================================
// ConMart — Seller Multi-Item Batch Listing Form
// =============================================================================
// Enables suppliers to rapidly list multiple construction materials in a single
// batch: Item / Description / Unit / Rate / Available Quantity / Brand / Image
// with "+ Add another item" dynamic row controls and atomic batch submission.
// =============================================================================

import React, { useState, useTransition } from "react";
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
  Upload,
  Info,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/image-uploader";
import {
  createBatchSellerListingsAction,
  type BatchListingItemInput,
} from "@/app/actions/listings";
import { ProductUnit } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getLocalizedUnit,
  formatPrice,
} from "@/lib/i18n/translations";
import type { CuratedProductOption } from "./new-listing-form";

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
  onSuccess?: () => void;
}

interface BatchItemRow {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  unit: ProductUnit;
  unitPrice: number | "";
  availableQty: number | "";
  brand: string;
  imageUrl: string;
  existingProductId?: string;
}

const COMMON_DEPOT_LOCATIONS = [
  "Addis Ababa, Kaliti Industrial Zone",
  "Addis Ababa, Megenagna Materials Depot",
  "Addis Ababa, Gofa Warehouse Corridor",
  "Addis Ababa, Akaki-Kaliti Logistics Hub",
  "Addis Ababa, Kolfe Keranio Depot",
  "Addis Ababa, Bole Bulbula Yard",
  "Dukem / Gelan Industrial Zone",
  "Sebeta / Burayu Depot",
];

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

export function BatchListingForm({
  categories,
  curatedProducts = [],
  sellerCompanyName,
  onSuccess,
}: BatchListingFormProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [location, setLocation] = useState(COMMON_DEPOT_LOCATIONS[0]);
  const [branchName, setBranchName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const createInitialRow = (index: number): BatchItemRow => {
    const defaultCat = categories[0]?.id || "";
    return {
      id: `row-${crypto.randomUUID()}-${index}`,
      title: "",
      categoryId: defaultCat,
      description: "",
      unit: ProductUnit.QUINTAL,
      unitPrice: "",
      availableQty: "",
      brand: "",
      imageUrl: "",
    };
  };

  const [items, setItems] = useState<BatchItemRow[]>([
    createInitialRow(1),
    createInitialRow(2),
  ]);

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

  const handlePickCurated = (rowId: string, curatedId: string) => {
    if (!curatedId) return;
    const prod = curatedProducts.find((p) => p.id === curatedId);
    if (!prod) return;

    updateItem(rowId, {
      title: prod.title,
      categoryId: prod.categoryId,
      unit: prod.unit,
      imageUrl: prod.imageUrl || "",
      brand: prod.specs.brand || "",
      existingProductId: prod.id,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setErrorMsg(null);
    setSuccessCount(null);

    if (!location.trim()) {
      setErrorMsg(
        locale === "am"
          ? "እባክዎ የመጋዘን ወይም የይዞታ ቦታዎን ያስገቡ።"
          : "Please specify your warehouse yard or depot location."
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

    // Category–keyword mismatch guard: prevent cement appearing under rebar, etc.
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

      // Check for category–product mismatch
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

      const rate = typeof it.unitPrice === "number" ? it.unitPrice : parseFloat(it.unitPrice || "0");
      if (isNaN(rate) || rate <= 0) {
        setErrorMsg(
          locale === "am"
            ? `እቃ #${rowNum} (${it.title})፡ ዋጋ (Rate) ከ 0 ብር በላይ መሆን አለበት።`
            : `Item #${rowNum} ("${it.title}"): Rate (unit price) must be greater than zero ETB.`
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
        unitPrice: rate,
        availableQty: qty,
        brand: it.brand.trim() || undefined,
        imageUrl: it.imageUrl.trim() || undefined,
        existingProductId: it.existingProductId || undefined,
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
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push("/seller/dashboard");
          router.refresh();
        }, 1200);
      }
    });
  };

  const totalCalculatedValue = items.reduce((acc, row) => {
    const rate = typeof row.unitPrice === "number" ? row.unitPrice : parseFloat(row.unitPrice || "0");
    const qty = typeof row.availableQty === "number" ? row.availableQty : parseFloat(row.availableQty || "0");
    if (!isNaN(rate) && rate > 0 && !isNaN(qty) && qty > 0) {
      return acc + rate * qty;
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successCount !== null && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-bold">
              {locale === "am"
                ? `${successCount} የግንባታ እቃዎች በተሳካ ሁኔታ ተመዝግበዋል!`
                : `Successfully listed ${successCount} construction materials!`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "am"
                ? "ወደ መቆጣጠሪያ ገጽ እየተዛወረ ነው..."
                : "Redirecting to your seller dashboard..."}
            </p>
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
        {/* Warehouse Location Header Card */}
        <Card className="border border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="py-4 px-5 border-b border-border/50 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">
                    {locale === "am" ? "የመጋዘን / ይዞታ ቦታ (Warehouse Yard Location)" : "Warehouse Depot / Yard Location"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {locale === "am"
                      ? "በዚህ ባች ውስጥ ለሚመዘገቡ እቃዎች በሙሉ የሚሰራ"
                      : "Shared pickup & dispatch location for all items in this batch"}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {locale === "am" ? "የቅርንጫፍ ስም (አማራጭ)" : "Branch Name / Store Branch (Optional)"}
                </Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Branch 2 - Bole Bulbula Yard, Main Yard"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {locale === "am" ? "የመጋዘኑ / የቅርንጫፉ አድራሻ *" : "Depot / Yard Address *"}
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Addis Ababa, Kaliti Industrial Zone"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Quick Location Shortcuts */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium">
                {locale === "am" ? "ፈጣን ምርጫዎች፡" : "Quick Location Presets:"}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {COMMON_DEPOT_LOCATIONS.slice(0, 5).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-md border transition-colors",
                      location === loc
                        ? "bg-primary text-primary-foreground border-primary font-bold"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                    )}
                  >
                    {loc.replace("Addis Ababa, ", "")}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Multi-Item Table / Card Stack */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {locale === "am" ? "የእቃዎች ዝርዝር" : "Material Batch Items"}
              </h2>
              <Badge variant="secondary" className="text-xs font-bold">
                {items.length} {items.length === 1 ? "item" : "items"}
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
                      {/* Quick Curated Autofill Dropdown */}
                      {curatedProducts.length > 0 && (
                        <select
                          className="text-[11px] h-7 rounded border border-border/60 bg-muted/40 px-2 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          value=""
                          onChange={(e) => handlePickCurated(item.id, e.target.value)}
                        >
                          <option value="">{locale === "am" ? "ቅድመ-የተዘጋጀ እቃ ምረጥ..." : "Pick curated template..."}</option>
                          {curatedProducts.map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              {cp.title}
                            </option>
                          ))}
                        </select>
                      )}

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

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
                    {/* 1. Item Title */}
                    <div className="lg:col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{locale === "am" ? "የእቃ ስም (Item)" : "Item / Material Title"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        placeholder="e.g. Dangote Cement 42.5R"
                        className="text-xs h-8"
                      />
                    </div>

                    {/* 2. Category */}
                    <div className="lg:col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{locale === "am" ? "ምድብ (Category)" : "Category"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={item.categoryId}
                        onChange={(e) => updateItem(item.id, { categoryId: e.target.value })}
                        className="w-full text-xs h-8 rounded-md border border-input bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {getCategoryTitle(cat.slug, cat.name, locale)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Unit */}
                    <div className="lg:col-span-2 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{locale === "am" ? "መለኪያ (Unit)" : "Unit"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value as ProductUnit })}
                        className="w-full text-xs h-8 rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      >
                        {Object.values(ProductUnit).map((u) => (
                          <option key={u} value={u}>
                            {getLocalizedUnit(u, locale)} ({u})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Rate (Unit Price ETB) */}
                    <div className="lg:col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold flex items-center gap-1">
                        <span>{locale === "am" ? "ዋጋ በብር (Rate / Unit Price)" : "Rate (ETB)"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
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
                    </div>

                    {/* 5. Available Quantity */}
                    <div className="lg:col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold">
                        {locale === "am" ? "የሚገኝ ብዛት (Available Qty)" : "Available Quantity"}
                      </Label>
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
                        placeholder="e.g. 500"
                        className="text-xs h-8 font-mono"
                      />
                    </div>

                    {/* 6. Brand */}
                    <div className="lg:col-span-3 space-y-1">
                      <Label className="text-[11px] font-semibold">
                        {locale === "am" ? "ብራንድ / ፋብሪካ (Brand)" : "Brand / Manufacturer"}
                      </Label>
                      <Input
                        value={item.brand}
                        onChange={(e) => updateItem(item.id, { brand: e.target.value })}
                        placeholder="e.g. Dangote, Derba, Kadisco"
                        className="text-xs h-8"
                        list={`brands-list-${item.id}`}
                      />
                      <datalist id={`brands-list-${item.id}`}>
                        {POPULAR_BRANDS.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    {/* 7. Description */}
                    <div className="lg:col-span-6 space-y-1">
                      <Label className="text-[11px] font-semibold">
                        {locale === "am" ? "መግለጫ (Description)" : "Description / Details"}
                      </Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder={
                          locale === "am"
                            ? "ምሳሌ፡ አዲስ የፋብሪካ ምርት፣ OPC 42.5R ደረጃ"
                            : "e.g. Grade 42.5R, factory fresh batch in standard packaging"
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* 8. Image URL / Custom Visual */}
                    <div className="lg:col-span-12 pt-1 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.title || "Preview"}
                            className="h-8 w-8 rounded object-cover border border-border"
                          />
                        ) : categoryMatch?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={categoryMatch.imageUrl}
                            alt="Category icon"
                            className="h-8 w-8 rounded object-cover border border-border opacity-60"
                            title="Category fallback visual"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                            <Package className="h-4 w-4" />
                          </div>
                        )}

                        <div className="text-[11px] text-muted-foreground">
                          {item.imageUrl ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {locale === "am" ? "ፎቶ ተያይዟል" : "Custom image attached"}
                            </span>
                          ) : (
                            <span>
                              {locale === "am"
                                ? "ፎቶ ካልተመረጠ የምድቡ መደበኛ ምስል ይታያል"
                                : "Default category visual will be displayed if no image uploaded"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full sm:w-auto">
                        <Input
                          placeholder={locale === "am" ? "የምስል አድራሻ (Image URL) አማራጭ..." : "Image URL (optional)..."}
                          value={item.imageUrl}
                          onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                          className="text-[11px] h-7 w-full sm:w-64"
                        />
                      </div>
                    </div>
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
                ? "+ ተጨማሪ እቃ ጨምር (Add another item)"
                : "+ Add another item"}
            </span>
          </Button>
        </div>

        {/* Batch Submission Bar */}
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
                    <span>{locale === "am" ? "እየተመዘገበ ነው..." : "Publishing Batch..."}</span>
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
    </div>
  );
}
