"use client";

// =============================================================================
// ConMart — Seller Document Verification & Compliance Queue
// =============================================================================
// Platform operations queue to review business licenses, TIN numbers,
// VAT certificates, expiry status, and verify or suspend suppliers.
// =============================================================================

import React, { useState, useTransition } from "react";
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Ban,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateSellerVerificationAction } from "@/app/actions/sellers";
import { setSellerSubscriptionAction } from "@/app/actions/marketplace";
import { SellerVerificationStatus } from "@prisma/client";

export interface AdminSellerItem {
  id: string;
  name: string;
  phone: string;
  companyName: string;
  createdAt: string;
  profileId: string | null;
  sellerType: string;
  verificationStatus: string;
  licenseNumber: string | null;
  tinNumber: string | null;
  vatNumber: string | null;
  vatRegistered: boolean;
  licenseExpiry: string | null;
  tinExpiry: string | null;
  completedDealsCount: number;
  failedDealsCount: number;
  responseTimeAvgMinutes: number;
  listingCount: number;
  enquiryCount: number;
  cashBalance: number;
  creditBalance: number;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
}

interface SellerVerificationTableProps {
  initialSellers: AdminSellerItem[];
}

export function SellerVerificationTable({ initialSellers }: SellerVerificationTableProps) {
  const [sellers, setSellers] = useState<AdminSellerItem[]>(initialSellers);
  const [filter, setFilter] = useState<"ALL" | "UNVERIFIED" | "VERIFIED" | "SUSPENDED">("ALL");
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = sellers.filter((s) => {
    if (filter === "UNVERIFIED") return s.verificationStatus === "UNVERIFIED" || s.verificationStatus === "PENDING";
    if (filter === "VERIFIED") return s.verificationStatus === "VERIFIED";
    if (filter === "SUSPENDED") return s.verificationStatus === "SUSPENDED";
    return true;
  });

  const handleUpdateStatus = (profileId: string, newStatus: SellerVerificationStatus) => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await updateSellerVerificationAction({
        sellerProfileId: profileId,
        status: newStatus,
      });

      if (res.success) {
        setSellers((prev) =>
          prev.map((s) => (s.profileId === profileId ? { ...s, verificationStatus: newStatus } : s))
        );
        setStatusMsg({
          type: "success",
          text: `Supplier compliance status updated to ${newStatus}.`,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res.error || "Failed to update verification status.",
        });
      }
    });
  };

  const handleToggleSubscription = (profileId: string, current: string) => {
    const next = current === "ACTIVE" ? "FREE" : "ACTIVE";
    setStatusMsg(null);
    startTransition(async () => {
      const res = await setSellerSubscriptionAction({
        sellerProfileId: profileId,
        status: next,
      });
      if (res.success) {
        setSellers((prev) =>
          prev.map((s) =>
            s.profileId === profileId
              ? { ...s, subscriptionStatus: next, subscriptionExpiresAt: null }
              : s
          )
        );
        setStatusMsg({
          type: "success",
          text:
            next === "ACTIVE"
              ? "Direct chat unlocked for this supplier."
              : "Direct chat locked. Deals will route through local agents.",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res.error || "Failed to update subscription.",
        });
      }
    });
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Supplier Verification & Document Compliance
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit business licenses, TIN numbers, yard inspections, and prevent unverified or expired suppliers from trading.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(["ALL", "UNVERIFIED", "VERIFIED", "SUSPENDED"] as const).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={filter === tab ? "default" : "outline"}
              onClick={() => setFilter(tab)}
              className="h-8 text-xs font-semibold"
            >
              {tab === "ALL" && `All (${sellers.length})`}
              {tab === "UNVERIFIED" && `Pending (${sellers.filter((s) => s.verificationStatus !== "VERIFIED" && s.verificationStatus !== "SUSPENDED").length})`}
              {tab === "VERIFIED" && `Verified (${sellers.filter((s) => s.verificationStatus === "VERIFIED").length})`}
              {tab === "SUSPENDED" && `Suspended (${sellers.filter((s) => s.verificationStatus === "SUSPENDED").length})`}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {statusMsg && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 text-xs font-medium border ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            No suppliers found in this filter category.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Supplier / Depot</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">License & TIN</th>
                  <th className="p-3">Trade Record</th>
                  <th className="p-3">Prepaid Balance</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((s) => {
                  const licenseExpired = isExpired(s.licenseExpiry);
                  const failureRate =
                    s.completedDealsCount + s.failedDealsCount > 0
                      ? Math.round((s.failedDealsCount / (s.completedDealsCount + s.failedDealsCount)) * 100)
                      : 0;

                  return (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-bold text-foreground">{s.companyName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <span>{s.name}</span>
                          <span className="opacity-40">·</span>
                          <a href={`tel:${s.phone}`} className="font-mono hover:underline">
                            {s.phone}
                          </a>
                        </div>
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {s.sellerType}
                        </Badge>
                      </td>

                      <td className="p-3 space-y-1">
                        <div>
                          <span className="text-[10px] text-muted-foreground">TIN: </span>
                          <span className="font-mono font-medium">{s.tinNumber || "Not Provided"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">License: </span>
                          <span className="font-mono font-medium">{s.licenseNumber || "Pending"}</span>
                          {licenseExpired && (
                            <Badge className="bg-destructive/10 text-destructive text-[9px] font-bold border-destructive/20">
                              EXPIRED
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="p-3 space-y-0.5">
                        <div className="font-medium text-foreground">
                          {s.completedDealsCount} completed / {s.failedDealsCount} failed
                        </div>
                        {s.completedDealsCount + s.failedDealsCount > 0 && (
                          <div className={`text-[10px] font-semibold ${failureRate > 35 ? "text-destructive" : "text-emerald-600"}`}>
                            {failureRate}% failure rate
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {s.listingCount} active listings
                        </div>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="font-bold text-foreground">
                          {s.cashBalance.toLocaleString()} ETB
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          +{s.creditBalance.toLocaleString()} credit
                        </div>
                      </td>

                      <td className="p-3">
                        {s.verificationStatus === "VERIFIED" && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        {s.verificationStatus === "PENDING" && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold gap-1">
                            <Clock className="h-3 w-3" />
                            Pending Review
                          </Badge>
                        )}
                        {s.verificationStatus === "UNVERIFIED" && (
                          <Badge variant="outline" className="text-muted-foreground font-semibold gap-1">
                            Unverified
                          </Badge>
                        )}
                        {s.verificationStatus === "SUSPENDED" && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-semibold gap-1">
                            <Ban className="h-3 w-3" />
                            Suspended
                          </Badge>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {s.profileId && (
                          <div className="inline-flex items-center gap-1.5">
                            {s.verificationStatus !== "VERIFIED" && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={isPending}
                                onClick={() => handleUpdateStatus(s.profileId!, "VERIFIED")}
                                className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                Verify
                              </Button>
                            )}

                            {s.verificationStatus !== "SUSPENDED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleUpdateStatus(s.profileId!, "SUSPENDED")}
                                className="h-7 text-xs font-semibold text-destructive hover:bg-destructive/10"
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleUpdateStatus(s.profileId!, "UNVERIFIED")}
                                className="h-7 text-xs font-semibold"
                              >
                                Reinstate
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                handleToggleSubscription(s.profileId!, s.subscriptionStatus)
                              }
                              className="h-7 text-xs font-semibold"
                            >
                              {s.subscriptionStatus === "ACTIVE" ? "Lock chat" : "Unlock chat"}
                            </Button>
                          </div>
                        )}
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
  );
}
