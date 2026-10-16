// =============================================================================
// ConMart — Agent & Driver Job Credits Wallet View
// =============================================================================
// Implements the Driver / Prepaid Lead Credit specification:
// 1. 6-Month Free Launch Period Countdown Card
// 2. Prepaid Job Credit Balance (ETB) & Eligibility status
// 3. Top-Up Modal (Telebirr & CBE deposit reference verification)
// 4. Immutable Transaction Ledger (Top Up, Assignment Fee, Dispute Refund)
// 5. Fair Dispute Policy & Stationed Marketplace Hub status
// =============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Sparkles,
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Truck,
  Loader2,
  Building2,
  HelpCircle,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { topUpAgentCreditsAction, toggleAgentOnlineStatusAction } from "@/app/actions/agents";
import { useLanguage } from "@/lib/i18n/language-context";

export interface WalletTransactionItem {
  id: string;
  amount: number;
  type: "TOP_UP" | "ASSIGNMENT_FEE" | "DISPUTE_REFUND" | "ADMIN_ADJUSTMENT" | string;
  status: string;
  referenceCode?: string | null;
  leadId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface AgentWalletData {
  profileId: string;
  jobCreditBalance: number;
  introductoryEndsAt: string | null;
  isIntroductoryActive: boolean;
  daysRemainingInIntro: number;
  canAcceptJobs: boolean;
  isOnline: boolean;
  marketplaceHub: string;
  vehicleType: string | null;
  vehiclePlateNumber: string | null;
  transactions: WalletTransactionItem[];
}

interface AgentWalletViewProps {
  wallet: AgentWalletData;
  userName: string;
}

export function AgentWalletView({ wallet: initialWallet, userName }: AgentWalletViewProps) {
  const { locale } = useLanguage();
  const [wallet, setWallet] = useState<AgentWalletData>(initialWallet);

  // Top-Up Modal State
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<"TELEBIRR" | "CBE_BIRR" | "CBE_TRANSFER">("TELEBIRR");
  const [referenceCode, setReferenceCode] = useState("");
  const [topUpNotes, setTopUpNotes] = useState("");
  const [submittingTopUp, setSubmittingTopUp] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);

  // Online Toggle State
  const [togglingOnline, setTogglingOnline] = useState(false);

  const handleToggleOnline = async () => {
    const nextStatus = !wallet.isOnline;
    setTogglingOnline(true);
    try {
      const res = await toggleAgentOnlineStatusAction(nextStatus);
      if (res.success) {
        setWallet((prev) => ({ ...prev, isOnline: nextStatus }));
      }
    } catch {
      // Revert silently on failure
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceCode.trim()) {
      setTopUpError("Please enter your transaction reference code from your SMS or bank receipt.");
      return;
    }

    setSubmittingTopUp(true);
    setTopUpError(null);
    setTopUpSuccess(null);

    try {
      const res = await topUpAgentCreditsAction({
        amount: topUpAmount,
        referenceCode: referenceCode.trim(),
        paymentMethod,
        notes: topUpNotes.trim() || undefined,
      });

      if (!res.success) {
        setTopUpError(res.error);
      } else {
        setTopUpSuccess(`Successfully credited ETB ${topUpAmount.toLocaleString()} to your wallet.`);
        setWallet((prev) => ({
          ...prev,
          jobCreditBalance: res.data.newBalance,
          canAcceptJobs: true,
          transactions: [
            {
              id: res.data.transaction.id,
              amount: topUpAmount,
              type: "TOP_UP",
              status: "COMPLETED",
              referenceCode: referenceCode.trim(),
              notes: `${paymentMethod}: Deposit`,
              createdAt: new Date().toISOString(),
            },
            ...prev.transactions,
          ],
        }));
        setTimeout(() => {
          setTopUpModalOpen(false);
          setReferenceCode("");
          setTopUpNotes("");
          setTopUpSuccess(null);
        }, 1500);
      }
    } catch {
      setTopUpError("Failed to submit top-up. Please verify your reference code.");
    } finally {
      setSubmittingTopUp(false);
    }
  };

