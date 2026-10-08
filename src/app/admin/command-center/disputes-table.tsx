"use client";

// =============================================================================
// ConMart — Admin Disputes Mediation Table
// =============================================================================
// Operations staff dashboard to review reported trade disputes, inspect
// claims, and resolve cases by either crediting 80% non-withdrawable wallet
// refund to the seller or closing without refund.
// =============================================================================

import React, { useState, useTransition } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building,
  User,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveDisputeAction } from "@/app/actions/enquiries";
import { formatETB } from "@/lib/types";

export interface DisputeItem {
  id: string;
  enquiryId: string;
  referenceCode: string;
  productTitle: string;
  raisedBy: string;
  claimType: string;
  description: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  buyerName: string;
  buyerPhone: string;
  sellerName: string;
  sellerCompany: string | null;
  sellerPhone: string;
  feeAmount: number;
}

interface DisputesTableProps {
  initialDisputes: DisputeItem[];
}

export function DisputesTable({ initialDisputes }: DisputesTableProps) {
  const [disputes, setDisputes] = useState<DisputeItem[]>(initialDisputes);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = disputes.filter((d) => {
    if (filter === "OPEN") return d.status === "OPEN" || d.status === "MEDIATING";
    if (filter === "RESOLVED") return d.status.startsWith("RESOLVED") || d.status === "CLOSED";
    return true;
  });

  const handleResolve = (status: "RESOLVED_SELLER_CREDIT" | "RESOLVED_NO_REFUND" | "CLOSED", grantRefund: boolean) => {
    if (!selectedDispute) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await resolveDisputeAction({
        disputeId: selectedDispute.id,
        status,
        resolutionNotes: resolutionNotes || `Case concluded by Admin: ${status}`,
        grantRefund,
      });

      if (res.success) {
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === selectedDispute.id
              ? {
                  ...d,
                  status,
                  resolutionNotes: resolutionNotes || `Case concluded: ${status}`,
                  resolvedAt: new Date().toISOString(),
                }
              : d
          )
        );
        setSuccessMsg(
          grantRefund
            ? "Dispute resolved with 80% non-withdrawable credit refunded to seller wallet."
            : "Dispute case concluded without wallet refund."
        );
        setSelectedDispute(null);
        setResolutionNotes("");
      } else {
        setErrorMsg(res.error || "Failed to resolve dispute.");
      }
    });
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Trade Dispute & Mediation Queue
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mediate trade claims (shortages, spec mismatches, non-delivery) between buyers and sellers.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(["ALL", "OPEN", "RESOLVED"] as const).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={filter === tab ? "default" : "outline"}
              onClick={() => setFilter(tab)}
              className="h-8 text-xs font-semibold"
            >
              {tab === "ALL" && `All (${disputes.length})`}
              {tab === "OPEN" && `Open (${disputes.filter((d) => d.status === "OPEN").length})`}
              {tab === "RESOLVED" && `Resolved (${disputes.filter((d) => d.status.startsWith("RESOLVED") || d.status === "CLOSED").length})`}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            No disputes found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Reference / Material</th>
                  <th className="p-3">Claim Type</th>
                  <th className="p-3">Raised By</th>
                  <th className="p-3">Counterparties</th>
                  <th className="p-3">Unlock Fee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((d) => {
                  const isOpen = d.status === "OPEN" || d.status === "MEDIATING";
                  return (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-foreground block">
                          #{d.referenceCode}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-sans line-clamp-1">
                          {d.productTitle}
                        </span>
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {d.claimType.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-foreground">
                          {d.raisedBy}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-3 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          <span className="font-medium text-foreground">
                            {d.buyerName}
                          </span>
                          <a href={`tel:${d.buyerPhone}`} className="text-[10px] text-muted-foreground hover:underline font-mono">
                            ({d.buyerPhone})
                          </a>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{d.sellerCompany}</span>
                          <a href={`tel:${d.sellerPhone}`} className="text-[10px] hover:underline font-mono">
                            ({d.sellerPhone})
                          </a>
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-foreground">
                        {formatETB(d.feeAmount)}
                      </td>

                      <td className="p-3">
                        {isOpen ? (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold gap-1">
                            <Clock className="h-3 w-3" />
                            Open
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Resolved
                          </Badge>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDispute(d);
                            setResolutionNotes(d.resolutionNotes || "");
                          }}
                          className="h-7 text-xs font-semibold"
                        >
                          Review & Mediate
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mediation Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Dispute Mediation — #{selectedDispute.referenceCode}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedDispute.productTitle}
                  </p>
                </div>
                <Badge variant="outline" className="font-semibold text-xs uppercase">
                  {selectedDispute.claimType}
                </Badge>
              </div>

              {/* Dispute statement */}
              <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
                <span className="font-semibold text-muted-foreground block">
                  Claim statement from {selectedDispute.raisedBy}:
                </span>
                <p className="text-foreground leading-relaxed italic">
                  &ldquo;{selectedDispute.description}&rdquo;
                </p>
              </div>

              {/* Counterparties summary */}
              <div className="grid grid-cols-2 gap-3 text-xs rounded-lg border p-3">
                <div>
                  <span className="text-muted-foreground block font-medium">Buyer:</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedDispute.buyerName}</p>
                  <a href={`tel:${selectedDispute.buyerPhone}`} className="text-primary font-mono text-[11px] hover:underline">
                    {selectedDispute.buyerPhone}
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Seller:</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedDispute.sellerCompany}</p>
                  <a href={`tel:${selectedDispute.sellerPhone}`} className="text-primary font-mono text-[11px] hover:underline">
                    {selectedDispute.sellerPhone}
                  </a>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-foreground">
                  Operations Resolution Notes:
                </label>
                <Input
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g., Shortage confirmed by seller. 80% fee returned as credit."
                  className="text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDispute(null)}
                  disabled={isPending}
                  className="w-full sm:w-auto text-xs"
                >
                  Cancel
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve("RESOLVED_NO_REFUND", false)}
                  disabled={isPending}
                  className="w-full sm:w-auto text-xs"
                >
                  Close (No Refund)
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleResolve("RESOLVED_SELLER_CREDIT", true)}
                  disabled={isPending}
                  className="w-full sm:w-auto text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <RotateCcw className="h-3.5 w-3.5" />
                  Grant 80% Credit Refund
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
