"use client";

// =============================================================================
// Econ — Guest Site Wastage (Reusable) Photo Upload Modal
// =============================================================================
// Allows any site foreman, contractor, or individual to list leftover/scrap
// materials for sale by simply snapping or uploading a photo, without needing
// to register or log in first.
// The post enters an admin moderation queue before being published live.
// =============================================================================

import React, { useState } from "react";
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  User,
  Tag,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/image-uploader";
import { submitGuestWastageAction } from "@/app/actions/wastage";
import { STANDARD_LOCATION_ZONES } from "@/lib/data/location-zones";
import { useLanguage } from "@/lib/i18n/language-context";

interface GuestWastageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GuestWastageModal({
  isOpen,
  onClose,
  onSuccess,
}: GuestWastageModalProps) {
  const { locale } = useLanguage();

  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("PIECE");
  const [askingPrice, setAskingPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [locationZone, setLocationZone] = useState("jemo");
  const [customLandmark, setCustomLandmark] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);

  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setPhotos([]);
    setIsUploadingPhoto(false);
    setPhotoError(null);
    setTitle("");
    setQuantity("1");
    setUnit("PIECE");
    setAskingPrice("");
    setIsNegotiable(true);
    setCustomLandmark("");
    setContactName("");
    setContactPhone("");
    setDescription("");
    setErrorMessage(null);
    setSuccessReference(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoError(null);

    if (photos.length >= 4) {
      setPhotoError(
        locale === "am"
          ? "ከ4 ፎቶ በላይ ማያያዝ አይቻልም።"
          : "Maximum 4 photos allowed per post."
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError(
        locale === "am"
          ? "እባክዎ ትክክለኛ የፎቶ ፋይል (JPEG, PNG, WebP) ያያይዙ።"
          : "Please upload a valid image file (JPEG, PNG, WebP)."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(
        locale === "am"
          ? "የፎቶው መጠን ከ5MB መብለጥ የለበትም።"
          : "Photo size exceeds 5MB limit."
      );
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/wastage-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload photo.");
      }

      setPhotos((prev) => [...prev, data.url]);
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Failed to upload photo."
      );
    } finally {
      setIsUploadingPhoto(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (photos.length === 0) {
      setErrorMessage(
        locale === "am"
          ? "እባክዎ የዕቃውን ፎቶ በቀጥታ በካሜራ አንስተው ያያይዙ።"
          : "Please snap at least one live photo of the material with your camera."
      );
      return;
    }

    if (!title.trim()) {
      setErrorMessage(
        locale === "am"
          ? "እባክዎ የዕቃውን ዓይነት ወይም ስም ያስገቡ።"
          : "Please enter the material title or description."
      );
      return;
    }

    if (!contactPhone.trim()) {
      setErrorMessage(
        locale === "am"
          ? "እባክዎ ተገዢዎች እንዲያገኙዎት ስልክ ቁጥር ያስገቡ።"
          : "Please enter your contact phone number."
      );
      return;
    }

    setIsSubmitting(true);

    const selectedZone = STANDARD_LOCATION_ZONES.find((z) => z.id === locationZone);
    const fullLocation = selectedZone
      ? `${selectedZone.region}, ${selectedZone.name}${customLandmark ? ` (${customLandmark.trim()})` : ""}`
      : customLandmark || "Addis Ababa";

    const res = await submitGuestWastageAction({
      imageUrl: photos[0],
      imageUrls: photos,
      title: title.trim(),
      quantity: Number(quantity) || 1,
      unit,
      askingPrice: Number(askingPrice) || 0,
      isNegotiable,
      location: fullLocation,
      contactName: contactName.trim() || "Site Contact",
      contactPhone: contactPhone.trim(),
      description: description.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to submit post.");
      return;
    }

    setSuccessReference(res.data?.referenceCode || "WST-SUBMITTED");
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-primary/10 border-b border-primary/20 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Camera className="size-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {locale === "am"
                  ? "የሳይት ተረፈ ምርት ይሽጡ (መመዝገብ አያስፈልግም)"
                  : "Snap & Sell Site Wastage"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {locale === "am"
                  ? "ፎቶ ያንሱ፣ ዋጋና ስልክዎን ያስገቡ፤ አስተዳዳሪ ሲያረጋግጥ ለገዢዎች ይለጠፋል።"
                  : "Take a photo, enter price & phone. Listed freely upon admin review."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {successReference ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-foreground">
                  {locale === "am" ? "የተረፈ ምርት ፎቶዎ በተሳካ ሁኔታ ገብቷል!" : "Photo Submitted for Review!"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {locale === "am"
                    ? `የማጣቀሻ ቁጥርዎ ${successReference} ነው። የEcon አስተዳዳሪዎች ፎቶውንና መረጃውን ገምግመው ሲያጸድቁ ወዲያውኑ በገዢዎች ገጽ ላይ ይታያል።`
                    : `Your post #${successReference} is now in our admin moderation queue. Once approved, it will be listed live on the buyer's page.`}
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground max-w-sm mx-auto text-left space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  {locale === "am" ? "ቀጣይ እርምጃ" : "What happens next?"}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {locale === "am"
                    ? "ገዢዎች ፍላጎት ሲኖራቸው በቀጥታ በስልክዎ ይደውሉልዎታል። ምንም የመመዝገቢያ ወይም የኮሚሽን ክፍያ የለም።"
                    : "Interested contractors can contact you directly using your phone number. Zero registration fees."}
                </p>
              </div>

              <Button onClick={handleClose} className="w-full font-bold">
                {locale === "am" ? "ተረድቻለሁ (ዝጋ)" : "Done"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Photo Capture / Upload (Anti-Broker Camera First) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Camera className="size-3.5 text-primary" />
                    <span>
                      {locale === "am"
                        ? "1. የቀጥታ ሳይት ፎቶ (ካሜራ) *"
                        : "1. Live Site Photo (Camera Capture) *"}
                    </span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {photos.length}/4 {locale === "am" ? "ፎቶዎች" : "photos"}
                  </span>
                </div>

                {/* Hidden camera & file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoUpload(f);
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoUpload(f);
                  }}
                />

                {photoError && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{photoError}</span>
                  </div>
                )}

                {/* Snapped Photos Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {photos.map((url, idx) => (
                      <div
                        key={url}
                        className="relative aspect-square rounded-xl overflow-hidden border border-border/80 bg-muted group shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Wastage photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                          {idx === 0
                            ? locale === "am"
                              ? "ዋና ፎቶ"
                              : "Primary"
                            : `#${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity shadow-xs"
                          title="Remove photo"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add Another Angle Button */}
                    {photos.length < 4 && (
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => cameraInputRef.current?.click()}
                        className="aspect-square rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-1 text-primary transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : (
                          <>
                            <Camera className="size-5" />
                            <span className="text-[10px] font-bold">
                              {locale === "am" ? "+ ተጨማሪ አንግል" : "+ Add Angle"}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Primary Camera Capture Button when no photos yet */}
                {photos.length === 0 && (
                  <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-3">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-12 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-xs">
                        <Camera className="size-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">
                          {locale === "am"
                            ? "በቀጥታ ከሳይቱ በካሜራ ፎቶ ያንሱ"
                            : "Take Live Photo with Mobile Camera"}
                        </p>
                        <p className="text-[11px] text-muted-foreground max-w-xs">
                          {locale === "am"
                            ? "ደላሎች የድሮ ወይም የቴሌግራም ፎቶ እንዳይለጥፉ የቀጥታ ካሜራ ፎቶ ብቻ ይፈቀዳል።"
                            : "Anti-broker protection: Live camera photo required to verify actual site lot."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isUploadingPhoto}
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full sm:w-auto font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>{locale === "am" ? "በመጫን ላይ..." : "Uploading..."}</span>
                          </>
                        ) : (
                          <>
                            <Camera className="size-4" />
                            <span>
                              {locale === "am" ? "ካሜራ ክፈትና አንሳ" : "Snap Live Camera"}
                            </span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Upload className="size-3.5 mr-1" />
                        <span>{locale === "am" ? "ከፋይል ምረጥ" : "Select from files"}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Material Title */}
              <div className="space-y-1.5">
                <Label htmlFor="wst-title" className="text-xs font-semibold flex items-center gap-1.5">
                  <Package className="size-3.5 text-primary" />
                  <span>{locale === "am" ? "2. የዕቃው ስም / ዓይነት *" : "2. Material Title *"}</span>
                </Label>
                <Input
                  id="wst-title"
                  placeholder={
                    locale === "am"
                      ? "ምሳሌ፦ የተረፈ 12ሚሜ ፌሮ ብረት ቁራጭ፣ ያገለገለ የሳንቃ ፎርምዎርክ፣ 200 ብሎኬት"
                      : "e.g. Scrap 12mm Rebar Offcuts, Used Formwork Timber, 200 Surplus Blocks"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* 3. Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {locale === "am" ? "ግምታዊ መጠን" : "Estimated Quantity"}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {locale === "am" ? "መለኪያ" : "Unit"}
                  </Label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="PIECE">{locale === "am" ? "ፍሬ / ቁራጭ (Piece)" : "Pieces"}</option>
                    <option value="TON">{locale === "am" ? "ቶን (Ton)" : "Tons"}</option>
                    <option value="QUINTAL">{locale === "am" ? "ኩንታል (Quintal)" : "Quintals"}</option>
                    <option value="M3">{locale === "am" ? "ሜትር ኩብ (m³)" : "m³ (Cubic Meters)"}</option>
                    <option value="BAG">{locale === "am" ? "ከረጢት (Bag)" : "Bags"}</option>
                  </select>
                </div>
              </div>

              {/* 4. Asking Price & Negotiable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" />
                    <span>{locale === "am" ? "የመሸጫ ዋጋ (በብር)" : "Asking Price (ETB)"}</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000 (0 for open)"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-foreground">
                    <input
                      type="checkbox"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="size-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{locale === "am" ? "ዋጋው በድርድር ክፍት ነው" : "Price is Negotiable"}</span>
                  </label>
                </div>
              </div>

              {/* 5. Location / Sub-city (Mandatory Zone) */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{locale === "am" ? "የሳይቱ መገኛ ዞን / ክፍለ ከተማ *" : "Site Zone / Sub-City *"}</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {locale === "am" ? "ለትራንስፖርት ወጪ ንጽጽር" : "For transport comparison"}
                  </span>
                </div>

                <select
                  value={locationZone}
                  onChange={(e) => setLocationZone(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STANDARD_LOCATION_ZONES.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.subCity})
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-muted-foreground mr-1">
                    {locale === "am" ? "ፈጣን ምርጫ፦" : "Quick pick:"}
                  </span>
                  {[
                    { id: "jemo", label: "Jemo" },
                    { id: "tulu-dimtu", label: "Tulu Dimtu" },
                    { id: "urael", label: "Urael" },
                    { id: "kaliti", label: "Kaliti" },
                    { id: "bole-bulbula", label: "Bole" },
                    { id: "cmc-ayat", label: "CMC/Ayat" },
                  ].map((quick) => (
                    <button
                      key={quick.id}
                      type="button"
                      onClick={() => setLocationZone(quick.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                        locationZone === quick.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>

                <Input
                  placeholder={
                    locale === "am"
                      ? "አካባቢው ያለበት ልዩ ቦታ (ምሳሌ፦ ከቶታል ጀርባ፣ ሳይት 4)"
                      : "Optional landmark (e.g. Near Total, Site Gate 3)"
                  }
                  value={customLandmark}
                  onChange={(e) => setCustomLandmark(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              {/* 6. Contact Details (Phone & Name) */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" />
                  <span>{locale === "am" ? "የስልክና የእውቂያ መረጃ *" : "Your Contact Details *"}</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    placeholder={locale === "am" ? "የእውቂያ ሰው ስም (ፎርማን ዳዊት)" : "Name (e.g. Foreman Dawit)"}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <Input
                    type="tel"
                    placeholder="0911 234 567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  {locale === "am" ? "ሰርዝ" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{locale === "am" ? "በመላክ ላይ..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="size-3.5" />
                      <span>{locale === "am" ? "ተረፈ ምርት ለጥፍ (ነፃ)" : "Post Wastage Item (Free)"}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
