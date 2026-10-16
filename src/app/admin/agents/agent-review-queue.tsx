// =============================================================================
// ECON — 01B Admin Agent Review & Approval Workspace (Screen 5)
// =============================================================================

"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
  MapPin,
  UserCheck,
  Check,
  Loader2,
  Truck,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { reviewAgentApplicationAction } from "@/app/actions/agents";
import { AgentApprovalStatus, Prisma } from "@prisma/client";

export interface AgentApplicationRecord {
  id: string;
  userId?: string;
  approvalStatus: AgentApprovalStatus;
  serviceArea?: string | null;
  subCity?: string | null;
  marketplaceHub?: string | null;
  serviceType?: string | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  isOnline?: boolean | null;
  introductoryEndsAt?: string | Date | null;
  jobCreditBalance?: Prisma.Decimal | number | string | null;
  travelRadiusKm?: number | null;
  availableDaysHours?: string | null;
  experienceYears?: number | null;
  notes?: string | null;
  rejectionReason?: string | null;
  identityDocUrl?: string | null;
  drivingLicenseDocUrl?: string | null;
  vehicleLibreDocUrl?: string | null;
  photoUrl?: string | null;
  grade12DocUrl?: string | null;
  guarantorDocUrl?: string | null;
  guarantorLetterDocUrl?: string | null;
  guarantorConsentObtained?: boolean | null;
  guarantorName?: string | null;
  guarantorPhone?: string | null;
  guarantorEmployer?: string | null;
  guarantorDescription?: string | null;
  checklistPhoneVerified?: boolean | null;
  checklistIdentityReviewed?: boolean | null;
  checklistLicenseReviewed?: boolean | null;
  checklistLibreReviewed?: boolean | null;
  checklistAreaConfirmed?: boolean | null;
  checklistGrade12Reviewed?: boolean | null;
  checklistGuaranteeVerified?: boolean | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  reviewedAt?: string | Date | null;
  user?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  tier?: {
    name?: string;
  } | null;
}

type ChecklistKey = "phone" | "id" | "license" | "libre" | "hub";

interface AgentReviewQueueProps {
  initialApplications: AgentApplicationRecord[];
}

