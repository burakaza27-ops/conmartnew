// =============================================================================
// ConMart — Supplier Contact & Telemetry Card
// =============================================================================
// Implements the two contact paths from the client brief:
// 1. Subscribed supplier:
//    - Visible direct Phone number (tel: click logs CALL_CLICK)
//    - WhatsApp deep link (click logs WHATSAPP_CLICK)
//    - Address & directions (click logs DIRECTIONS_CLICK)
//    - Working hours
// 2. Non-subscribed supplier:
//    - Direct contact hidden
//    - "Request an Agent Visit / Get Guided" button (opens modal)
//    - Direct hotline numbers: 0911122226 / 0961622226
// =============================================================================

"use client";

import React, { useState } from "react";
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  UserCheck,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { logLeadEventAction } from "@/app/actions/leads";
import { GetGuidedModal } from "./get-guided-modal";
import { SYSTEM_CONTACTS } from "@/lib/config/system-contacts";
import { useLanguage } from "@/lib/i18n/language-context";

interface SupplierContactCardProps {
  sellerId: string;
  sellerName: string;
  companyName: string;
  isSubscribed: boolean;
  subscriptionTier?: string | null;
  directPhone?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  workingHours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  listingId?: string;
  materialTitle?: string;
}

export function SupplierContactCard({
  sellerId,
  sellerName,
  companyName,
  isSubscribed,
  subscriptionTier,
  directPhone,
  whatsappNumber,
  address,
  workingHours,
  latitude,
  longitude,
  listingId,
  materialTitle,
}: SupplierContactCardProps) {
  const { locale } = useLanguage();
  const [isGuidedModalOpen, setIsGuidedModalOpen] = useState(false);

  // Clean phone number for WhatsApp wa.me link
  const rawPhone = whatsappNumber || directPhone || "";
  const cleanPhoneForWhatsApp = rawPhone.replace(/[^\d]/g, "");
  const waUrl = cleanPhoneForWhatsApp ? `https://wa.me/${cleanPhoneForWhatsApp}` : null;

  // Directions map link
  const mapsUrl =
    latitude && longitude
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : address
      ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
      : null;

  const handleCallClick = () => {
    // Non-blocking telemetry
    logLeadEventAction({
      sellerId,
      eventType: "CALL_CLICK",
      listingId,
    });
  };

  const handleWhatsAppClick = () => {
    logLeadEventAction({
      sellerId,
      eventType: "WHATSAPP_CLICK",
      listingId,
    });
  };

  const handleDirectionsClick = () => {
    logLeadEventAction({
      sellerId,
      eventType: "DIRECTIONS_CLICK",
      listingId,
    });
  };

  if (isSubscribed && (directPhone || whatsappNumber)) {
    return (
      <Card className="border-border/80 bg-card/60 backdrop-blur-xs shadow-xs overflow-hidden">
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>{locale === "am" ? "የተረጋገጠ አቅራቢ" : "Subscribed Verified Supplier"}</span>
          </div>
          {subscriptionTier && (
            <Badge variant="secondary" className="text-[10px] uppercase font-mono font-bold tracking-wider">
              {subscriptionTier}
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-3.5">
          <div>
            <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {companyName || sellerName}
            </h4>
            {address && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary shrink-0" />
                {address}
              </p>
            )}
            {workingHours && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                {workingHours}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {directPhone && (
              <a
                href={`tel:${directPhone.replace(/\s+/g, "")}`}
                onClick={handleCallClick}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{locale === "am" ? "በቀጥታ ይደውሉ" : "Call Supplier"}</span>
              </a>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDirectionsClick}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <MapPin className="h-3 w-3 text-primary" />
              <span>{locale === "am" ? "አድራሻ በካርታ ይመልከቱ" : "Get Directions / Map"}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-1" />
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  // Non-subscribed fallback path
  return (
    <>
      <Card className="border-border/80 bg-muted/30 shadow-xs overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              {companyName || sellerName || (locale === "am" ? "የኮንማርት አቅራቢ" : "ConMart Partner Depot")}
            </span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {locale === "am" ? "በወኪል የሚመራ" : "Agent Guided"}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {locale === "am"
              ? "የዚህ አቅራቢ ቀጥተኛ ስልክ አልተገናኘም። የኮንማርት የመስክ ወኪል ወደ ቦታው እንዲመራዎት ወይም በስልክ እንዲያስተናግድዎት መጠየቅ ይችላሉ።"
              : "Direct supplier contact is handled via our free agent team. Request a local visit or call our hotline directly."}
          </p>

          <Button
            onClick={() => setIsGuidedModalOpen(true)}
            variant="default"
            size="sm"
            className="w-full gap-2 font-bold shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            <UserCheck className="h-4 w-4" />
            <span>{locale === "am" ? "ወኪል እንዲጎበኝ ይጠይቁ (ነፃ)" : "Request an Agent Visit"}</span>
          </Button>

          <div className="rounded-lg bg-background p-2.5 border border-border/60 text-[11px] space-y-1">
            <div className="text-muted-foreground font-medium">
              {locale === "am" ? "ወይም በቀጥታ ይደውሉልን:" : "Or call ConMart directly:"}
            </div>
            <div className="flex items-center gap-3 font-mono font-bold text-foreground">
              <a href={`tel:${SYSTEM_CONTACTS.primaryPhone}`} className="hover:text-primary flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" />
                {SYSTEM_CONTACTS.primaryPhone}
              </a>
              <span>/</span>
              <a href={`tel:${SYSTEM_CONTACTS.secondaryPhone}`} className="hover:text-primary flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" />
                {SYSTEM_CONTACTS.secondaryPhone}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <GetGuidedModal
        isOpen={isGuidedModalOpen}
        onClose={() => setIsGuidedModalOpen(false)}
        prefillMaterial={materialTitle}
        targetSellerId={sellerId}
        targetSellerName={companyName}
      />
    </>
  );
}
