"use client";

// =============================================================================
// ConMart — Seller Edit Listing Form (Interactive)
// =============================================================================
// Allows suppliers to adjust wholesale unit prices, tier intervals,
// warehouse location, and batch photo for existing material offerings.
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
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/image-uploader";
import { updateSellerListing, type CreatePriceTierInput } from "@/app/actions/listings";
import type { ProductUnit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { getCategoryTitle, getLocalizedUnit } from "@/lib/i18n/translations";

interface ExistingTier {
  id: string;
  minQty: number;
  maxQty: number;
  unitPrice: number;
  validUntil: Date;
}

interface EditListingFormProps {
  listingId: string;
  initialTitle: string;
  initialLocation: string;
  initialImageUrl: string;
  categoryName: string;
  unit: ProductUnit;
  sellerCompanyName: string;
  initialTiers: ExistingTier[];
}

export function EditListingForm({
  listingId,
  initialTitle,
  initialLocation,
  initialImageUrl,
  categoryName,
  unit,
  sellerCompanyName,
  initialTiers,
}: EditListingFormProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(initialTitle);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [location, setLocation] = useState(initialLocation);

  // Price Tiers State
  const [priceTiers, setPriceTiers] = useState<CreatePriceTierInput[]>(
    initialTiers.length > 0
      ? initialTiers.map((t) => ({
          minQty: t.minQty,
          maxQty: t.maxQty,
          unitPrice: Number(t.unitPrice),
          validDays: 180,
        }))
      : [{ minQty: 10, maxQty: 100, unitPrice: 500, validDays: 180 }]
  );

  const handleAddTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier ? lastTier.maxQty + 1 : 10;
    const newMax = newMin * 5;
    const suggestedPrice = lastTier ? Math.max(1, lastTier.unitPrice * 0.95) : 500;

    setPriceTiers([
      ...priceTiers,
      {
        minQty: newMin,
        maxQty: newMax,
        unitPrice: Math.round(suggestedPrice),
        validDays: 180,
      },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (!title.trim() || title.trim().length < 3) {
        throw new Error("Please enter a valid material title.");
      }

      if (!location.trim()) {
        throw new Error("Please enter your warehouse/yard location.");
      }

      if (priceTiers.length === 0) {
        throw new Error("At least one price tier is required.");
      }

      // Check for overlapping tiers
      const sorted = [...priceTiers].sort((a, b) => a.minQty - b.minQty);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].minQty <= sorted[i - 1].maxQty) {
          throw new Error(
            `Price tiers overlap: [${sorted[i - 1].minQty}–${sorted[i - 1].maxQty}] and [${sorted[i].minQty}–${sorted[i].maxQty}]. Ensure distinct intervals.`
          );
        }
      }

      const res = await updateSellerListing({
        listingId,
        title: title.trim(),
        location: location.trim(),
        imageUrl: imageUrl || undefined,
        priceTiers: sorted,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      setSuccessMessage("Listing prices & information successfully updated!");
      setTimeout(() => {
        router.push("/seller/dashboard");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-5">
        <div>
          <Link
            href="/seller/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 -ml-2 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("seller_form_back")}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("seller_form_edit_title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("seller_form_edit_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium">
            {getCategoryTitle(categoryName.toLowerCase(), categoryName, locale)}
          </Badge>
          <Badge variant="secondary" className="text-xs font-semibold">
            {getLocalizedUnit(unit, locale)}
          </Badge>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 shadow-xs">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Basic Information */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {t("seller_form_basic_info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">
                {t("seller_form_title_label")}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("seller_form_title_placeholder")}
                className="h-10 text-sm"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {t("seller_form_location_label")}
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("seller_form_location_placeholder")}
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  {locale === "am" ? "የአቅራቢ መጋዘን ስም" : "Supplier Depot Name"}
                </Label>
                <Input
                  value={sellerCompanyName}
                  disabled
                  className="h-10 text-sm bg-muted/40 cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Material Photo */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">
              {t("seller_form_image_label", "Material Photo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
            />
          </CardContent>
        </Card>

        {/* Card 3: Dynamic Volume Pricing Tiers */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold">
                {t("seller_form_tiers_title")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("seller_form_tiers_desc")}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTier}
              className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("seller_form_add_tier")}
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            {priceTiers.map((tier, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-all"
              >
                <Badge variant="secondary" className="text-[11px] font-bold shrink-0">
                  {t("seller_form_tier_num").replace("{num}", String(idx + 1))}
                </Badge>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 w-full">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                      {t("seller_form_min_qty")} ({getLocalizedUnit(unit, locale)})
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={tier.minQty}
                      onChange={(e) =>
                        handleTierChange(idx, "minQty", parseInt(e.target.value) || 0)
                      }
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                      {t("seller_form_max_qty")} ({getLocalizedUnit(unit, locale)})
                    </Label>
                    <Input
                      type="number"
                      min={tier.minQty}
                      value={tier.maxQty}
                      onChange={(e) =>
                        handleTierChange(idx, "maxQty", parseInt(e.target.value) || 0)
                      }
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                      {t("seller_form_unit_price")} (ETB / {getLocalizedUnit(unit, locale)})
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      step="any"
                      value={tier.unitPrice}
                      onChange={(e) =>
                        handleTierChange(idx, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      className="h-9 text-xs font-bold font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={priceTiers.length <= 1}
                    onClick={() => handleRemoveTier(idx)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remove Tier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/seller/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "text-xs font-semibold h-10 px-4")}
          >
            {t("btn_cancel")}
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 gap-2 text-xs font-bold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "am" ? "በማሻሻል ላይ..." : "Updating Listing..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {locale === "am" ? "ለውጦችን መዝግብ" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