export function AgentReviewQueue({ initialApplications }: AgentReviewQueueProps) {
  const [applications, setApplications] = useState<AgentApplicationRecord[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const [reviewModalApp, setReviewModalApp] = useState<AgentApplicationRecord | null>(null);
  const [modalAction, setModalAction] = useState<"REQUEST_CORRECTION" | "REJECT" | "SUSPEND">("REQUEST_CORRECTION");
  const [actionReason, setActionReason] = useState("");
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 5-Point Vetting Checklist state per application ID:
  // 1. Phone Verified
  // 2. Kebele / National ID Reviewed
  // 3. Driver's License Reviewed (for transport)
  // 4. Vehicle Libre Reviewed (for transport)
  // 5. Marketplace Hub Confirmed
  const [checklists, setChecklists] = useState<
    Record<
      string,
      {
        phone: boolean;
        id: boolean;
        license: boolean;
        libre: boolean;
        hub: boolean;
      }
    >
  >(() => {
    const map: Record<string, { phone: boolean; id: boolean; license: boolean; libre: boolean; hub: boolean }> = {};
    for (const app of initialApplications) {
      map[app.id] = {
        phone: app.checklistPhoneVerified ?? false,
        id: app.identityDocUrl ? true : (app.checklistIdentityReviewed ?? false),
        license: app.drivingLicenseDocUrl ? true : (app.checklistLicenseReviewed ?? false),
        libre: app.vehicleLibreDocUrl ? true : (app.checklistLibreReviewed ?? false),
        hub: app.checklistAreaConfirmed ?? true,
      };
    }
    return map;
  });

  const toggleChecklist = (appId: string, key: ChecklistKey) => {
    setChecklists((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        [key]: !prev[appId]?.[key],
      },
    }));
  };

  const filtered = applications.filter((app) => {
    if (statusFilter !== "ALL" && app.approvalStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = app.user?.name?.toLowerCase().includes(q);
      const matchPhone = app.user?.phone?.includes(q);
      const matchHub = app.marketplaceHub?.toLowerCase().includes(q);
      const matchArea = app.serviceArea?.toLowerCase().includes(q);
      const matchPlate = app.vehiclePlateNumber?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchHub && !matchArea && !matchPlate) return false;
    }
    return true;
  });

  const handleApprove = async (app: AgentApplicationRecord) => {
    setLoadingAppId(app.id);
    setErrorMessage(null);
    try {
      const currentChecklist = checklists[app.id] || {
        phone: true,
        id: true,
        license: true,
        libre: true,
        hub: true,
      };
      const res = await reviewAgentApplicationAction({
        agentProfileId: app.id,
        action: "APPROVE",
        checklistPhoneVerified: currentChecklist.phone ?? true,
        checklistIdentityReviewed: currentChecklist.id ?? true,
        checklistLicenseReviewed: currentChecklist.license ?? true,
        checklistLibreReviewed: currentChecklist.libre ?? true,
        checklistAreaConfirmed: currentChecklist.hub ?? true,
      });

      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, approvalStatus: AgentApprovalStatus.APPROVED, isOnline: true } : a))
        );
      }
    } catch {
      setErrorMessage("Failed to approve agent application.");
    } finally {
      setLoadingAppId(null);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalApp) return;

    setLoadingAppId(reviewModalApp.id);
    setErrorMessage(null);
    try {
      const currentChecklist = checklists[reviewModalApp.id] || {
        phone: false,
        id: false,
        license: false,
        libre: false,
        hub: false,
      };
      const res = await reviewAgentApplicationAction({
        agentProfileId: reviewModalApp.id,
        action: modalAction,
        rejectionReason: actionReason,
        checklistPhoneVerified: currentChecklist.phone,
        checklistIdentityReviewed: currentChecklist.id,
        checklistLicenseReviewed: currentChecklist.license,
        checklistLibreReviewed: currentChecklist.libre,
        checklistAreaConfirmed: currentChecklist.hub,
      });

      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        let newStatus: AgentApprovalStatus = AgentApprovalStatus.CHANGES_REQUIRED;
        if (modalAction === "REJECT") newStatus = AgentApprovalStatus.REJECTED;
        if (modalAction === "SUSPEND") newStatus = AgentApprovalStatus.SUSPENDED;

        setApplications((prev) =>
          prev.map((a) =>
            a.id === reviewModalApp.id
              ? { ...a, approvalStatus: newStatus, rejectionReason: actionReason }
              : a
          )
        );
        setReviewModalApp(null);
        setActionReason("");
      }
    } catch {
      setErrorMessage("Failed to update application review status.");
    } finally {
      setLoadingAppId(null);
    }
  };

  const getStatusBadge = (status: AgentApprovalStatus) => {
    switch (status) {
      case AgentApprovalStatus.SUBMITTED:
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-500/30 bg-blue-500/5">
            Submitted
          </Badge>
        );
      case AgentApprovalStatus.UNDER_REVIEW:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5">
            Under Review
          </Badge>
        );
      case AgentApprovalStatus.APPROVED:
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
            Approved
          </Badge>
        );
      case AgentApprovalStatus.CHANGES_REQUIRED:
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-500/30 bg-purple-500/5">
            Changes Required
          </Badge>
        );
      case AgentApprovalStatus.REJECTED:
        return (
          <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">
            Rejected
          </Badge>
        );
      case AgentApprovalStatus.SUSPENDED:
        return (
          <Badge variant="outline" className="text-rose-600 border-rose-500/30 bg-rose-500/5">
            Suspended
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 01B Screen 5 Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-black tracking-widest text-primary uppercase">
              ECON 01B • SCREEN 5
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs font-semibold text-muted-foreground">
              Admin Review & Approval
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Agent Application Vetting Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            ECON reviews applicant documents, performs 5-point verification, and confirms service areas.
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-bold rounded-full w-fit">
          Review & Approval Workspace
        </Badge>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-1">
          {[
            { id: "ALL", label: "All Applicants" },
            { id: AgentApprovalStatus.UNDER_REVIEW, label: "Under Review" },
            { id: AgentApprovalStatus.SUBMITTED, label: "Submitted" },
            { id: AgentApprovalStatus.CHANGES_REQUIRED, label: "Changes Required" },
            { id: AgentApprovalStatus.APPROVED, label: "Approved" },
            { id: AgentApprovalStatus.REJECTED, label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicant name, phone, area..."
            className="pl-8 text-xs"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <Card className="border-border/80 p-12 text-center text-xs text-muted-foreground">
            No agent applications matching current filters.
          </Card>
        ) : (
          filtered.map((app) => {
            const cl = checklists[app.id] || {
              phone: false,
              id: false,
              license: false,
              libre: false,
              hub: false,
            };
            const isLoading = loadingAppId === app.id;

            return (
              <Card
                key={app.id}
                className="border-border/80 bg-card shadow-xs overflow-hidden divide-y divide-border/40"
              >
                {/* Header Row */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                      {app.user?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-foreground">{app.user?.name}</h3>
                        {getStatusBadge(app.approvalStatus)}
                        <Badge
                          variant="outline"
                          className="font-bold text-xs bg-primary/10 text-primary border-primary/30 gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          Hub: {app.marketplaceHub || "Megenagna"}
                        </Badge>
                        {app.isOnline ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Offline
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {app.user?.phone} • {app.user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="secondary" className="gap-1 font-mono text-[11px]">
                      <Truck className="h-3 w-3" />
                      {app.vehicleType || "FOOT / RUNNER"}
                      {app.vehiclePlateNumber ? ` (${app.vehiclePlateNumber})` : ""}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      {app.serviceType || "BOTH"}
                    </Badge>
                  </div>
                </div>

                {/* Content Grid: Checklist + Documents + Driver Hub Profile */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Column 1: Screen 5 Admin Review Checklist */}
                  <div className="space-y-3">
                    <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider block">
                      Admin Vetting Checklist (5-Point)
                    </span>

                    <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/60">
                      {[
                        { key: "phone", label: "Phone number verified" },
                        { key: "id", label: "Kebele / National ID reviewed" },
                        { key: "license", label: "Driver's License reviewed" },
                        { key: "libre", label: "Vehicle Libre confirmed" },
                        { key: "hub", label: `Marketplace Hub confirmed (${app.marketplaceHub || "Megenagna"})` },
                      ].map((item) => (
                        <label
                          key={item.key}
                          onClick={() => toggleChecklist(app.id, item.key as ChecklistKey)}
                          className="flex items-center gap-2.5 cursor-pointer select-none hover:text-foreground transition-colors"
                        >
                          <div
                            className={`size-4 rounded border flex items-center justify-center ${
                              cl[item.key as keyof typeof cl]
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-muted-foreground"
                            }`}
                          >
                            {cl[item.key as keyof typeof cl] && <Check className="h-3 w-3" />}
                          </div>
                          <span
                            className={`text-xs ${
                              cl[item.key as keyof typeof cl]
                                ? "font-semibold text-emerald-950 dark:text-emerald-300"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Uploaded Documents */}
                  <div className="space-y-3">
                    <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider block">
                      Verified Documents
                    </span>

                    <div className="space-y-2">
                      {/* Kebele ID */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-xs">Kebele / National ID</span>
                        </div>
                        {app.identityDocUrl ? (
                          <a
                            href={app.identityDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-destructive font-semibold">Missing</span>
                        )}
                      </div>

                      {/* Driver's License */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-xs">Driver&apos;s License</span>
                        </div>
                        {app.drivingLicenseDocUrl ? (
                          <a
                            href={app.drivingLicenseDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {app.vehicleType && app.vehicleType !== "NONE_FOOT" ? "Pending" : "N/A (Runner)"}
                          </span>
                        )}
                      </div>

                      {/* Vehicle Libre */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-xs">Vehicle Libre</span>
                        </div>
                        {app.vehicleLibreDocUrl ? (
                          <a
                            href={app.vehicleLibreDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {app.vehicleType && app.vehicleType !== "NONE_FOOT" ? "Pending" : "N/A (Runner)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Driver Profile & Hub Details */}
                  <div className="space-y-3">
                    <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider block">
                      Driver & Dispatch Profile
                    </span>

                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Assigned Marketplace Hub
                        </span>
                        <p className="font-bold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {app.marketplaceHub || "Megenagna"}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-border/40">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Service Capability
                        </span>
                        <p className="text-foreground font-medium">
                          {app.serviceType === "TRANSPORT_DELIVERY"
                            ? "Truck / Material Transport"
                            : app.serviceType === "SUPPLIER_ASSISTANCE"
                            ? "Supplier Finding & Pricing"
                            : "Material Finding + Transport Delivery"}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-border/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Intro Access:</span>
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          6-Month Free Intro
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground pt-0.5">
                        <span>Job Credits:</span>
                        <span className="font-mono font-bold text-foreground">
                          ETB {Number(app.jobCreditBalance?.toString() || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* If changes required or rejected: show reason */}
                {app.rejectionReason && (
                  <div className="p-4 bg-destructive/10 text-xs text-destructive border-t border-border/40">
                    <strong>Review Note / Feedback: </strong>
                    <span>{app.rejectionReason}</span>
                  </div>
                )}

                {/* Action Buttons Strip matching Screen 5 */}
                <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-card">
                  <div className="text-[11px] text-muted-foreground">
                    Hours: {app.availableDaysHours || "Standard business hours"}
                  </div>

                  <div className="flex items-center gap-2">
                    {app.approvalStatus !== AgentApprovalStatus.APPROVED && (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleApprove(app)}
                        className="font-bold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Approve Agent</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => {
                        setReviewModalApp(app);
                        setModalAction("REQUEST_CORRECTION");
                        setActionReason("");
                      }}
                      className="text-xs"
                    >
                      Request Correction
                    </Button>

                    {app.approvalStatus === AgentApprovalStatus.APPROVED && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => {
                          setReviewModalApp(app);
                          setModalAction("SUSPEND");
                          setActionReason("");
                        }}
                        className="text-xs text-rose-600 hover:bg-rose-500/10"
                      >
                        Suspend
                      </Button>
                    )}

                    {app.approvalStatus !== AgentApprovalStatus.REJECTED && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isLoading}
                        onClick={() => {
                          setReviewModalApp(app);
                          setModalAction("REJECT");
                          setActionReason("");
                        }}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Review Action Dialog */}
      <Dialog open={!!reviewModalApp} onOpenChange={(open) => !open && setReviewModalApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>
                {modalAction === "REQUEST_CORRECTION"
                  ? "Request Application Corrections"
                  : modalAction === "SUSPEND"
                  ? "Suspend Agent Privileges"
                  : "Reject Agent Application"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide feedback for {reviewModalApp?.user?.name || "applicant"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModalSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Reason / Instructions *</Label>
              <Textarea
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Explain what documents need re-uploading or why this action is being taken..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewModalApp(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loadingAppId === reviewModalApp?.id || !actionReason.trim()}
                className={
                  modalAction === "REJECT" || modalAction === "SUSPEND"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
              >
                {loadingAppId === reviewModalApp?.id && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                )}
                Submit Decision
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
