// =============================================================================
// ECON — Admin Top-Up Deposit Approval Queue Component
// =============================================================================

"use client";

import React, { useState, useTransition } from "react";
import {
  Coins,
  CheckCircle2,
  Phone,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/i18n/translations";
import { approveTopUpAction, rejectTopUpAction } from "@/app/actions/wallet";

export interface PendingTopUpItem {
  id: string;
  amount: number;
  paymentMethod: string;
  referenceCode: string;
  slipUrl?: string | null;
  createdAt: string;
  sellerName: string;
  sellerCompany: string | null;
  sellerPhone: string;
  currentBalance: number;
}

interface TopUpsApprovalTableProps {
  initialTopUps: PendingTopUpItem[];
}

export function TopUpsApprovalTable({ initialTopUps }: TopUpsApprovalTableProps) {
  const [topUps, setTopUps] = useState<PendingTopUpItem[]>(initialTopUps);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (topUpId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await approveTopUpAction(topUpId);
      if (res.success) {
        setTopUps((prev) => prev.filter((t) => t.id !== topUpId));
        setSuccessMsg("Top-up request approved and seller cash balance credited.");
      } else {
        setErrorMsg(res.error || "Failed to approve top-up.");
      }
    });
  };

  const handleReject = (topUpId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await rejectTopUpAction(topUpId, "Verification failed or invalid deposit proof");
      if (res.success) {
        setTopUps((prev) => prev.filter((t) => t.id !== topUpId));
        setSuccessMsg("Top-up deposit request has been rejected.");
      } else {
        setErrorMsg(res.error || "Failed to reject top-up.");
      }
    });
  };

  return (
    <Card className="border-border shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Prepaid Deposit Verification Queue
            </CardTitle>
            <CardDescription>
              Verify Telebirr / CBE transaction references and approve deposits to credit seller wallets.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {topUps.length} Pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {topUps.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No pending top-up requests in the verification queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Seller / Company</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Reference Code</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Proof Slip</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {topUps.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs text-foreground">
                        {t.sellerCompany || t.sellerName}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Phone className="h-3 w-3" />
                        {t.sellerPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs font-mono font-medium">
                        {t.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-foreground whitespace-nowrap">
                      {t.referenceCode}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-primary whitespace-nowrap">
                      {formatPrice(t.amount, "en")}
                    </td>
                    <td className="py-3 px-4">
                      {t.slipUrl ? (
                        <a
                          href={t.slipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Slip
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No image</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(t.id)}
                          disabled={isPending}
                          className="h-8 gap-1 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(t.id)}
                          disabled={isPending}
                          className="h-8 gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Approve Deposit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
