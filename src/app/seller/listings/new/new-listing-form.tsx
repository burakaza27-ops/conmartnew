"use client";

// =============================================================================
// ConMart — Seller New Listing Form (Interactive)
// =============================================================================
// Full-featured material creation with drag-and-drop image upload,
// technical specifications, warehouse yard location, and volume pricing tiers.
// Validation: react-hook-form + Zod (createListingSchema).
// =============================================================================

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useForm,
  useFieldArray,
  Controller,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Upload,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/image-uploader";
import {
  createSellerListing,
  type CreatePriceTierInput,
} from "@/app/actions/listings";
import { ProductUnit } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getLocalizedUnit,
  getLocalizedLocation,
  formatPrice,
  translateZodError,
} from "@/lib/i18n/translations";
import { getProductFallback } from "@/lib/data/category-images";
import {
  createListingSchema,
  type CreateListingFormData,
} from "@/lib/validations";
import { z } from "zod";

// Form input type (what RHF manages — pre-coercion)
type ListingFormInput = z.input<typeof createListingSchema>;

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

// Helper component to display a Zod field error, translated to current locale
function FieldError({ message, locale }: { message?: string; locale: "en" | "am" }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[11px] text-destructive font-medium flex items-center gap-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {translateZodError(message, locale)}
    </p>
  );
}

