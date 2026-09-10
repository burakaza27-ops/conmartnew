// =============================================================================
// ConMart — Seller Enquiry Inbox Client Component
// =============================================================================
// Implements the Addis Ababa Contractor Introduction model:
// - Pre-unlock: Zero buyer contact leakage (masked contractor ID, destination sub-city only)
// - One-click accept: Deducts fee from seller wallet (credit first, then cash)
// - Post-unlock: Full contractor phone & delivery address revealed
// - Deal outcome: Success confirmation or Failed reporting with 80% refund to credit balance
// =============================================================================

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Building,
  MapPin,
  Truck,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Coins,
  RefreshCw,
  ChevronRight,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatPrice, getLocalizedUnit } from "@/lib/i18n/translations";
import {
  sellerAcceptEnquiryAction,
  sellerDeclineEnquiryAction,
  reportDealOutcomeAction,
} from "@/app/actions/enquiries";
import { StartChatButton } from "@/components/chat/start-chat-button";

export interface EnquiryItem {
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
  unlockFee: number;
  isUnlocked: boolean;
  directChatEnabled: boolean;
  dealTicket: {
    id: string;
    referenceCode: string;
    status: string;
    roomId: string | null;
  } | null;
  buyerContact: {
    name: string;
    companyName?: string | null;
    phone?: string;
    exactAddress?: string;
  };
  unlockRecord: {
    feeAmount: number;
    unlockedAt: string;
    refundStatus: string;
    sellerReportedOutcome: string | null;
  } | null;
}

interface SellerEnquiriesViewProps {
  initialEnquiries: EnquiryItem[];
  walletSpendable: number;
  walletCash: number;
  walletCredit: number;
}