  const getTxTypeBadge = (type: string, amount: number) => {
    switch (type) {
      case "TOP_UP":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
            <ArrowDownLeft className="h-3 w-3" />
            Top-Up Deposit
          </Badge>
        );
      case "ASSIGNMENT_FEE":
        return (
          <Badge className="bg-muted text-muted-foreground border-border gap-1 text-[11px]">
            <ArrowUpRight className="h-3 w-3" />
            Assignment Fee (-100 ETB)
          </Badge>
        );
      case "DISPUTE_REFUND":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 text-[11px]">
            <RotateCcw className="h-3 w-3" />
            Dispute Refund (+100 ETB)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px]">
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-background p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/25 font-mono text-2xs uppercase tracking-widest font-bold">
                Prepaid Job Credits
              </Badge>
              <Badge variant="outline" className="font-bold text-xs gap-1 border-primary/30 text-primary">
                <MapPin className="h-3 w-3" />
                Hub: {wallet.marketplaceHub}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {locale === "am" ? "የስራ ክሬዲት ቦርሳ እና የክፍያ መዝገብ" : "Job Credits & Driver Wallet"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Partner: <strong className="text-foreground">{userName}</strong> • {wallet.vehicleType || "Driver"} {wallet.vehiclePlateNumber ? `(${wallet.vehiclePlateNumber})` : ""}
            </p>
          </div>

          {/* Quick Dispatch Switch & Top-Up Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleOnline}
              disabled={togglingOnline}
              className={`font-bold text-xs gap-2 rounded-xl transition-all ${
                wallet.isOnline
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-border text-muted-foreground"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  wallet.isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              {wallet.isOnline ? "Dispatch: ONLINE" : "Dispatch: OFFLINE"}
            </Button>

            <Button
              onClick={() => setTopUpModalOpen(true)}
              className="font-bold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Top Up Credits</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Balance + 6-Month Intro Countdown + Eligibility */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Job Credit Balance */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Job Credit Balance</span>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="font-mono text-3xl font-extrabold text-foreground">
                ETB {wallet.jobCreditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Deducted @ 100 ETB per confirmed lead after intro period
              </p>
            </div>
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status:</span>
              {wallet.canAcceptJobs ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  Eligible for Dispatch
                </Badge>
              ) : (
                <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] gap-1 font-semibold">
                  <AlertCircle className="h-3 w-3" />
                  Top-Up Required
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: 6-Month Free Launch Period Countdown */}
        <Card className="border-primary/30 bg-primary/5 shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-primary">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                6-Month Free Intro Access
              </span>
              <Clock className="h-4 w-4 text-primary" />
            </div>

            {wallet.isIntroductoryActive ? (
              <div className="space-y-1">
                <div className="font-mono text-3xl font-extrabold text-primary">
                  {wallet.daysRemainingInIntro} <span className="text-base font-medium">Days Left</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  All buyer visits and truck delivery assignments are <strong>100% free</strong>. Zero lead fees deducted.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-base font-bold text-foreground">Intro Period Concluded</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Standard prepaid 100 ETB per accepted lead applies. Top up credits to accept assignments.
                </p>
              </div>
            )}

            <div className="pt-1 text-[11px] text-muted-foreground font-mono">
              Valid until:{" "}
              {wallet.introductoryEndsAt
                ? new Date(wallet.introductoryEndsAt).toLocaleDateString()
                : "Active"}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Fair Dispute & Lead Guarantee */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Dispute Protection</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-foreground">100% Credit Refund</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If an assigned contractor is unreachable or the request was fraudulent, flag it on the Leads page to receive an immediate 100 ETB credit refund.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/agent/leads"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>View My Leads & Assignments</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Ledger */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/15 p-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Transaction History & Ledger</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit record of top-up deposits, per-lead assignment fees, and dispute refunds
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {wallet.transactions.length} Records
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {wallet.transactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Wallet className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground">No transactions recorded yet.</p>
              <p className="text-[11px] max-w-sm mx-auto">
                During your 6-month free introductory period, assignments are zero-rated. Top-up deposits and fee deductions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/40 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3.5 pl-5">Date</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5 text-right pr-5">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {wallet.transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3.5 pl-5 text-muted-foreground font-mono text-[11px]">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3.5">{getTxTypeBadge(tx.type, tx.amount)}</td>
                        <td className="p-3.5 font-mono text-xs font-semibold text-foreground">
                          {tx.referenceCode || tx.leadId || "—"}
                        </td>
                        <td className="p-3.5 text-muted-foreground max-w-xs truncate text-[11px]">
                          {tx.notes || "—"}
                        </td>
                        <td
                          className={`p-3.5 pr-5 text-right font-mono font-bold text-xs ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {isPositive ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} ETB
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

      {/* Top-Up Deposit Modal */}
      <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Wallet className="h-5 w-5 text-primary" />
              <span>Top Up Job Credits</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deposit prepaid credits via Telebirr or CBE to accept buyer leads post-introductory period.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTopUpSubmit} className="space-y-4 pt-2">
            {/* Amount Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">Select Deposit Amount (ETB)</Label>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all ${
                      topUpAmount === amt
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    {amt.toLocaleString()} ETB
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TELEBIRR")}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    paymentMethod === "TELEBIRR"
                      ? "border-primary bg-primary/10 ring-1 ring-primary text-foreground font-bold"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <div className="text-xs font-bold text-foreground">Telebirr (ቴሌብር)</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">0911 234 567</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CBE_TRANSFER")}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    paymentMethod === "CBE_TRANSFER"
                      ? "border-primary bg-primary/10 ring-1 ring-primary text-foreground font-bold"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <div className="text-xs font-bold text-foreground">CBE Bank (ንግድ ባንክ)</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">1000 1234 5678</div>
                </button>
              </div>
            </div>

            {/* Account Instruction Callout */}
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1 border border-border/60">
              <div className="font-semibold text-foreground">Transfer Instructions:</div>
              {paymentMethod === "TELEBIRR" ? (
                <p>
                  Send <strong>ETB {topUpAmount.toLocaleString()}</strong> to Telebirr merchant account{" "}
                  <strong className="font-mono text-foreground">0911 234 567</strong> (ConMart Trading Tech), then paste your transaction code below.
                </p>
              ) : (
                <p>
                  Deposit <strong>ETB {topUpAmount.toLocaleString()}</strong> to CBE Account{" "}
                  <strong className="font-mono text-foreground">1000 1234 5678</strong> (ConMart Trade Network), then enter your transfer reference code below.
                </p>
              )}
            </div>

            {/* Reference Code Input */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-ref" className="text-xs font-bold">
                Transaction Reference Code (የግብይት ቁጥር) *
              </Label>
              <Input
                id="tx-ref"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="e.g. TB987456123 or CBE12345678"
                className="text-xs font-mono uppercase"
              />
            </div>

            {topUpError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{topUpError}</span>
              </div>
            )}

            {topUpSuccess && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{topUpSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTopUpModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingTopUp}
                className="font-bold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submittingTopUp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying Deposit...</span>
                  </>
                ) : (
                  <span>Submit Deposit</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
