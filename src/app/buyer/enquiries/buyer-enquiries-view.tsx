"use client";

// =============================================================================
// ConMart — Buyer Enquiries Tracker Client Component
// =============================================================================
// Displays all purchase requests sent by the buyer to verified suppliers.
// - Masked before supplier accepts
// - Direct counterparty phone & depot unlocked once accepted
// - Interactive Dispute Filing modal for trade issues (shortages, defects)
// =============================================================================

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Phone,
  Building,
  MapPin,
  Truck,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedUnit } from "@/lib/i18n/translations";
import { raiseDisputeAction } from "@/app/actions/enquiries";
import { StartChatButton } from "@/components/chat/start-chat-button";
import { DisputeClaimType } from "@prisma/client";

export interface BuyerEnquiryItem {
  id: string;
  referenceCode: string;
  qty: number;
  unit: string;
  deliveryPreference: string;
  deliveryAddress: string;
  accessConstraints: string | null;
  status: string;
  createdAt: string;
  productTitle: string;
  categoryName: string;
  listingLocation: string;
  isUnlocked: boolean;
  sellerContact: {
    name?: string;
    companyName?: string | null;
    phone?: string;
  };
  unlockRecord: {
    unlockedAt: string;
    sellerReportedOutcome: string | null;
  } | null;
}

interface BuyerEnquiriesViewProps {
  initialEnquiries: BuyerEnquiryItem[];
}

