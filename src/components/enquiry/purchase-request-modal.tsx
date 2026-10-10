// =============================================================================
// ConMart — Buyer Purchase Request Modal Component
// =============================================================================
// Enables contractors/buyers to submit structured purchase enquiries
// directly to verified suppliers with zero contact leakage until unlocked.
// =============================================================================

"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Truck,
  AlertCircle,
  CheckCircle2,
  X,
  SendHorizontal,
  HardHat,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatPrice, getLocalizedUnit } from "@/lib/i18n/translations";
import { submitPurchaseEnquiryAction } from "@/app/actions/enquiries";
import { DeliveryPreference } from "@prisma/client";
import { cn } from "@/lib/utils";

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  productTitle: string;
  unit: string;
  basePrice?: number;
  onSuccess?: (enquiryId: string, refCode: string) => void;
}

const ADDIS_SUBCITIES = [
  "Bole Sub-City",
  "Kirkos Sub-City",
  "Yeka Sub-City",
  "Lideta Sub-City",
  "Nifas Silk-Lafto Sub-City",
  "Akaki-Kaliti Sub-City",
  "Kolfe Keranio Sub-City",
  "Gullele Sub-City",
  "Arada Sub-City",
  "Addis Ketema Sub-City",
  "Dukem / Gelan (Oromia Special Zone)",
  "Sebeta / Burayu",
  "Adama (Nazret) Corridor",
  "Other Ethiopian Destination",
];

