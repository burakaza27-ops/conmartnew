// =============================================================================
// ECON — Seller Prepaid Wallet View Component
// =============================================================================
// Dual-balance system according to Addis Ababa B2B specifications:
// - Cash Balance: Deposited via CBE / Telebirr, withdrawable upon request.
// - Credit Balance: 80% deal failure refund credit, strictly non-withdrawable.
// - Total Spendable: Cash + Credit (burns credit first on introduction unlock).
// =============================================================================

"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Wallet as WalletIcon,
  RefreshCw,
  Coins,
  ShieldCheck,
  Building2,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/image-uploader";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatPrice } from "@/lib/i18n/translations";
import { submitTopUpRequestAction } from "@/app/actions/wallet";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  description: string;
  balanceAfterCash: number;
  balanceAfterCredit: number;
  createdAt: string;
}

interface PendingTopUp {
  id: string;
  amount: number;
  paymentMethod: string;
  referenceCode: string;
  status: string;
  createdAt: string;
}

interface WalletData {
  walletId: string;
  cashBalance: number;
  creditBalance: number;
  totalSpendable: number;
  transactions: Transaction[];
  pendingTopUps: PendingTopUp[];
}

interface SellerWalletViewProps {
  initialData: WalletData;
}

export function SellerWalletView({ initialData }: SellerWalletViewProps) {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<WalletData>(initialData);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"CBE" | "TELEBIRR">("TELEBIRR");
  const [amount, setAmount] = useState("1000");
  const [referenceCode, setReferenceCode] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const CBE_ACCOUNT = "1000482919283";
  const TELEBIRR_ACCOUNT = "0911000000";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTopUpOpen) {
        setIsTopUpOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTopUpOpen]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid deposit amount.");
      return;
    }

    if (!referenceCode.trim()) {
      setFormError("Please provide the transaction reference code or SMS confirmation.");
      return;
    }

    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("paymentMethod", selectedMethod);
    formData.append("referenceCode", referenceCode.trim());
    if (slipUrl) {
      formData.append("slipUrl", slipUrl);
    }

    startTransition(async () => {
      const res = await submitTopUpRequestAction(formData);
      if (res.success) {
        setFormSuccess(t("wallet_pending_approvals"));
        // Optimistically add pending top-up
        setData((prev) => ({
          ...prev,
          pendingTopUps: [
            {
              id: res.data?.topUpId || `temp-${Date.now()}`,
              amount: parsedAmount,
              paymentMethod: selectedMethod,
              referenceCode: referenceCode.trim(),
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
            ...prev.pendingTopUps,
          ],
        }));
        setReferenceCode("");
        setSlipUrl("");
        setTimeout(() => {
          setIsTopUpOpen(false);
          setFormSuccess(null);
        }, 1500);
      } else {
        setFormError(res.error || "Failed to submit top-up request.");
      }
    });
  };

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">{t("wallet_tx_DEPOSIT")}</Badge>;
      case "REFUND":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">{t("wallet_tx_REFUND")}</Badge>;
      case "UNLOCK_FEE":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">{t("wallet_tx_UNLOCK_FEE")}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Title & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2.5">
            <WalletIcon className="h-7 w-7 text-primary" />
            {t("wallet_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("wallet_subtitle")}
          </p>
        </div>

        {/* Deposit Top-Up Modal Trigger */}
        <Button
          size="lg"
          onClick={() => setIsTopUpOpen(true)}
          className="gap-2 shadow-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          {t("wallet_top_up_btn")}
        </Button>
      </div>

      {/* 3-Card Dual Balance Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Spendable (Primary Card) */}
        <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-primary/5 via-card to-background shadow-xs">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-primary/10 blur-2xl" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("wallet_total_spendable")}
              </CardTitle>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {formatPrice(data.totalSpendable, locale)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("wallet_total_spendable_desc")}
            </p>
          </CardContent>
        </Card>

        {/* Cash Balance */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("wallet_cash_balance")}
              </CardTitle>
              <Building2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatPrice(data.cashBalance, locale)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("wallet_cash_desc")}
            </p>
          </CardContent>
        </Card>

        {/* Credit Balance (Non-Withdrawable) */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("wallet_credit_balance")}
              </CardTitle>
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatPrice(data.creditBalance, locale)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("wallet_credit_desc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Deposit Requests (If Any) */}
      {data.pendingTopUps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {t("wallet_pending_approvals")}
            </h2>
            <Badge variant="secondary" className="font-mono text-xs">
              {data.pendingTopUps.length}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.pendingTopUps.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-foreground text-sm">
                    {formatPrice(p.amount, locale)}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 font-mono">
                    <span>{p.paymentMethod}</span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{p.referenceCode}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium">
                  {t("wallet_verifying_badge")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History Ledger */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("wallet_history_title")}
          </CardTitle>
          <CardDescription>
            {t("wallet_ledger_desc")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("wallet_history_empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">{t("wallet_col_date")}</th>
                    <th className="py-3 px-4">{t("wallet_col_type")}</th>
                    <th className="py-3 px-4">{t("wallet_col_amount")}</th>
                    <th className="py-3 px-4">{t("wallet_col_desc")}</th>
                    <th className="py-3 px-4">{t("wallet_col_reference")}</th>
                    <th className="py-3 px-4 text-right">{t("wallet_col_balance_after")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-sans">
                  {data.transactions.map((tx) => {
                    const isPositive = tx.type === "DEPOSIT" || tx.type === "REFUND";
                    return (
                      <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString(
                            locale === "am" ? "am-ET" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getTxTypeBadge(tx.type)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }
                          >
                            {isPositive ? "+" : "-"}
                            {formatPrice(tx.amount, locale)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-foreground max-w-[280px] truncate">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {tx.reference || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatPrice(tx.balanceAfterCash, locale)} / {formatPrice(tx.balanceAfterCredit, locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Self-Contained Modal Overlay for Deposit / Top-Up */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  {t("wallet_top_up_modal_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTopUpOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("wallet_top_up_modal_desc")}
            </p>

            <form onSubmit={handleTopUpSubmit} className="space-y-4 pt-1">
              {/* Method Selector Tabs */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("wallet_payment_method")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("TELEBIRR")}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedMethod === "TELEBIRR"
                        ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">Telebirr</div>
                      <div className="text-xs text-muted-foreground">Ethio Telecom</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("CBE")}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedMethod === "CBE"
                        ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Building2 className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">CBE Birr</div>
                      <div className="text-xs text-muted-foreground">Commercial Bank</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Official Account Box */}
              <div className="rounded-lg border bg-muted/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedMethod === "TELEBIRR" ? t("wallet_telebirr_label") : t("wallet_cbe_label")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        selectedMethod === "TELEBIRR" ? TELEBIRR_ACCOUNT : CBE_ACCOUNT,
                        selectedMethod
                      )
                    }
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    {copiedAccount === selectedMethod ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">{t("wallet_copied_badge")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t("wallet_copy_btn")}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-foreground">
                  {selectedMethod === "TELEBIRR" ? TELEBIRR_ACCOUNT : CBE_ACCOUNT}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedMethod === "TELEBIRR"
                    ? t("wallet_telebirr_account")
                    : t("wallet_cbe_account")}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <Label htmlFor="topup-amount">{t("wallet_amount_label")}</Label>
                <div className="relative">
                  <Input
                    id="topup-amount"
                    type="number"
                    step="100"
                    min="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-mono font-medium pl-14"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground font-semibold">
                    ETB
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className="rounded-md border bg-muted/30 px-2 py-1 text-xs font-medium hover:bg-muted text-foreground transition-colors"
                    >
                      +{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Code Input */}
              <div className="space-y-1.5">
                <Label htmlFor="topup-ref">{t("wallet_reference_label")}</Label>
                <Input
                  id="topup-ref"
                  placeholder={t("wallet_reference_placeholder")}
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              {/* Slip / Receipt Upload */}
              <div className="space-y-1.5">
                <Label>{t("wallet_receipt_label")}</Label>
                <ImageUploader
                  value={slipUrl}
                  onChange={setSlipUrl}
                  className="h-28"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTopUpOpen(false)}
                  disabled={isPending}
                >
                  {t("btn_cancel")}
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2 font-semibold">
                  {isPending ? t("wallet_submitting") : t("wallet_submit_topup")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
