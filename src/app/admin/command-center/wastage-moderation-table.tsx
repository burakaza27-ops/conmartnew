"use client";

// =============================================================================
// Econ — Admin Command Center: Site Wastages Moderation Queue
// =============================================================================
// Enables operations admins to review guest photo submissions of reusable
// construction site wastages (wood, rebar scrap, surplus blocks) and approve
// them for instant publication to the buyer catalog, or reject them.
// =============================================================================

import React, { useState } from "react";
import Image from "next/image";
import {
  Recycle,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { moderateWastageAction } from "@/app/actions/wastage";
import type { SiteWastageItem } from "@/lib/data/wastage";
import { formatETB } from "@/lib/types";

interface WastageModerationTableProps {
  initialItems: SiteWastageItem[];
}

export function WastageModerationTable({
  initialItems,
}: WastageModerationTableProps) {
  const [items, setItems] = useState<SiteWastageItem[]>(initialItems);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [activePhotoModal, setActivePhotoModal] = useState<{
    images: string[];
    index: number;
    title: string;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    if (filterStatus === "ALL") return true;
    return item.status === filterStatus;
  });

  const handleModerate = async (wastageId: string, status: "APPROVED" | "REJECTED") => {
    setLoadingId(wastageId);
    setActionError(null);

    const res = await moderateWastageAction({
      wastageId,
      status,
    });

    setLoadingId(null);

    if (!res.success) {
      setActionError(res.error || "Failed to update status.");
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === wastageId ? { ...item, status } : item
      )
    );
  };

  const pendingCount = items.filter((i) => i.status === "PENDING").length;

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Recycle className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Site Wastages Moderation Queue</span>
            {pendingCount > 0 && (
              <Badge className="bg-amber-600 text-white text-[10px] font-mono">
                {pendingCount} Pending Review
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review guest photo listings from site foremen (scrap rebar, timber, blocks). Approved items appear directly on the buyer catalog.
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 text-xs shrink-0">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                filterStatus === st
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st === "PENDING" && `Pending (${items.filter((i) => i.status === "PENDING").length})`}
              {st === "APPROVED" && `Approved (${items.filter((i) => i.status === "APPROVED").length})`}
              {st === "REJECTED" && `Rejected (${items.filter((i) => i.status === "REJECTED").length})`}
              {st === "ALL" && `All (${items.length})`}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {actionError && (
          <div className="m-4 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-muted-foreground">
            <Recycle className="size-8 mx-auto opacity-40" />
            <p className="text-xs font-medium">
              No site wastage submissions found for filter &quot;{filterStatus}&quot;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Photo & Material Specs */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    onClick={() =>
                      setActivePhotoModal({
                        images:
                          item.images && item.images.length > 0
                            ? item.images
                            : [item.imageUrl],
                        index: 0,
                        title: item.title,
                      })
                    }
                    className="relative size-16 sm:size-20 rounded-xl overflow-hidden border border-border/80 bg-muted shrink-0 cursor-pointer group shadow-2xs"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="80px"
                    />
                    {item.images && item.images.length > 1 && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white font-mono z-10">
                        +{item.images.length - 1}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="size-4" />
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground truncate max-w-md">
                        {item.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-mono font-bold ${
                          item.status === "PENDING"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : item.status === "APPROVED"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {item.quantity} {item.unit}
                      </span>
                      <span>·</span>
                      <span className="font-mono font-bold text-primary">
                        {item.askingPrice > 0 ? formatETB(item.askingPrice) : "Negotiable"}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-muted-foreground truncate">
                        <MapPin className="size-3 text-primary shrink-0" />
                        {item.location}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                        {item.description}
                      </p>
                    )}

                    {/* Submitter contact details */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="size-3 text-muted-foreground" />
                        {item.contactName}
                      </span>
                      <a
                        href={`tel:${item.contactPhone.replace(/\s+/g, "")}`}
                        className="flex items-center gap-1 font-mono font-bold text-primary hover:underline"
                      >
                        <Phone className="size-3" />
                        {item.contactPhone}
                      </a>
                      <span className="text-[10px]" suppressHydrationWarning>
                        Submitted {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                  {item.status === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(item.id, "REJECTED")}
                        disabled={loadingId === item.id}
                        className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                      >
                        <XCircle className="size-3.5 mr-1" />
                        <span>Reject</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleModerate(item.id, "APPROVED")}
                        disabled={loadingId === item.id}
                        className="text-xs font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {loadingId === item.id ? (
                          <Loader2 className="size-3.5 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="size-3.5 mr-1" />
                        )}
                        <span>Approve &amp; Publish</span>
                      </Button>
                    </>
                  ) : item.status === "APPROVED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerate(item.id, "REJECTED")}
                      disabled={loadingId === item.id}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <span>Unpublish / Reject</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerate(item.id, "APPROVED")}
                      disabled={loadingId === item.id}
                      className="text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <span>Re-Approve</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Full photo preview lightbox */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] w-full flex flex-col rounded-2xl overflow-hidden bg-card border border-border shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold text-foreground truncate">
                  {activePhotoModal.title}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Photo {activePhotoModal.index + 1} of {activePhotoModal.images.length}
                </p>
              </div>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full h-[60vh] bg-black/90 flex items-center justify-center">
              <Image
                src={activePhotoModal.images[activePhotoModal.index] || activePhotoModal.images[0]}
                alt="Site Wastage Photo"
                fill
                className="object-contain"
              />

              {activePhotoModal.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              index:
                                (prev.index - 1 + prev.images.length) %
                                prev.images.length,
                            }
                          : null
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors shadow-md text-xl"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              index: (prev.index + 1) % prev.images.length,
                            }
                          : null
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors shadow-md text-xl"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