export function SellerEnquiriesView({
  initialEnquiries,
  walletSpendable,
  walletCredit,
}: SellerEnquiriesViewProps) {
  const { t, locale } = useLanguage();
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(initialEnquiries);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "ACCEPTED" | "COMPLETED">("PENDING");
  const [actionEnquiry, setActionEnquiry] = useState<EnquiryItem | null>(null);
  const [failModalEnquiry, setFailModalEnquiry] = useState<EnquiryItem | null>(null);
  const [failReason, setFailReason] = useState<string>("unresponsive");
  const [failNotes, setFailNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredEnquiries = enquiries.filter((e) => {
    if (activeTab === "PENDING") return e.status === "PENDING";
    if (activeTab === "ACCEPTED") return e.status === "ACCEPTED" || e.status === "DELIVERY_IN_PROGRESS";
    if (activeTab === "COMPLETED") return e.status === "COMPLETED" || e.status === "FAILED" || e.status === "DISPUTED";
    return true;
  });

  const pendingCount = enquiries.filter((e) => e.status === "PENDING").length;

  const handleConfirmUnlock = (enquiry: EnquiryItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await sellerAcceptEnquiryAction(enquiry.id);
      if (res.success) {
        const { buyerContact, feeAmount } = res.data;

        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === enquiry.id
              ? {
                  ...item,
                  status: "ACCEPTED",
                  isUnlocked: true,
                  buyerContact: {
                    name: buyerContact.name,
                    companyName: buyerContact.companyName,
                    phone: buyerContact.phone,
                    exactAddress: buyerContact.deliveryAddress,
                  },
                  unlockRecord: {
                    // The fee actually charged, which can differ from the
                    // listed unlockFee if an administrator changed the
                    // category price between listing and acceptance.
                    feeAmount,
                    unlockedAt: new Date().toISOString(),
                    refundStatus: "NONE",
                    sellerReportedOutcome: null,
                  },
                }
              : item
          )
        );
        setActionEnquiry(null);
        setSuccessMsg(t("enquiry_unlocked_badge"));
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  const handleDecline = (enquiryId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await sellerDeclineEnquiryAction(enquiryId);
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === enquiryId ? { ...item, status: "DECLINED" } : item))
        );
      } else {
        setErrorMsg(res.error || "Failed to decline enquiry.");
      }
    });
  };

  const handleCompleteDeal = (enquiryId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await reportDealOutcomeAction({
        enquiryId,
        outcome: "SUCCESS",
      });
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === enquiryId ? { ...item, status: "COMPLETED" } : item))
        );
        setSuccessMsg(
          locale === "am"
            ? "ግብይቱ በተሳካ ሁኔታ መጠናቀቁ ተረጋግጧል።"
            : "Deal marked as completed."
        );
      } else {
        setErrorMsg(res.error || "Failed to update deal status.");
      }
    });
  };

  const handleReportFailure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failModalEnquiry) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await reportDealOutcomeAction({
        enquiryId: failModalEnquiry.id,
        outcome: "FAILURE",
        reason: `${failReason}: ${failNotes}`,
      });
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === failModalEnquiry.id ? { ...item, status: "FAILED" } : item))
        );
        setFailModalEnquiry(null);
        setFailNotes("");
        setSuccessMsg(
          locale === "am"
            ? "ግብይቱ እንዳልተሳካ ተመዝግቧል። 80% ተመላሽ ወደ ዋሌትዎ ገቢ ተደርጓል።"
            : "Deal reported failed. 80% refund credited to your wallet."
        );
      } else {
        setErrorMsg(res.error || "Failed to process refund.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Title & Wallet Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2.5">
            <Inbox className="h-7 w-7 text-primary" />
            {t("enquiries_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("enquiries_subtitle")}
          </p>
        </div>

        <Link
          href="/seller/wallet"
          className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-xs hover:border-primary/50 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("wallet_total_spendable")}
            </div>
            <div className="font-mono text-sm font-bold text-foreground">
              {formatPrice(walletSpendable, locale)}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
        </Link>
      </div>

      {/* Status Banners */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "PENDING"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <span>{t("enquiries_tab_pending")}</span>
          {pendingCount > 0 && (
            <Badge className="bg-primary-foreground/20 text-primary-foreground font-mono text-[10px] px-1.5 py-0">
              {pendingCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ACCEPTED")}
          className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "ACCEPTED"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("enquiries_tab_unlocked")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "COMPLETED"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("enquiries_tab_completed")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "ALL"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("enquiries_tab_all")}
        </button>
      </div>

      {/* Enquiry Cards List */}
      {filteredEnquiries.length === 0 ? (
        <div className="py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-foreground">{t("enquiries_empty")}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            New purchase enquiries from contractors across Addis Ababa will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEnquiries.map((enq) => {
            const canAfford = walletSpendable >= enq.unlockFee;
            const isPendingState = enq.status === "PENDING";
            const isAcceptedState = enq.status === "ACCEPTED" || enq.status === "DELIVERY_IN_PROGRESS";
            const isCompletedState = enq.status === "COMPLETED";
            const isFailedState = enq.status === "FAILED";

            return (
              <Card
                key={enq.id}
                className={`overflow-hidden border transition-all ${
                  isAcceptedState
                    ? "border-emerald-500/40 bg-card shadow-xs"
                    : isPendingState
                    ? "border-primary/40 bg-card shadow-xs hover:border-primary"
                    : "border-border bg-card/60"
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Header: Material Title & Status Badge */}
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
                          {t("enquiry_status_PENDING")}
                        </Badge>
                      )}
                      {isAcceptedState && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 font-semibold">
                          <Unlock className="h-3 w-3" />
                          {t("enquiry_unlocked_badge")}
                        </Badge>
                      )}
                      {isCompletedState && (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("enquiry_status_COMPLETED")}
                        </Badge>
                      )}
                      {isFailedState && (
                        <Badge className="bg-muted text-muted-foreground border-border gap-1 font-semibold">
                          <RefreshCw className="h-3 w-3" />
                          {t("enquiry_status_FAILED")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <StartChatButton
                    enquiryId={enq.id}
                    portal="seller"
                    directChatEnabled={enq.directChatEnabled}
                    size="sm"
                    variant="outline"
                    className="w-fit gap-1.5 text-xs font-semibold"
                  />

                  {/* Requirements Grid */}
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
                        {enq.deliveryPreference === "EX_WORKS" ? "Ex-Works (Pickup)" : "Site Delivery"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">{t("enquiry_card_subcity")}</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {enq.deliveryAddress || "Addis Ababa"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">{t("enquiry_card_unlock_fee")}</span>
                      <span className="font-bold text-primary font-mono text-sm">
                        {formatPrice(enq.unlockFee, locale)}
                      </span>
                    </div>
                  </div>

                  {/* PRE-UNLOCK VIEW: Masked contractor information */}
                  {!enq.isUnlocked && isPendingState && (
                    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-primary" />
                          <span className="font-bold text-sm text-foreground">
                            {t("enquiry_card_masked_buyer").replace("{id}", enq.id.slice(-4))}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                          Masked Pre-Unlock
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The contractor’s direct phone number, company name, and exact construction site address are protected under ConMart zero-leakage security. Unlock this introduction to initiate direct phone contact and finalize logistics.
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-primary/20">
                        <div className="text-xs">
                          {canAfford ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ Spendable wallet balance covers this unlock fee.
                            </span>
                          ) : (
                            <span className="text-destructive font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {t("enquiry_insufficient_wallet")}{" "}
                              <Link href="/seller/wallet" className="underline font-bold">
                                {t("enquiry_topup_wallet_link")}
                              </Link>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDecline(enq.id)}
                            disabled={isPending}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            {t("enquiry_decline_btn")}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => setActionEnquiry(enq)}
                            disabled={!canAfford || isPending}
                            className="gap-1.5 text-xs font-semibold shadow-xs"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            {t("enquiry_accept_btn")} ({formatPrice(enq.unlockFee, locale)})
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POST-UNLOCK VIEW: Revealed Contractor Details */}
                  {enq.isUnlocked && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold text-sm text-foreground">
                            {t("enquiry_buyer_revealed_title")}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {t("enquiry_unlock_cert")}: #{enq.referenceCode}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 text-xs">
                        <div className="space-y-1">
                          <span className="text-muted-foreground">{t("enquiry_buyer_name")} / Company</span>
                          <div className="font-bold text-sm text-foreground">
                            {enq.buyerContact.name}
                          </div>
                          {enq.buyerContact.companyName && (
                            <div className="text-muted-foreground flex items-center gap-1 font-medium">
                              <Building className="h-3.5 w-3.5 text-primary" />
                              {enq.buyerContact.companyName}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-muted-foreground">{t("enquiry_buyer_phone")}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-base font-extrabold text-foreground">
                              {enq.buyerContact.phone}
                            </span>
                            <a
                              href={`tel:${enq.buyerContact.phone}`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              {t("enquiry_call_buyer")}
                            </a>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-1 pt-1 border-t border-emerald-500/10">
                          <span className="text-muted-foreground">{t("enquiry_buyer_site")}</span>
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            <span>{enq.deliveryAddress || "Addis Ababa"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Post-Unlock Deal Workflow Buttons */}
                      {isAcceptedState && (
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-emerald-500/20">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFailModalEnquiry(enq)}
                            disabled={isPending}
                            className="text-xs text-muted-foreground hover:text-destructive border-border"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {t("enquiry_btn_report_failed")}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleCompleteDeal(enq.id)}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-2xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("enquiry_btn_complete_deal")}
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

      {/* Confirmation Modal for Contact Unlock */}
      {actionEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  {t("enquiry_accept_confirm_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionEnquiry(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("enquiry_accept_confirm_desc")}
            </p>

            {/* Wallet Burn Breakdown */}
            <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-foreground pb-1 border-b">
                {locale === "am" ? "የዋሌት ክፍያ ዝርዝር" : "Wallet Deduction Breakdown"}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("enquiry_fee_burn_credit")}</span>
                <span className="font-mono font-medium text-foreground">
                  {formatPrice(Math.min(walletCredit, actionEnquiry.unlockFee), locale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("enquiry_fee_burn_cash")}</span>
                <span className="font-mono font-medium text-foreground">
                  {formatPrice(
                    Math.max(0, actionEnquiry.unlockFee - Math.min(walletCredit, actionEnquiry.unlockFee)),
                    locale
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t font-bold text-primary">
                <span>{t("enquiry_fee_total")}</span>
                <span className="font-mono">{formatPrice(actionEnquiry.unlockFee, locale)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionEnquiry(null)}
                disabled={isPending}
              >
                {t("btn_cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirmUnlock(actionEnquiry)}
                disabled={isPending}
                className="gap-1.5 font-semibold"
              >
                {isPending ? t("enquiry_unlocking") : t("enquiry_confirm_unlock_btn")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Deal Failure Modal (80% Credit Refund Flow) */}
      {failModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-bold text-foreground">
                  {t("enquiry_modal_fail_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFailModalEnquiry(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <RefreshCw className="h-4 w-4 shrink-0" />
                {locale === "am" ? "የ 80% ተመላሽ ዋስትና" : "80% Fee Protection Guarantee"}
              </div>
              {t("enquiry_modal_fail_desc")}{" "}
              <span className="font-mono font-bold text-foreground">
                ({formatPrice(failModalEnquiry.unlockFee * 0.8, locale)}{" "}
                {locale === "am" ? "ወደ ዋሌትዎ ገቢ ይደረጋል" : "will be credited"})
              </span>
            </div>

            <form onSubmit={handleReportFailure} className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("enquiry_fail_reason_label")}</Label>
                <div className="space-y-1.5">
                  {[
                    { id: "unresponsive", label: t("enquiry_fail_reason_unresponsive") },
                    { id: "stock", label: t("enquiry_fail_reason_stock") },
                    { id: "price", label: t("enquiry_fail_reason_price") },
                    { id: "cancelled", label: t("enquiry_fail_reason_cancelled") },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                        failReason === r.id
                          ? "border-primary bg-primary/5 font-medium text-foreground"
                          : "border-border hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="failReason"
                        checked={failReason === r.id}
                        onChange={() => setFailReason(r.id)}
                        className="text-primary focus:ring-primary"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fail-notes" className="text-xs font-semibold">
                  {t("enquiry_fail_notes_label")}
                </Label>
                <Textarea
                  id="fail-notes"
                  value={failNotes}
                  onChange={(e) => setFailNotes(e.target.value)}
                  placeholder="Provide any additional context for platform operations..."
                  className="text-xs resize-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFailModalEnquiry(null)}
                  disabled={isPending}
                >
                  {t("btn_cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                >
                  {isPending
                    ? locale === "am"
                      ? "ተመላሽ እየተሰራ ነው..."
                      : "Processing Refund..."
                    : t("enquiry_fail_submit")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