export function PurchaseRequestModal({
  isOpen,
  onClose,
  listingId,
  productTitle,
  unit,
  basePrice,
  onSuccess,
}: PurchaseRequestModalProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [qty, setQty] = useState("50");
  const [deliveryPref, setDeliveryPref] = useState<DeliveryPreference>(
    DeliveryPreference.SELLER_DELIVERED
  );
  const [subcity, setSubcity] = useState(ADDIS_SUBCITIES[0]);
  const [exactAddress, setExactAddress] = useState("");
  const [vehicleAccess, setVehicleAccess] = useState("SINO_TRUCK");
  const [unloadRequired, setUnloadRequired] = useState(false);
  const [paymentMode, setPaymentMode] = useState<
    "CASH" | "BANK_TRANSFER" | "CHEQUE" | "LETTER_OF_CREDIT"
  >("BANK_TRANSFER");
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setErrorMsg(null);

    const parsedQty = parseFloat(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMsg(locale === "am" ? "እባክዎ ትክክለኛ የትዕዛዝ መጠን ያስገቡ።" : "Please enter a valid order quantity.");
      return;
    }

    if (!exactAddress.trim()) {
      setErrorMsg(
        locale === "am"
          ? "እባክዎ በ" + subcity + " ውስጥ ያለዎትን የግንባታ ቦታ ወይም መለያ ቦታ ይግለጹ።"
          : "Please provide your site location or landmark in " + subcity + "."
      );
      return;
    }

    const vehicleLabels: Record<string, string> = {
      SINO_TRUCK: t("modal_vehicle_sino"),
      FSR_TRUCK: t("modal_vehicle_fsr"),
      ISUZU_NPR: t("modal_vehicle_npr"),
      TRAILER_LOWBED: t("modal_vehicle_trailer"),
      PICKUP: t("modal_vehicle_pickup"),
    };

    const fullAddress = `${subcity} — ${exactAddress.trim()}`;
    const constraintsText = [
      `Vehicle Access: ${vehicleLabels[vehicleAccess] || vehicleAccess}`,
      unloadRequired
        ? locale === "am" ? "በቦታው ላይ የጉልበት ማውረድ ያስፈልጋል።" : "Labor unloading required on-site."
        : locale === "am" ? "ማውረድ በተቋራጩ ይከናወናል።" : "Offloading handled by contractor.",
      notes.trim() ? `Notes: ${notes.trim()}` : "",
      `Payment Mode: ${paymentMode}`,
    ]
      .filter(Boolean)
      .join(" | ");

    startTransition(async () => {
      const res = await submitPurchaseEnquiryAction({
        listingId,
        qty: parsedQty,
        deliveryPreference: deliveryPref,
        deliveryAddress: fullAddress,
        accessConstraints: constraintsText,
        requiredDate: requiredDate || undefined,
      });

      if (res.success) {
        setSuccessCode(res.data.referenceCode);
        if (onSuccess) {
          onSuccess(res.data.enquiryId, res.data.referenceCode);
        }
        setTimeout(() => {
          onClose();
          router.push("/buyer/enquiries");
        }, 2000);
      } else {
        setErrorMsg(res.error || (locale === "am" ? "ጥያቄውን መላክ አልተሳካም።" : "Failed to submit enquiry."));
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t("buyer_enquiry_modal_title")}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{productTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Security / Privacy Banner */}
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>{t("buyer_enquiry_modal_desc")}</span>
        </div>

        {successCode ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-foreground">
              {locale === "am" ? "የግዢ ጥያቄዎ በተሳካ ሁኔታ ተልኳል!" : "Purchase Request Submitted!"}
            </h4>
            <p className="text-xs text-muted-foreground font-mono">
              {locale === "am" ? "የማጣቀሻ ቁጥር፦" : "Reference Code:"} <span className="font-bold text-primary">{successCode}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("modal_redirecting")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Speed & Security Reassurance Banner */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <Zap className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block text-emerald-800 dark:text-emerald-300">
                  {locale === "am" ? "⚡ ፈጣን ምላሽ (15–30 ደቂቃ)" : "⚡ Fast Confirmation (15–30 mins)"}
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {locale === "am"
                    ? "አቅራቢው ክምችትና ትክክለኛ ዋጋ እንዳረጋገጠ የስልክ ቁጥርና የመጋዘን አድራሻ ወዲያውኑ ይገለጻል።"
                    : "Direct supplier phone & depot yard address unlock immediately upon request acceptance."}
                </p>
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="req-qty" className="text-xs font-semibold">
                    {t("buyer_enquiry_qty")} ({getLocalizedUnit(unit, locale)})
                  </Label>
                  <Input
                    id="req-qty"
                    type="number"
                    min="1"
                    step="any"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="font-mono text-sm font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t("modal_base_price_label")}
                  </Label>
                  <div className="flex h-9 w-full items-center rounded-md border bg-muted/40 px-3 text-xs font-mono font-semibold text-foreground">
                    {basePrice ? formatPrice(basePrice, locale) : t("modal_live_market_rate")}
                  </div>
                </div>
              </div>

              {/* Quick Quantity Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-muted-foreground mr-1">
                  {locale === "am" ? "ፈጣን ምርጫ፦" : "Quick:"}
                </span>
                {[50, 100, 250, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQty(String(preset))}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-mono border transition-all active:scale-95",
                      qty === String(preset)
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                    )}
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              {/* Live Subtotal Calculation */}
              {basePrice && parseFloat(qty) > 0 && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {locale === "am" ? "የዕቃ ግምታዊ ድምር፦" : "Estimated Material Subtotal:"}
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {formatPrice(parseFloat(qty) * basePrice, locale)}
                  </span>
                </div>
              )}
            </div>

            {/* Delivery Option Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("buyer_enquiry_delivery_pref")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryPref(DeliveryPreference.SELLER_DELIVERED)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-xs transition-all ${
                    deliveryPref === DeliveryPreference.SELLER_DELIVERED
                      ? "border-primary bg-primary/5 ring-1 ring-primary font-medium text-foreground"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Truck className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-bold text-foreground">{t("modal_site_delivered_title")}</div>
                    <div className="text-[11px] text-muted-foreground">{t("modal_site_delivered_desc")}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryPref(DeliveryPreference.SELF_COLLECT)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-xs transition-all ${
                    deliveryPref === DeliveryPreference.SELF_COLLECT
                      ? "border-primary bg-primary/5 ring-1 ring-primary font-medium text-foreground"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <HardHat className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-bold text-foreground">{t("modal_ex_works_title")}</div>
                    <div className="text-[11px] text-muted-foreground">{t("modal_ex_works_desc")}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Destination Sub-City */}
            <div className="space-y-1.5">
              <Label htmlFor="req-subcity" className="text-xs font-semibold">
                {t("buyer_enquiry_subcity")}
              </Label>
              <select
                id="req-subcity"
                value={subcity}
                onChange={(e) => setSubcity(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ADDIS_SUBCITIES.map((city) => (
                  <option key={city} value={city} className="bg-card text-foreground">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Access Constraints (Addis Ababa Road Feasibility) */}
            <div className="space-y-1.5">
              <Label htmlFor="req-vehicle" className="text-xs font-semibold">
                {t("modal_vehicle_access_label")}
              </Label>
              <select
                id="req-vehicle"
                value={vehicleAccess}
                onChange={(e) => setVehicleAccess(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="SINO_TRUCK" className="bg-card text-foreground">
                  {t("modal_vehicle_sino")}
                </option>
                <option value="FSR_TRUCK" className="bg-card text-foreground">
                  {t("modal_vehicle_fsr")}
                </option>
                <option value="ISUZU_NPR" className="bg-card text-foreground">
                  {t("modal_vehicle_npr")}
                </option>
                <option value="TRAILER_LOWBED" className="bg-card text-foreground">
                  {t("modal_vehicle_trailer")}
                </option>
                <option value="PICKUP" className="bg-card text-foreground">
                  {t("modal_vehicle_pickup")}
                </option>
              </select>
            </div>

            {/* Exact Site Address / Landmark */}
            <div className="space-y-1.5">
              <Label htmlFor="req-address" className="text-xs font-semibold">
                {t("buyer_enquiry_address")}
              </Label>
              <Input
                id="req-address"
                placeholder={t("modal_address_placeholder")}
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            {/* Unloading Labor Toggle */}
            <div className="flex items-center gap-2.5 rounded-lg border p-3 bg-muted/20">
              <input
                id="unload-check"
                type="checkbox"
                checked={unloadRequired}
                onChange={(e) => setUnloadRequired(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="unload-check" className="text-xs cursor-pointer text-foreground">
                {t("buyer_enquiry_unload_yes")}
              </Label>
            </div>

            {/* Payment Mode & Desired Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="req-pay-mode" className="text-xs font-semibold">
                  {t("modal_payment_method_label")}
                </Label>
                <select
                  id="req-pay-mode"
                  value={paymentMode}
                  onChange={(e) =>
                    setPaymentMode(
                      e.target.value as "CASH" | "BANK_TRANSFER" | "CHEQUE" | "LETTER_OF_CREDIT"
                    )
                  }
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="BANK_TRANSFER" className="bg-card text-foreground">
                    {t("modal_payment_bank")}
                  </option>
                  <option value="CASH" className="bg-card text-foreground">
                    {t("modal_payment_cash")}
                  </option>
                  <option value="CHEQUE" className="bg-card text-foreground">
                    {t("modal_payment_cpo")}
                  </option>
                  <option value="LETTER_OF_CREDIT" className="bg-card text-foreground">
                    {t("modal_payment_lc")}
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-date" className="text-xs font-semibold">
                  {t("modal_required_date_label")}
                </Label>
                <Input
                  id="req-date"
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Special Notes & Specs */}
            <div className="space-y-1.5">
              <Label htmlFor="req-notes" className="text-xs font-semibold">
                {t("modal_notes_label")}
              </Label>
              <Textarea
                id="req-notes"
                placeholder={t("modal_notes_placeholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs resize-none h-16"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
              >
                {locale === "am" ? "ሰርዝ" : "Cancel"}
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="gap-2 font-semibold">
                <SendHorizontal className="h-4 w-4" />
                {isPending ? t("modal_submitting") : t("modal_submit_btn")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
