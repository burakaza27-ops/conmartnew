"use client";

// =============================================================================
// ConMart — Seller New Listing Form (Interactive)
// =============================================================================
// Full-featured material creation with drag-and-drop image upload,
// technical specifications, warehouse yard location, and volume pricing tiers.
// =============================================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  MapPin,
  Building2,
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/image-uploader";
import { createSellerListing, type CreatePriceTierInput } from "@/app/actions/listings";
import { ProductUnit } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getLocalizedUnit,
  getLocalizedLocation,
  formatPrice,
} from "@/lib/i18n/translations";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface CuratedProductOption {
  id: string;
  categoryId: string;
  title: string;
  unit: ProductUnit;
  imageUrl: string | null;
  specs: Record<string, string>;
}

interface NewListingFormProps {
  categories: CategoryOption[];
  curatedProducts?: CuratedProductOption[];
  sellerCompanyName: string;
}

export function NewListingForm({
  categories,
  curatedProducts = [],
  sellerCompanyName,
}: NewListingFormProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState<string>("custom");
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState<ProductUnit>(ProductUnit.QUINTAL);
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("Addis Ababa, Kaliti Industrial Zone");

  // Technical Specs
  const [brand, setBrand] = useState("");
  const [grade, setGrade] = useState("");
  const [standard, setStandard] = useState("");
  const [origin, setOrigin] = useState("");

  // Price Tiers
  const [priceTiers, setPriceTiers] = useState<CreatePriceTierInput[]>([
    { minQty: 10, maxQty: 99, unitPrice: 550, validDays: 180 },
    { minQty: 100, maxQty: 499, unitPrice: 520, validDays: 180 },
  ]);

  const handleAddTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier ? lastTier.maxQty + 1 : 10;
    const newMax = newMin * 5;
    const suggestedPrice = lastTier ? Math.max(1, lastTier.unitPrice * 0.95) : 500;

    setPriceTiers([
      ...priceTiers,
      { minQty: newMin, maxQty: newMax, unitPrice: Math.round(suggestedPrice), validDays: 180 },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (priceTiers.length <= 1) return;
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (
    index: number,
    field: keyof CreatePriceTierInput,
    value: number
  ) => {
    const updated = [...priceTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPriceTiers(updated);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please provide a material title.");
      return;
    }

    if (!location.trim()) {
      setErrorMessage("Please provide your yard or warehouse location.");
      return;
    }

    if (priceTiers.length === 0) {
      setErrorMessage("Please configure at least one volume pricing tier.");
      return;
    }

    setIsSubmitting(true);

    try {
      const specs: Record<string, string> = {};
      if (brand.trim()) specs.brand = brand.trim();
      if (grade.trim()) specs.grade = grade.trim();
      if (standard.trim()) specs.standard = standard.trim();
      if (origin.trim()) specs.origin = origin.trim();

      const result = await createSellerListing({
        categoryId,
        title: title.trim(),
        unit,
        specs,
        location: location.trim(),
        imageUrl: imageUrl || selectedCategory?.imageUrl || undefined,
        existingProductId: selectedProductId !== "custom" ? selectedProductId : undefined,
        priceTiers,
      });

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push("/seller/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Failed to submit material listing. Please try again.");
      setIsSubmitting(false);
    }
  };

  const lowestPrice = priceTiers.reduce(
    (min, t) => (t.unitPrice < min ? t.unitPrice : min),
    priceTiers[0]?.unitPrice || 0
  );

  return (
    <div className="space-y-6">
      <Link
        href="/seller/dashboard"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("seller_form_back")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("seller_form_create_title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("seller_form_create_subtitle")}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
        {categories.length === 0 && (
          <div className="lg:col-span-5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            Material categories have not loaded yet. Refresh this page once. If
            they still do not appear, ask an administrator to open the command
            center so the catalog can be created.
          </div>
        )}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span>1. {t("seller_form_basic_info")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold">
                  {t("seller_form_category_label")} *
                </Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategoryId(newCat);
                    setSelectedProductId("custom");
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCategoryTitle(c.slug, c.name, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    {t("seller_form_curated_product")} *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {t("seller_form_curated_desc")}
                  </span>
                </div>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProductId(val);
                    if (val !== "custom") {
                      const match = curatedProducts.find((p) => p.id === val);
                      if (match) {
                        setTitle(match.title);
                        setUnit(match.unit);
                        if (match.imageUrl) setImageUrl(match.imageUrl);
                        if (match.specs.brand) setBrand(match.specs.brand);
                        if (match.specs.grade) setGrade(match.specs.grade);
                        if (match.specs.standard) setStandard(match.specs.standard);
                      }
                    }
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {curatedProducts.filter((p) => p.categoryId === categoryId).length > 0 && (
                    <optgroup label={t("seller_form_select_standard")}>
                      {curatedProducts
                        .filter((p) => p.categoryId === categoryId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({getLocalizedUnit(p.unit, locale)})
                          </option>
                        ))}
                    </optgroup>
                  )}
                  <optgroup label={t("seller_form_custom_spec")}>
                    <option value="custom">
                      {t("seller_form_custom_spec")}
                    </option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  {t("seller_form_title_label")} *
                </Label>
                <Input
                  id="title"
                  placeholder={t("seller_form_title_placeholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit" className="text-xs font-semibold">
                  {t("seller_form_unit_label")} *
                </Label>
                <select
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ProductUnit)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={ProductUnit.QUINTAL}>{getLocalizedUnit(ProductUnit.QUINTAL, locale)} (100 kg)</option>
                  <option value={ProductUnit.BAG}>{getLocalizedUnit(ProductUnit.BAG, locale)} (50 kg)</option>
                  <option value={ProductUnit.TON}>{getLocalizedUnit(ProductUnit.TON, locale)} (1,000 kg)</option>
                  <option value={ProductUnit.PIECE}>{getLocalizedUnit(ProductUnit.PIECE, locale)}</option>
                  <option value={ProductUnit.M3}>{getLocalizedUnit(ProductUnit.M3, locale)}</option>
                </select>
              </div>

              <div className="pt-2 border-t border-border/40">
                <p className="text-xs font-semibold text-foreground mb-2.5">
                  {t("seller_form_specs_title")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("seller_form_spec_brand")}</Label>
                    <Input
                      placeholder="e.g. Dangote, Mugher, Zuquala"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("seller_form_spec_grade")}</Label>
                    <Input
                      placeholder="e.g. 42.5R, Grade 60, Class A"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("seller_form_spec_standard")}</Label>
                    <Input
                      placeholder="e.g. ES 1177-1, ASTM A615"
                      value={standard}
                      onChange={(e) => setStandard(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("seller_form_spec_origin")}</Label>
                    <Input
                      placeholder="e.g. Mugher Factory, Kaliti Yard"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>2. {t("uploader_quick_presets")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                {t("uploader_ready")}
              </p>
              <ImageUploader
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
              />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>3. {t("seller_form_location_label")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold">
                  {t("seller_form_location_label")} *
                </Label>
                <Input
                  id="location"
                  placeholder={t("seller_form_location_placeholder")}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span>4. {t("seller_form_tiers_title")}</span>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTier}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                {t("seller_form_add_tier")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <p className="text-xs text-muted-foreground">
                {t("seller_form_tiers_desc")}
              </p>

              <div className="space-y-2.5">
                {priceTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-xs"
                  >
                    <span className="w-14 font-semibold text-muted-foreground text-[11px]">
                      {t("seller_form_tier_num").replace("{num}", String(idx + 1))}
                    </span>

                    <div className="flex-1 min-w-[90px]">
                      <Label className="text-[10px] text-muted-foreground">{t("seller_form_min_qty")}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={tier.minQty}
                        onChange={(e) =>
                          handleTierChange(idx, "minQty", parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-xs font-semibold"
                      />
                    </div>

                    <span className="text-muted-foreground mt-3">—</span>

                    <div className="flex-1 min-w-[90px]">
                      <Label className="text-[10px] text-muted-foreground">{t("seller_form_max_qty")}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={tier.maxQty}
                        onChange={(e) =>
                          handleTierChange(idx, "maxQty", parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-xs font-semibold"
                      />
                    </div>

                    <div className="flex-1 min-w-[110px]">
                      <Label className="text-[10px] text-muted-foreground">{t("seller_form_unit_price")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={tier.unitPrice}
                        onChange={(e) =>
                          handleTierChange(idx, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-xs font-bold text-primary"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTier(idx)}
                      disabled={priceTiers.length <= 1}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive mt-3"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/seller/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
            >
              {t("btn_cancel")}
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 gap-2 text-xs font-bold px-6 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("seller_form_submitting_btn")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t("seller_form_submit_btn")}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("seller_form_live_preview")}
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                {t("seller_form_live_preview_desc")}
              </p>
            </div>

            <Card className="overflow-hidden border-border bg-card shadow-lg">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    imageUrl ||
                    selectedCategory?.imageUrl ||
                    "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80"
                  }
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-[10px]">
                    {selectedCategory ? getCategoryTitle(selectedCategory.slug, selectedCategory.name, locale) : "Category"}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2.5">
                  <span className="inline-flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                    <Tag className="h-3 w-3 text-amber-400" />
                    {priceTiers.length} {t("catalog_volume_tiers")}
                  </span>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">
                    {title || (locale === "am" ? "የዕቃው ስም እዚህ ይታያል" : "Your Material Title Here")}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 text-primary" />
                    <span>{sellerCompanyName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{getLocalizedLocation(location || "Addis Ababa", locale)}</span>
                </div>

                <div className="border-t border-border/40 pt-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">{t("seller_form_starting_from")}</span>
                    <p className="text-base font-extrabold text-foreground font-mono">
                      {formatPrice(lowestPrice, locale)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        / {getLocalizedUnit(unit, locale)}
                      </span>
                    </p>
                  </div>
                  <span className={cn(buttonVariants({ size: "sm", variant: "default" }), "h-7 text-xs pointer-events-none")}>
                    {t("catalog_btn_proforma")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">{t("seller_form_pro_tip_title")}</p>
              <p>
                {t("seller_form_pro_tip_desc")}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
