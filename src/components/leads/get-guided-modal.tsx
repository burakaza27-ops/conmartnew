// =============================================================================
// ConMart — "Get Guided / Request a Visit" Modal
// =============================================================================
// Allows any buyer (registered or anonymous) to request a local Commission Agent
// to assist with finding materials, inspecting depot yards, or negotiating.
// Also displays ConMart's official system contacts: 0911122226 / 0961622226.
// =============================================================================

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { submitGuidedLeadAction } from "@/app/actions/leads";
import { SYSTEM_CONTACTS } from "@/lib/config/system-contacts";
import { useLanguage } from "@/lib/i18n/language-context";

interface GetGuidedModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillMaterial?: string;
  targetSellerId?: string;
  targetSellerName?: string;
}

export function GetGuidedModal({
  isOpen,
  onClose,
  prefillMaterial = "",
  targetSellerId,
  targetSellerName,
}: GetGuidedModalProps) {
  const { locale } = useLanguage();
  const [materialNeeded, setMaterialNeeded] = useState(prefillMaterial);
  const [quantity, setQuantity] = useState("");
  const [areaLocation, setAreaLocation] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [preferredVisitTime, setPreferredVisitTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    referenceCode: string;
    estimatedResponseTime: string;
  } | null>(null);

  // Sync prefill if prop changes
  React.useEffect(() => {
    if (prefillMaterial && !materialNeeded) {
      setMaterialNeeded(prefillMaterial);
    }
  }, [prefillMaterial, materialNeeded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!materialNeeded.trim()) {
      setError(locale === "am" ? "እባክዎ የሚፈልጉትን ዕቃ ይጥቀሱ" : "Please enter the material needed");
      return;
    }
    if (!quantity.trim()) {
      setError(locale === "am" ? "እባክዎ መጠኑን ይጥቀሱ" : "Please specify quantity or scale");
      return;
    }
    if (!areaLocation.trim()) {
      setError(locale === "am" ? "እባክዎ የፕሮጀክቱን አድራሻ ይጥቀሱ" : "Please specify project / delivery location");
      return;
    }
    if (!buyerPhone.trim()) {
      setError(locale === "am" ? "ስልክ ቁጥር ያስፈልጋል" : "Phone number is required");
      return;
    }

    setLoading(true);
    try {
      const res = await submitGuidedLeadAction({
        materialNeeded,
        quantity,
        areaLocation,
        buyerPhone,
        buyerName: buyerName.trim() || undefined,
        preferredVisitTime: preferredVisitTime.trim() || undefined,
        notes: notes.trim() || undefined,
        targetSellerId: targetSellerId || undefined,
      });

      if (!res.success) {
        setError(res.error);
      } else {
        setResult({
          referenceCode: res.data.referenceCode,
          estimatedResponseTime: res.data.estimatedResponseTime,
        });
      }
    } catch {
      setError("An unexpected error occurred. Please try again or call our hotline.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleResetAndClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border border-border shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-amber-600/10 via-primary/10 to-amber-500/5 p-6 border-b border-border/60">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-600 text-white font-semibold text-xs gap-1">
              <UserCheck className="h-3 w-3" />
              {locale === "am" ? "ነፃ የመስክ አስተባባሪ" : "Free Agent Guide"}
            </Badge>
            {targetSellerName && (
              <Badge variant="outline" className="text-xs">
                {targetSellerName}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {locale === "am"
              ? "የኮንማርት የመስክ ወኪል ድጋፍ ይጠይቁ"
              : "Request a ConMart Agent Visit"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {locale === "am"
              ? "በአካባቢዎ የሚገኝ ህጋዊ የኮንማርት ወኪል ዋጋዎችን እንዲያነጻጽሩ፣ መጋዘኖችን እንዲጎበኙ እና ትዕዛዝዎን እንዲያቀላጥፉ ያግዝዎታል። ለገዢዎች ፍጹም ነፃ ነው!"
              : "A verified local commission agent will assist you with verified pricing, depot yard visits, and order coordination — 100% free for buyers."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="p-6 space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                {locale === "am" ? "ጥያቄዎ በተሳካ ሁኔታ ደርሷል!" : "Agent Request Received!"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {locale === "am"
                  ? "የአካባቢዎ ወኪል በቅርቡ ይደውልልዎታል። ማጣቀሻ ኮድዎን ይያዙ:"
                  : "A dedicated local agent has been notified and will call you shortly. Your reference code:"}
              </p>
              <div className="font-mono text-xl font-black text-primary tracking-wider py-1">
                {result.referenceCode}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>{result.estimatedResponseTime}</span>
              </div>
            </div>

            {/* Direct hotline contact reminder */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-xs text-left space-y-2">
              <p className="font-semibold text-foreground">
                {locale === "am" ? "አስቸኳይ ከሆነ በቀጥታ ይደውሉልን:" : "Need instant phone assistance?"}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`tel:${SYSTEM_CONTACTS.primaryPhone}`}
                  className="flex items-center gap-1.5 font-mono font-bold text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {SYSTEM_CONTACTS.primaryPhone}
                </a>
                <a
                  href={`tel:${SYSTEM_CONTACTS.secondaryPhone}`}
                  className="flex items-center gap-1.5 font-mono font-bold text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {SYSTEM_CONTACTS.secondaryPhone}
                </a>
              </div>
            </div>

            <Button onClick={handleResetAndClose} className="w-full">
              {locale === "am" ? "ጨርስ" : "Done"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="materialNeeded" className="text-xs font-semibold flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  {locale === "am" ? "የሚፈለገው ዕቃ *" : "Material Needed *"}
                </Label>
                <Input
                  id="materialNeeded"
                  value={materialNeeded}
                  onChange={(e) => setMaterialNeeded(e.target.value)}
                  placeholder="e.g. Dangote 42.5R Cement, Rebar 16mm"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs font-semibold">
                  {locale === "am" ? "የዕቃው መጠን *" : "Quantity / Scale *"}
                </Label>
                <Input
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 200 Quintals, 10 Tons"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="areaLocation" className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {locale === "am" ? "የፕሮጀክት/ማራገፊያ ቦታ *" : "Project Location / Site *"}
                </Label>
                <Input
                  id="areaLocation"
                  value={areaLocation}
                  onChange={(e) => setAreaLocation(e.target.value)}
                  placeholder="e.g. Bole Bulbula, CMC, Hawassa"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="buyerPhone" className="text-xs font-semibold flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {locale === "am" ? "ስልክ ቁጥርዎ *" : "Your Phone Number *"}
                </Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="0911 234 567 or 07..."
                  className="text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="buyerName" className="text-xs font-medium text-muted-foreground">
                  {locale === "am" ? "ስምዎ (አማራጭ)" : "Your Name (Optional)"}
                </Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Abebe Kebede"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredVisitTime" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {locale === "am" ? "የሚመችዎት ሰዓት (አማራጭ)" : "Preferred Visit Time"}
                </Label>
                <Input
                  id="preferredVisitTime"
                  value={preferredVisitTime}
                  onChange={(e) => setPreferredVisitTime(e.target.value)}
                  placeholder="e.g. Today 2:00 PM or Tomorrow morning"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">
                {locale === "am" ? "ተጨማሪ ማስታወሻ ወይም ዝርዝር" : "Additional Notes or Specific Requirements"}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any brand preference, transport requirements, or payment terms..."
                className="text-xs min-h-[60px]"
              />
            </div>

            {/* Direct hotline callouts */}
            <div className="rounded-lg bg-muted/40 p-3 border border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>{locale === "am" ? "የኮንማርት ዋና ስልክ:" : "ConMart Help Hotline:"}</span>
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${SYSTEM_CONTACTS.primaryPhone}`}
                  className="font-mono font-bold text-foreground hover:text-primary flex items-center gap-1"
                >
                  <Phone className="h-3 w-3 text-primary" />
                  {SYSTEM_CONTACTS.primaryPhone}
                </a>
                <span>•</span>
                <a
                  href={`tel:${SYSTEM_CONTACTS.secondaryPhone}`}
                  className="font-mono font-bold text-foreground hover:text-primary flex items-center gap-1"
                >
                  <Phone className="h-3 w-3 text-primary" />
                  {SYSTEM_CONTACTS.secondaryPhone}
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleResetAndClose} disabled={loading}>
                {locale === "am" ? "ሰርዝ" : "Cancel"}
              </Button>
              <Button type="submit" disabled={loading} className="gap-2 font-semibold">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {locale === "am" ? "ወኪል ይጠይቁ (ነፃ)" : "Request Agent Guide (Free)"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
