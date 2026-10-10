// =============================================================================
// ConMart — Seller Subscription & Billing View
// =============================================================================
// Displays:
// 1. Current Subscription Tier & Expiry Countdown.
// 2. Plan comparison cards (Basic, Premium, Featured).
// 3. Payment instructions (Telebirr, CBE Birr, Bank Transfer).
// 4. Offline payment submission form (reference code & slip).
// 5. Historical payment receipts ledger.
// =============================================================================

"use client";

import React, { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Building2,
  Phone,
  QrCode,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import { submitSubscriptionPaymentAction } from "@/app/actions/subscription";
import { SubscriptionTier, PaymentMethod, WalletTxStatus } from "@prisma/client";
import { SYSTEM_CONTACTS } from "@/lib/config/system-contacts";

export interface PlanItem {
  id: string;
  tier: SubscriptionTier;
  name: string;
  priceETB: number;
  durationDays: number;
  description: string;
  features: string[];
}

export interface PaymentRecordItem {
  id: string;
  tier: SubscriptionTier;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceCode: string;
  slipUrl?: string | null;
  status: WalletTxStatus;
  notes?: string | null;
  createdAt: string;
}

interface SubscriptionViewProps {
  currentTier: SubscriptionTier;
  status: string;
  expiresAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  needsRenewalNotice: boolean;
  plans: PlanItem[];
  payments: PaymentRecordItem[];
}

export function SubscriptionView({
  currentTier,
  status,
  expiresAt,
  daysRemaining,
  isExpired,
  needsRenewalNotice,
  plans,
  payments: initialPayments,
}: SubscriptionViewProps) {
  const { locale } = useLanguage();
  const [payments, setPayments] = useState(initialPayments);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.TELEBIRR);
  const [referenceCode, setReferenceCode] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleOpenSubscribe = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setFormError(null);
    setFormSuccess(null);
    setReferenceCode("");
    setSlipUrl("");
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!referenceCode.trim()) {
      setFormError(locale === "am" ? "የክፍያ ማረጋገጫ ቁጥር (Reference Code) ያስገቡ" : "Please enter the transaction reference code");
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const res = await submitSubscriptionPaymentAction({
        tier: selectedPlan.tier,
        paymentMethod,
        referenceCode: referenceCode.trim(),
        slipUrl: slipUrl.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error);
      } else {
        setFormSuccess(
          locale === "am"
            ? "የክፍያ ማረጋገጫዎ በተሳካ ሁኔታ ተልኳል! አስተዳዳሪው እንደተመለከተው ደንበኝነትዎ ወዲያውኑ ይነቃል (በ1-2 ሰዓት ውስጥ)።"
            : "Payment submitted successfully! Admin will verify and activate your subscription within 1–2 hours."
        );
        // Optimistically prepend to payments list
        setPayments((prev) => [
          {
            id: res.data.paymentId,
            tier: selectedPlan.tier,
            amount: res.data.amount,
            paymentMethod,
            referenceCode: res.data.referenceCode,
            slipUrl: slipUrl.trim() || null,
            status: WalletTxStatus.PENDING,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch {
      setFormError("Failed to submit payment. Please verify your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-primary" />
          {locale === "am" ? "የአቅራቢ ደንበኝነት እና ክፍያ" : "Supplier Subscription & Billing"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {locale === "am"
            ? "የቀጥታ ስልክዎን፣ የዋትሳፕ ቁጥርዎን እና የመጋዘን አድራሻዎን በኮንማርት ገዢዎች ፊት ለማሳየት ደንበኝነትዎን ያድሱ።"
            : "Keep your direct phone, WhatsApp number, and yard address visible to thousands of construction buyers across Ethiopia."}
        </p>
      </div>

      {/* Subscription Status Card */}
      <Card className="border-border/80 bg-gradient-to-br from-card via-card to-background shadow-md overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={status === "ACTIVE" ? "default" : "secondary"}
                className={`text-xs font-bold uppercase tracking-wider ${
                  status === "ACTIVE"
                    ? "bg-emerald-600 text-white"
                    : status === "PENDING_CONFIRMATION"
                    ? "bg-amber-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status === "ACTIVE"
                  ? locale === "am"
                    ? "ንቁ ደንበኛ (ACTIVE)"
                    : "ACTIVE SUBSCRIPTION"
                  : status === "PENDING_CONFIRMATION"
                  ? locale === "am"
                    ? "ክፍያ በመረጋገጥ ላይ"
                    : "PENDING CONFIRMATION"
                  : locale === "am"
                  ? "ያልነቃ / ያለቀ"
                  : "FREE / EXPIRED"}
              </Badge>

              <Badge variant="outline" className="font-mono text-xs font-semibold">
                Tier: {currentTier}
              </Badge>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {status === "ACTIVE"
                  ? `${currentTier} Plan — ${daysRemaining} Days Remaining`
                  : status === "PENDING_CONFIRMATION"
                  ? locale === "am"
                    ? "ክፍያዎ በአስተዳዳሪ እየተረጋገጠ ነው"
                    : "Payment under Admin Review"
                  : locale === "am"
                  ? "ደንበኝነትዎ አብቅቷል"
                  : "Your Subscription has Expired"}
              </h2>
              {expiresAt && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {locale === "am" ? "የሚያበቃበት ቀን: " : "Valid until: "}
                    {new Date(expiresAt).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
                      dateStyle: "long",
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {plans.length > 0 && (
              <Button
                onClick={() => handleOpenSubscribe(plans[1] || plans[0])}
                size="lg"
                className="gap-2 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>{status === "ACTIVE" ? (locale === "am" ? "አድስ / አሻሽል" : "Renew / Upgrade") : (locale === "am" ? "አሁን ይመዝገቡ" : "Subscribe Now")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Warning Banner if expiring within 7 days or expired */}
        {(needsRenewalNotice || isExpired) && (
          <div className="border-t border-amber-500/30 bg-amber-500/10 px-6 py-3 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              {isExpired
                ? (locale === "am"
                    ? "የቀጥታ ስልክዎ እና ዋትሳፕዎ ለገዢዎች ተደብቀዋል። ገዢዎች በቀጥታ እንዲደውሉልዎ አሁን ደንበኝነትዎን ያድሱ!"
                    : "Your direct phone and WhatsApp contact details are currently hidden. Renew now to restore instant buyer calls.")
                : (locale === "am"
                    ? `ደንበኝነትዎ በ ${daysRemaining} ቀናት ውስጥ ያበቃል! ክፍተቶች እንዳይፈጠሩ አስቀድመው ያድሱ።`
                    : `Your subscription expires in ${daysRemaining} days! Renew today to prevent interruption.`)}
            </p>
          </div>
        )}
      </Card>

      {/* Subscription Plans Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {locale === "am" ? "የደንበኝነት ዕቅዶች" : "Available Subscription Plans"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "am"
              ? "ለንግድዎ የሚስማማውን ይምረጡ። ምንም ተጨማሪ የኮሚሽን ቅነሳ አይደረግም — ገዢዎች በቀጥታ ይደውሉልዎታል!"
              : "Zero commission deducted from your sales. Buyers call and pay you directly."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.tier && status === "ACTIVE";
            const isFeatured = plan.tier === SubscriptionTier.PREMIUM || plan.tier === SubscriptionTier.FEATURED;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between overflow-hidden border transition-all ${
                  isFeatured
                    ? "border-primary/60 shadow-lg bg-card"
                    : "border-border shadow-xs bg-card/60"
                }`}
              >
                {isFeatured && (
                  <div className="bg-primary px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                    {locale === "am" ? "በጣም ተመራጭ" : "Most Popular"}
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    {isCurrent && (
                      <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500 text-emerald-600">
                        {locale === "am" ? "የአሁኑ ዕቅድ" : "Current Plan"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>

                  <div className="pt-4">
                    <span className="font-mono text-3xl font-black text-foreground">
                      {formatETB(plan.priceETB, locale)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      / {plan.durationDays} {locale === "am" ? "ቀናት" : "Days"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 border-t border-border/40 pt-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleOpenSubscribe(plan)}
                    variant={isFeatured ? "default" : "outline"}
                    className="w-full mt-6 gap-2 font-bold shadow-xs"
                  >
                    <span>{isCurrent ? (locale === "am" ? "አድስ" : "Renew Plan") : (locale === "am" ? "ይህን ምረጥ" : "Select Plan")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {locale === "am" ? "የክፍያ ታሪክ" : "Subscription Payment History"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "am"
              ? "የቀደሙ ክፍያዎችዎ እና የአስተዳዳሪ ማረጋገጫ ሁኔታ።"
              : "Receipt submissions and admin approval records."}
          </p>
        </div>

        <Card className="border-border/80 shadow-xs overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {locale === "am"
                ? "እስካሁን ምንም የተመዘገበ የክፍያ ታሪክ የለም።"
                : "No subscription payments submitted yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ዕቅድ" : "Tier"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "መጠን" : "Amount"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ዘዴ" : "Method"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ማጣቀሻ ኮድ" : "Reference Code"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ሁኔታ" : "Status"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ቀን" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold text-xs">{p.tier}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {formatETB(p.amount, locale)}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {p.paymentMethod.replace("_", " ")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground font-semibold">
                        {p.referenceCode}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === WalletTxStatus.COMPLETED
                              ? "default"
                              : p.status === WalletTxStatus.PENDING
                              ? "secondary"
                              : "destructive"
                          }
                          className={`text-[10px] font-semibold ${
                            p.status === WalletTxStatus.COMPLETED
                              ? "bg-emerald-600 text-white"
                              : p.status === WalletTxStatus.PENDING
                              ? "bg-amber-600 text-white"
                              : ""
                          }`}
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Instructions & Submission Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border border-border shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/60">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary text-primary-foreground font-semibold text-xs">
                {selectedPlan?.tier} PLAN
              </Badge>
              <Badge variant="outline" className="font-mono text-xs font-bold">
                {selectedPlan ? formatETB(selectedPlan.priceETB, locale) : ""}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {locale === "am" ? "የክፍያ ማረጋገጫ ያስገቡ" : "Complete Subscription Payment"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {locale === "am"
                ? "በቴሌብር ወይም በባንክ የተላከውን የክፍያ ማረጋገጫ ቁጥር ያስገቡ። አስተዳዳሪው ወዲያውኑ አረጋግጦ ደንበኝነትዎን ያነቃዋል።"
                : "Transfer the plan amount using Telebirr or Bank, then submit your transaction code below."}
            </DialogDescription>
          </DialogHeader>

          {formSuccess ? (
            <div className="p-6 space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  {locale === "am" ? "የክፍያ ጥያቄዎ ደርሷል!" : "Payment Submitted!"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {formSuccess}
                </p>
              </div>
              <Button onClick={() => setIsPaymentModalOpen(false)} className="w-full">
                {locale === "am" ? "ጨርስ" : "Done"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Bank / Mobile Account Details */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === "am" ? "ደረጃ 1: ወደሚከተሉት ሂሳቦች ይላኩ" : "Step 1: Transfer to Official Accounts"}
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1">
                    <span className="font-bold text-foreground block">Telebirr</span>
                    <span className="font-mono text-xs font-bold text-primary block">
                      {SYSTEM_CONTACTS.primaryPhone}
                    </span>
                    <span className="text-[10px] text-muted-foreground">ConMart Wholesale</span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="font-bold text-foreground block">CBE Birr</span>
                    <span className="font-mono text-xs font-bold text-foreground block">
                      {SYSTEM_CONTACTS.secondaryPhone}
                    </span>
                    <span className="text-[10px] text-muted-foreground">ConMart General</span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="font-bold text-foreground block">CBE Bank</span>
                    <span className="font-mono text-xs font-bold text-foreground block">
                      1000 4821 9482
                    </span>
                    <span className="text-[10px] text-muted-foreground">ConMart Trading PLC</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Details Submission Form */}
              <div className="space-y-4 pt-2 border-t border-border/40">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === "am" ? "ደረጃ 2: የላኩበትን ዝርዝር ያስገቡ" : "Step 2: Enter Transaction Details"}
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="paymentMethod" className="text-xs font-semibold">
                      {locale === "am" ? "የክፍያ ዘዴ *" : "Payment Method *"}
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                    >
                      <SelectTrigger id="paymentMethod" className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.TELEBIRR}>Telebirr</SelectItem>
                        <SelectItem value={PaymentMethod.CBE_BANK}>Commercial Bank of Ethiopia (CBE)</SelectItem>
                        <SelectItem value={PaymentMethod.AWASH_BANK}>Awash Bank</SelectItem>
                        <SelectItem value={PaymentMethod.CASH_DEPOSIT}>Cash Deposit / Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="referenceCode" className="text-xs font-semibold">
                      {locale === "am" ? "የማረጋገጫ ኮድ (Reference / Tx ID) *" : "Reference / Transaction ID *"}
                    </Label>
                    <Input
                      id="referenceCode"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="e.g. TB948219482 or CBEFT8492"
                      className="text-xs font-mono font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slipUrl" className="text-xs font-medium text-muted-foreground">
                    {locale === "am" ? "የደረሰኝ ፎቶ ማስፈንጠሪያ (አማራጭ)" : "Slip / Screenshot URL (Optional)"}
                  </Label>
                  <Input
                    id="slipUrl"
                    value={slipUrl}
                    onChange={(e) => setSlipUrl(e.target.value)}
                    placeholder="https://... (or leave empty if reference code is clear)"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={loading}
                >
                  {locale === "am" ? "ሰርዝ" : "Cancel"}
                </Button>
                <Button type="submit" disabled={loading} className="gap-2 font-semibold">
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {locale === "am" ? "ክፍያውን አረጋግጥ" : "Submit Payment for Verification"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
