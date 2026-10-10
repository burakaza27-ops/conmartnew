// =============================================================================
// ConMart — Admin Subscription Approval & Pricing Management View
// =============================================================================
// Allows administrators to:
// 1. Review and verify incoming offline/mobile subscription payments (Telebirr/CBE).
// 2. Approve payments, automatically setting supplier ACTIVE status and 30-day expiry.
// 3. Reject invalid or duplicate references with notes.
// 4. Update subscription plan pricing and feature sets.
// =============================================================================

"use client";

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Phone,
  Building2,
  Calendar,
  ExternalLink,
  Edit,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  reviewSubscriptionPaymentAction,
  updateSubscriptionPlanAction,
} from "@/app/actions/subscription";
import { SubscriptionTier, PaymentMethod, WalletTxStatus } from "@prisma/client";

export interface PendingPaymentItem {
  id: string;
  sellerId: string;
  sellerName: string;
  companyName: string;
  sellerPhone: string;
  tier: SubscriptionTier;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceCode: string;
  slipUrl?: string | null;
  status: WalletTxStatus;
  createdAt: string;
}

export interface AdminPlanItem {
  id: string;
  tier: SubscriptionTier;
  name: string;
  priceETB: number;
  durationDays: number;
  description: string;
  features: string[];
}

interface AdminSubscriptionsViewProps {
  initialPayments: PendingPaymentItem[];
  initialPlans: AdminPlanItem[];
}

export function AdminSubscriptionsView({
  initialPayments,
  initialPlans,
}: AdminSubscriptionsViewProps) {
  const { locale } = useLanguage();
  const [payments, setPayments] = useState(initialPayments);
  const [plans, setPlans] = useState(initialPlans);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reject modal
  const [rejectingPayment, setRejectingPayment] = useState<PendingPaymentItem | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Plan Edit modal
  const [editingPlan, setEditingPlan] = useState<AdminPlanItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(30);
  const [editDescription, setEditDescription] = useState("");

  const handleApprove = async (paymentId: string) => {
    setActionLoadingId(paymentId);
    setActionError(null);
    try {
      const res = await reviewSubscriptionPaymentAction({
        paymentId,
        approved: true,
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      }
    } catch {
      setActionError("Failed to approve payment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;

    setActionLoadingId(rejectingPayment.id);
    setActionError(null);
    try {
      const res = await reviewSubscriptionPaymentAction({
        paymentId: rejectingPayment.id,
        approved: false,
        notes: rejectNotes.trim() || "Rejected by administrator",
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setPayments((prev) => prev.filter((p) => p.id !== rejectingPayment.id));
        setRejectingPayment(null);
        setRejectNotes("");
      }
    } catch {
      setActionError("Failed to reject payment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenEditPlan = (plan: AdminPlanItem) => {
    setEditingPlan(plan);
    setEditPrice(plan.priceETB);
    setEditDuration(plan.durationDays);
    setEditDescription(plan.description);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setActionLoadingId(editingPlan.id);
    setActionError(null);
    try {
      const res = await updateSubscriptionPlanAction({
        planId: editingPlan.id,
        data: {
          priceETB: editPrice,
          durationDays: editDuration,
          description: editDescription,
        },
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? { ...p, priceETB: editPrice, durationDays: editDuration, description: editDescription }
              : p
          )
        );
        setEditingPlan(null);
      }
    } catch {
      setActionError("Failed to update plan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-primary" />
          {locale === "am" ? "የአቅራቢዎች ደንበኝነት ማረጋገጫ" : "Supplier Subscriptions & Approvals"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {locale === "am"
            ? "በቴሌብር ወይም በባንክ የተላኩ ክፍያዎችን ያረጋግጡ፤ ዋጋዎችን እና የአገልግሎት ጥቅሎችን ያስተዳድሩ።"
            : "Review submitted supplier subscription payments and manage platform tier pricing."}
        </p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Pending Payments Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Pending Approvals</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {payments.length}
            </Badge>
          </h2>
        </div>

        <Card className="border-border/80 shadow-xs overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No pending subscription payments to review. All submissions are up to date!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Supplier</TableHead>
                    <TableHead className="text-xs font-semibold">Tier Requested</TableHead>
                    <TableHead className="text-xs font-semibold">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Reference Code</TableHead>
                    <TableHead className="text-xs font-semibold">Submitted</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const isLoading = actionLoadingId === p.id;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">
                          <span className="font-bold text-foreground block">
                            {p.companyName || p.sellerName}
                          </span>
                          <a
                            href={`tel:${p.sellerPhone.replace(/\s+/g, "")}`}
                            className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="h-3 w-3" />
                            {p.sellerPhone}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold">
                            {p.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {formatETB(p.amount, locale)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {p.paymentMethod.replace("_", " ")}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          <span>{p.referenceCode}</span>
                          {p.slipUrl && (
                            <a
                              href={p.slipUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary flex items-center gap-1 hover:underline mt-0.5"
                            >
                              <span>View Slip</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleApprove(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-2.5"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              <span>Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isLoading}
                              onClick={() => setRejectingPayment(p)}
                              className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Subscription Plans Pricing Manager */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Subscription Tier Pricing Configuration
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure default ETB prices and durations for Basic, Premium, and Featured tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="border-border/80 bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                  <span className="font-mono text-xs text-muted-foreground">Tier: {plan.tier}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEditPlan(plan)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
              </div>

              <div>
                <span className="font-mono text-2xl font-black text-foreground">
                  {formatETB(plan.priceETB, locale)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  / {plan.durationDays} Days
                </span>
              </div>

              <p className="text-xs text-muted-foreground">{plan.description}</p>

              <div className="space-y-1.5 border-t border-border/40 pt-3">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Reject Payment Modal */}
      <Dialog open={Boolean(rejectingPayment)} onOpenChange={() => setRejectingPayment(null)}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject Subscription Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide a reason for rejecting this transaction (e.g. invalid transaction code, transfer not received).
            </DialogDescription>
          </DialogHeader>

          {rejectingPayment && (
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <p><strong>Supplier: </strong> {rejectingPayment.companyName || rejectingPayment.sellerName}</p>
                <p><strong>Reference: </strong> {rejectingPayment.referenceCode}</p>
                <p><strong>Amount: </strong> {formatETB(rejectingPayment.amount, locale)}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rejectNotes" className="text-xs font-semibold">
                  Reason for Rejection *
                </Label>
                <Textarea
                  id="rejectNotes"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g. Reference code not found on bank statement, payment amount mismatch..."
                  className="text-xs min-h-[70px]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRejectingPayment(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" className="font-bold">
                  Reject Payment
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={Boolean(editingPlan)} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit {editingPlan?.name} Plan Pricing
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update monthly cost in ETB and validity duration.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="editPrice" className="text-xs font-semibold">
                  Price (ETB) *
                </Label>
                <Input
                  id="editPrice"
                  type="number"
                  min="0"
                  step="50"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editDuration" className="text-xs font-semibold">
                  Duration (Days) *
                </Label>
                <Input
                  id="editDuration"
                  type="number"
                  min="1"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editDescription" className="text-xs font-semibold">
                  Plan Description
                </Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