export function BuyerEnquiriesView({ initialEnquiries }: BuyerEnquiriesViewProps) {
  const { t, locale } = useLanguage();
  const [enquiries, setEnquiries] = useState<BuyerEnquiryItem[]>(initialEnquiries);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "ACCEPTED" | "COMPLETED">("ALL");

  // Dispute Modal State
  const [disputeModalEnquiry, setDisputeModalEnquiry] = useState<BuyerEnquiryItem | null>(null);
  const [claimType, setClaimType] = useState<DisputeClaimType>(DisputeClaimType.SHORTAGE);
  const [disputeDescription, setDisputeDescription] = useState("");
  const [isDisputePending, startDisputeTransition] = useTransition();
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredEnquiries = enquiries.filter((e) => {
    if (activeTab === "PENDING") return e.status === "PENDING";
    if (activeTab === "ACCEPTED") return e.status === "ACCEPTED" || e.status === "DELIVERY_IN_PROGRESS";
    if (activeTab === "COMPLETED") return e.status === "COMPLETED" || e.status === "FAILED" || e.status === "DISPUTED";
    return true;
  });

  const pendingCount = enquiries.filter((e) => e.status === "PENDING").length;

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalEnquiry) return;

    if (!disputeDescription.trim()) {
      setStatusBanner({
        type: "error",
        text: locale === "am" ? "እባክዎ የአቤቱታውን ዝርዝር መግለጫ ያስገቡ።" : "Please provide a description of the issue.",
      });
      return;
    }

    setStatusBanner(null);
    startDisputeTransition(async () => {
      const res = await raiseDisputeAction({
        enquiryId: disputeModalEnquiry.id,
        claimType,
        description: disputeDescription.trim(),
      });

      if (res.success) {
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === disputeModalEnquiry.id ? { ...item, status: "DISPUTED" } : item
          )
        );
        setStatusBanner({
          type: "success",
          text:
            locale === "am"
              ? "አቤቱታው በተሳካ ሁኔታ ቀርቧል። የኮንማርት የኦፕሬሽን ቡድን አሸማጋይነት ጀምሯል።"
              : "Dispute submitted successfully. ConMart operations has initiated mediation.",
        });
        setDisputeModalEnquiry(null);
        setDisputeDescription("");
      } else {
        setStatusBanner({
          type: "error",
          text: res.error || (locale === "am" ? "አቤቱታ ማስገባት አልተሳካም።" : "Failed to lodge dispute."),
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-primary" />
            {t("buyer_enquiries_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("buyer_enquiries_subtitle")}
          </p>
        </div>

        <Link
          href="/buyer/category/all"
          className={cn(buttonVariants({ size: "sm" }), "gap-2 font-semibold shadow-2xs")}
        >
          <Plus className="h-4 w-4" />
          {locale === "am" ? "ዕቃዎችን ይመልከቱ" : "Browse Materials"}
        </Link>
      </div>

      {/* Status Notifications */}
      {statusBanner && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs font-medium border ${
            statusBanner.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {statusBanner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b pb-2">
        <Button
          size="sm"
          variant={activeTab === "ALL" ? "default" : "outline"}
          onClick={() => setActiveTab("ALL")}
          className="text-xs font-semibold h-8"
        >
          {t("enquiries_tab_all")} ({enquiries.length})
        </Button>
        <Button
          size="sm"
          variant={activeTab === "PENDING" ? "default" : "outline"}
          onClick={() => setActiveTab("PENDING")}
          className="text-xs font-semibold h-8 relative"
        >
          {t("enquiries_tab_pending")}
          {pendingCount > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
              {pendingCount}
            </span>
          )}
        </Button>
        <Button
          size="sm"
          variant={activeTab === "ACCEPTED" ? "default" : "outline"}
          onClick={() => setActiveTab("ACCEPTED")}
          className="text-xs font-semibold h-8"
        >
          {locale === "am" ? "የተከፈቱ አድራሻዎች" : "Unlocked Contacts"}
        </Button>
        <Button
          size="sm"
          variant={activeTab === "COMPLETED" ? "default" : "outline"}
          onClick={() => setActiveTab("COMPLETED")}
          className="text-xs font-semibold h-8"
        >
          {t("enquiries_tab_completed")}
        </Button>
      </div>

      {/* List of Enquiries */}
      {filteredEnquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-base font-bold text-foreground">
            {t("buyer_enquiries_empty_title")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("buyer_enquiries_empty_desc")}
          </p>
          <div className="mt-6">
            <Link
              href="/buyer/category/all"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5 font-bold shadow-xs")}
            >
              <Plus className="h-4 w-4" />
              {t("buyer_enquiries_empty_cta")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEnquiries.map((enq) => {
            const isPendingState = enq.status === "PENDING";
            const isAcceptedState = enq.status === "ACCEPTED" || enq.status === "DELIVERY_IN_PROGRESS";
            const isCompletedState = enq.status === "COMPLETED";
            const isDisputedState = enq.status === "DISPUTED";
            const isFailedState = enq.status === "FAILED";

            return (
              <Card
                key={enq.id}
                className={`overflow-hidden border transition-all ${
                  isAcceptedState
                    ? "border-emerald-500/40 bg-card shadow-xs"
                    : isDisputedState
                    ? "border-amber-500/40 bg-card shadow-xs"
                    : isPendingState
                    ? "border-border bg-card shadow-xs"
                    : "border-border bg-card/60"
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Line */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {enq.referenceCode}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <Badge variant="outline" className="text-[11px] font-medium">
                          {enq.categoryName}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-1">
                        {enq.productTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPendingState && (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 font-semibold">
                          <Clock className="h-3 w-3" />
                          {locale === "am" ? "ሻጭ በመጠበቅ ላይ" : "Waiting for Supplier"}
                        </Badge>
                      )}
                      {isAcceptedState && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 font-semibold">
                          <Unlock className="h-3 w-3" />
                          {locale === "am" ? "አድራሻ ተከፍቷል" : "Supplier Contact Unlocked"}
                        </Badge>
                      )}
                      {isDisputedState && (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 font-semibold">
                          <ShieldAlert className="h-3 w-3" />
                          {locale === "am" ? "በክርክር ላይ" : "Under Dispute Mediation"}
                        </Badge>
                      )}
                      {isCompletedState && (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          {locale === "am" ? "ስምምነት ተፈጽሟል" : "Deal Completed"}
                        </Badge>
                      )}
                      {isFailedState && (
                        <Badge className="bg-muted text-muted-foreground border-border gap-1 font-semibold">
                          {locale === "am" ? "ስምምነት አልተሳካም" : "Deal Closed"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <StartChatButton
                    enquiryId={enq.id}
                    size="sm"
                    variant="outline"
                    className="w-fit gap-1.5 text-xs font-semibold"
                  />

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg bg-muted/40 p-3.5 text-xs">
                    <div>
                      <span className="text-muted-foreground block">{t("enquiry_card_quantity")}</span>
                      <span className="font-bold text-foreground font-mono text-sm">
                        {enq.qty.toLocaleString()} {getLocalizedUnit(enq.unit, locale)}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">{t("buyer_enquiry_delivery_pref")}</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                        <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                        {enq.deliveryPreference === "SELF_COLLECT" ? "Ex-Works Pickup" : "Site Delivered"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">
                        {locale === "am" ? "የማስረከቢያ ቦታ" : "Destination Site"}
                      </span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {enq.deliveryAddress || "Addis Ababa"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">
                        {locale === "am" ? "የቀረበበት ቀን" : "Submitted Date"}
                      </span>
                      <span className="font-medium text-foreground mt-0.5">
                        {new Date(enq.createdAt).toLocaleDateString(
                          locale === "am" ? "am-ET" : "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* PRE-UNLOCK STATE: Supplier is masked */}
                  {!enq.isUnlocked && isPendingState && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-xs text-foreground">
                          {enq.sellerContact.companyName || "ConMart Verified Supplier Depot"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {locale === "am"
                          ? "የተረጋገጠው አቅራቢ ፍላጎትዎ ደርሶታል። አቅራቢው ጥያቄውን እንደተቀበለ፣ የቀጥታ ስልክ ቁጥራቸው እና ትክክለኛ የመጋዘን አድራሻቸው እዚህ ይከፈትልዎታል።"
                          : "The verified supplier has been notified of your requirement. Once the supplier accepts the introduction, their direct telephone contact and depot location will be unlocked here."}
                      </p>
                    </div>
                  )}

                  {/* POST-UNLOCK STATE: Supplier Contact Revealed */}
                  {enq.isUnlocked && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold text-xs text-foreground">
                            {locale === "am" ? "የአቅራቢ አድራሻ ተከፍቷል" : "Supplier Contact Unlocked"}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {locale === "am" ? "የተረጋገጠ ግንኙነት" : "Certified Introduction"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            {locale === "am" ? "የአቅራቢ ድርጅት፦" : "Supplier Company:"}
                          </span>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5 mt-0.5">
                            <Building className="h-3.5 w-3.5 text-primary" />
                            {enq.sellerContact.companyName || "Verified Supplier"}
                          </div>
                          {enq.listingLocation && (
                            <div className="text-muted-foreground flex items-center gap-1 mt-1 text-[11px]">
                              <MapPin className="h-3 w-3 text-primary shrink-0" />
                              {enq.listingLocation}
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-muted-foreground">
                            {locale === "am" ? "የቀጥታ ስልክ ቁጥር፦" : "Direct Supplier Phone:"}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-base font-extrabold text-foreground">
                              {enq.sellerContact.phone || "—"}
                            </span>
                            {enq.sellerContact.phone && (
                              <a
                                href={`tel:${enq.sellerContact.phone}`}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                              >
                                <Phone className="h-3 w-3" />
                                {locale === "am" ? "ይደውሉ" : "Call Supplier"}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dispute Trigger Button */}
                      {!isDisputedState && (
                        <div className="pt-2 border-t border-emerald-500/10 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisputeModalEnquiry(enq)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {locale === "am" ? "አቤቱታ / ችግር አቅርብ" : "Report Issue / Raise Dispute"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DISPUTE SUBMISSION MODAL */}
      {disputeModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {locale === "am" ? "የንግድ አቤቱታ ማቅረቢያ" : "Raise Trade Dispute"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  #{disputeModalEnquiry.referenceCode} · {disputeModalEnquiry.productTitle}
                </p>
              </div>
              <button
                onClick={() => setDisputeModalEnquiry(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  {locale === "am" ? "የአቤቱታው ዓይነት፦" : "Dispute Claim Category:"}
                </label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value as DisputeClaimType)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={DisputeClaimType.SHORTAGE}>
                    {locale === "am" ? "የመጠን ጉድለት (Shortage)" : "Quantity Shortage"}
                  </option>
                  <option value={DisputeClaimType.DAMAGE}>
                    {locale === "am" ? "የዕቃ መበላሸት / ጉዳት (Damage)" : "Damaged / Defective Material"}
                  </option>
                  <option value={DisputeClaimType.WRONG_SPECIFICATION}>
                    {locale === "am" ? "የጥራት/ስፔስፊኬሽን ስህተት (Wrong Spec)" : "Wrong Specification / Grade Mismatch"}
                  </option>
                  <option value={DisputeClaimType.NON_DELIVERY}>
                    {locale === "am" ? "ዕቃው አልደረሰም (Non-Delivery)" : "Non-Delivery / Unfulfilled Order"}
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  {locale === "am" ? "ዝርዝር መግለጫ፦" : "Detailed Description:"}
                </label>
                <Textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder={
                    locale === "am"
                      ? "የተፈጠረውን ችግር በዝርዝር ያብራሩ (ለምሳሌ የደረሰው ሲሚንቶ 30 ኩንታል ጎድሏል)..."
                      : "Describe the trade issue in detail (e.g., delivered rebar diameter was 10mm instead of 12mm)..."
                  }
                  rows={4}
                  className="text-xs resize-none"
                  required
                />
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
                {locale === "am"
                  ? "የኮንማርት የኦፕሬሽን ቡድን ሁለቱንም ወገኖች በማነጋገር ችግሩን በሽምግልና ይፈታል፤ እንደ አስፈላጊነቱም የዋስትና እርምጃዎችን ይወስዳል።"
                  : "ConMart Operations will mediate between both parties and inspect delivery evidence to resolve the claim."}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisputeModalEnquiry(null)}
                  disabled={isDisputePending}
                >
                  {locale === "am" ? "ይቅር" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isDisputePending}
                  className="font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isDisputePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {locale === "am" ? "አቤቱታውን ላክ" : "Submit Dispute Claim"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