export function NewListingForm({
  categories,
  curatedProducts = [],
  sellerCompanyName,
}: NewListingFormProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormInput, unknown, CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      categoryId: categories[0]?.id || "",
      title: "",
      unit: ProductUnit.QUINTAL,
      imageUrl: "",
      location: "Addis Ababa, Kaliti Industrial Zone",
      brand: "",
      grade: "",
      standard: "",
      origin: "",
      existingProductId: "custom",
      priceTiers: [
        { minQty: 10, maxQty: 99, unitPrice: 550, validDays: 180 },
        { minQty: 100, maxQty: 499, unitPrice: 520, validDays: 180 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceTiers",
  });

  // Watched values for live preview
  const categoryId = watch("categoryId");
  const title = watch("title");
  const unit = watch("unit");
  const imageUrl = watch("imageUrl");
  const priceTiers = watch("priceTiers");

  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Apply a curated product's defaults when chosen
  const handleCuratedSelect = (productId: string) => {
    setValue("existingProductId", productId);
    if (productId !== "custom") {
      const match = curatedProducts.find((p) => p.id === productId);
      if (match) {
        setValue("title", match.title, { shouldValidate: true });
        setValue("unit", match.unit, { shouldValidate: true });
        if (match.imageUrl) setValue("imageUrl", match.imageUrl);
        if (match.specs.brand) setValue("brand", match.specs.brand);
        if (match.specs.grade) setValue("grade", match.specs.grade);
        if (match.specs.standard) setValue("standard", match.specs.standard);
      }
    }
  };

  const handleAddTier = () => {
    const last = priceTiers[priceTiers.length - 1];
    const newMin = last ? last.maxQty + 1 : 10;
    const newMax = newMin * 5;
    const suggestedPrice = last ? Math.max(1, Math.round(last.unitPrice * 0.95)) : 500;
    append({ minQty: newMin, maxQty: newMax, unitPrice: suggestedPrice, validDays: 180 });
  };

  const onSubmit: SubmitHandler<CreateListingFormData> = async (data) => {
    const specs: Record<string, string> = {};
    if (data.brand?.trim()) specs.brand = data.brand.trim();
    if (data.grade?.trim()) specs.grade = data.grade.trim();
    if (data.standard?.trim()) specs.standard = data.standard.trim();
    if (data.origin?.trim()) specs.origin = data.origin.trim();

    const tiers: CreatePriceTierInput[] = data.priceTiers.map((t) => ({
      minQty: t.minQty,
      maxQty: t.maxQty,
      unitPrice: t.unitPrice,
      validDays: t.validDays,
    }));

    const result = await createSellerListing({
      categoryId: data.categoryId,
      title: data.title.trim(),
      unit: data.unit,
      specs,
      location: data.location.trim(),
      imageUrl: data.imageUrl || selectedCategory?.imageUrl || undefined,
      existingProductId:
        data.existingProductId !== "custom" ? data.existingProductId : undefined,
      priceTiers: tiers,
    });

    if (result.error) {
      setError("root", { message: result.error });
      return;
    }

    router.push("/seller/dashboard");
    router.refresh();
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

      {errors.root?.message && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.root.message}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-8 lg:grid-cols-5"
      >
        {categories.length === 0 && (
          <div className="lg:col-span-5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            Material categories have not loaded yet. Refresh this page once. If
            they still do not appear, ask an administrator to open the command
            center so the catalog can be created.
          </div>
        )}

        <div className="lg:col-span-3 space-y-6">
          {/* ─── Basic Info ─── */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span>1. {t("seller_form_basic_info")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="categoryId" className="text-xs font-semibold">
                  {t("seller_form_category_label")} *
                </Label>
                <select
                  id="categoryId"
                  {...register("categoryId")}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCategoryTitle(c.slug, c.name, locale)}
                    </option>
                  ))}
                </select>
                <FieldError locale={locale} message={errors.categoryId?.message} />
              </div>

              {/* Curated product picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    {t("seller_form_curated_product")} *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {t("seller_form_curated_desc")}
                  </span>
                </div>
                <Controller
                  control={control}
                  name="existingProductId"
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => handleCuratedSelect(e.target.value)}
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
                        <option value="custom">{t("seller_form_custom_spec")}</option>
                      </optgroup>
                    </select>
                  )}
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  {t("seller_form_title_label")} *
                </Label>
                <Input
                  id="title"
                  placeholder={t("seller_form_title_placeholder")}
                  {...register("title")}
                  className={cn("h-9 text-xs", errors.title && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError locale={locale} message={errors.title?.message} />
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <Label htmlFor="unit" className="text-xs font-semibold">
                  {t("seller_form_unit_label")} *
                </Label>
                <select
                  id="unit"
                  {...register("unit")}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={ProductUnit.QUINTAL}>{getLocalizedUnit(ProductUnit.QUINTAL, locale)} (100 kg)</option>
                  <option value={ProductUnit.BAG}>{getLocalizedUnit(ProductUnit.BAG, locale)} (50 kg)</option>
                  <option value={ProductUnit.TON}>{getLocalizedUnit(ProductUnit.TON, locale)} (1,000 kg)</option>
                  <option value={ProductUnit.PIECE}>{getLocalizedUnit(ProductUnit.PIECE, locale)}</option>
                  <option value={ProductUnit.M3}>{getLocalizedUnit(ProductUnit.M3, locale)}</option>
                </select>
                <FieldError locale={locale} message={errors.unit?.message} />
              </div>

              {/* Technical Specs */}
              <div className="pt-2 border-t border-border/40">
                <p className="text-xs font-semibold text-foreground mb-2.5">
                  {t("seller_form_specs_title")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {t("seller_form_spec_brand")}
                    </Label>
                    <Input
                      placeholder="e.g. Dangote, Mugher, Zuquala"
                      {...register("brand")}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {t("seller_form_spec_grade")}
                    </Label>
                    <Input
                      placeholder="e.g. 42.5R, Grade 60, Class A"
                      {...register("grade")}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {t("seller_form_spec_standard")}
                    </Label>
                    <Input
                      placeholder="e.g. ES 1177-1, ASTM A615"
                      {...register("standard")}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {t("seller_form_spec_origin")}
                    </Label>
                    <Input
                      placeholder="e.g. Mugher Factory, Kaliti Yard"
                      {...register("origin")}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Image Upload ─── */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span>2. {t("seller_form_image_label", "Material Photo")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                {t(
                  "uploader_file_support",
                  "Upload high-res inventory photos of this material (up to 5MB, JPEG, PNG, or WebP)."
                )}
              </p>
              <Controller
                control={control}
                name="imageUrl"
                render={({ field }) => (
                  <ImageUploader value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
              <FieldError locale={locale} message={errors.imageUrl?.message} />
            </CardContent>
          </Card>

          {/* ─── Location ─── */}
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
                  {...register("location")}
                  className={cn("h-9 text-xs", errors.location && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError locale={locale} message={errors.location?.message} />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-medium text-muted-foreground mr-0.5">
                    {locale === "am" ? "የተለመዱ ዞኖች፦" : "Popular zones:"}
                  </span>
                  {[
                    "Kaliti Industrial Zone",
                    "Akaki Depot Yard",
                    "Gotera Warehouse",
                    "CMC / Ayat Corridor",
                    "Legetafo Depot",
                    "Sebeta Industrial Hub",
                  ].map((hub) => (
                    <button
                      key={hub}
                      type="button"
                      onClick={() =>
                        setValue("location", `Addis Ababa, ${hub}`, {
                          shouldValidate: true,
                        })
                      }
                      className="px-2 py-0.5 rounded-md text-[10px] border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                      {hub}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Price Tiers ─── */}
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
              {errors.priceTiers?.root?.message && (
                <FieldError locale={locale} message={errors.priceTiers.root.message} />
              )}
              {/* Array-level min error */}
              {typeof errors.priceTiers?.message === "string" && (
                <FieldError locale={locale} message={errors.priceTiers.message} />
              )}

              <div className="space-y-2.5">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex flex-wrap sm:flex-nowrap items-start gap-2 rounded-lg border border-border/60 bg-card p-3 text-xs"
                  >
                    <span className="w-14 font-semibold text-muted-foreground text-[11px] pt-5">
                      {t("seller_form_tier_num").replace("{num}", String(idx + 1))}
                    </span>

                    <div className="flex-1 min-w-[90px]">
                      <Label className="text-[10px] text-muted-foreground">
                        {t("seller_form_min_qty")}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`priceTiers.${idx}.minQty`, {
                          valueAsNumber: true,
                        })}
                        className="h-8 text-xs font-semibold"
                      />
                      <FieldError locale={locale} message={errors.priceTiers?.[idx]?.minQty?.message} />
                    </div>

                    <span className="text-muted-foreground mt-6">—</span>

                    <div className="flex-1 min-w-[90px]">
                      <Label className="text-[10px] text-muted-foreground">
                        {t("seller_form_max_qty")}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`priceTiers.${idx}.maxQty`, {
                          valueAsNumber: true,
                        })}
                        className="h-8 text-xs font-semibold"
                      />
                      <FieldError locale={locale} message={errors.priceTiers?.[idx]?.maxQty?.message} />
                    </div>

                    <div className="flex-1 min-w-[110px]">
                      <Label className="text-[10px] text-muted-foreground">
                        {t("seller_form_unit_price")}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register(`priceTiers.${idx}.unitPrice`, {
                          valueAsNumber: true,
                        })}
                        className="h-8 text-xs font-bold text-primary"
                      />
                      <FieldError locale={locale} message={errors.priceTiers?.[idx]?.unitPrice?.message} />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(idx)}
                      disabled={fields.length <= 1}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive mt-5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Submit ─── */}
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

        {/* ─── Live Preview Sidebar ─── */}
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
                    getProductFallback(selectedCategory?.slug)
                  }
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <Badge
                    variant="secondary"
                    className="backdrop-blur-md bg-background/80 text-[10px]"
                  >
                    {selectedCategory
                      ? getCategoryTitle(
                          selectedCategory.slug,
                          selectedCategory.name,
                          locale
                        )
                      : "Category"}
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
                    {title ||
                      (locale === "am"
                        ? "የዕቃው ስም እዚህ ይታያል"
                        : "Your Material Title Here")}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 text-primary" />
                    <span>{sellerCompanyName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">
                    {getLocalizedLocation(
                      watch("location") || "Addis Ababa",
                      locale
                    )}
                  </span>
                </div>

                <div className="border-t border-border/40 pt-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {t("seller_form_starting_from")}
                    </span>
                    <p className="text-base font-extrabold text-foreground font-mono">
                      {formatPrice(lowestPrice, locale)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        / {getLocalizedUnit(unit, locale)}
                      </span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      buttonVariants({ size: "sm", variant: "default" }),
                      "h-7 text-xs pointer-events-none"
                    )}
                  >
                    {t("catalog_btn_proforma")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                {t("seller_form_pro_tip_title")}
              </p>
              <p>{t("seller_form_pro_tip_desc")}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

