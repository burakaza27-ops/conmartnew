// =============================================================================
// ConMart — 01B Admin Agent Review & Approval Workspace (Screen 5)
// =============================================================================

"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
  MapPin,
  Building2,
  UserCheck,
  Check,
  Loader2,
  AlertTriangle,
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
import { AgentApprovalStatus } from "@prisma/client";

export interface AgentApplicationRecord {
  id: string;
  userId?: string;
  approvalStatus: AgentApprovalStatus;
  serviceArea?: string | null;
  subCity?: string | null;
  travelRadiusKm?: number | null;
  availableDaysHours?: string | null;
  experienceYears?: number | null;
  notes?: string | null;
  rejectionReason?: string | null;
  grade12DocUrl?: string | null;
  identityDocUrl?: string | null;
  guarantorDocUrl?: string | null;
  guarantorLetterDocUrl?: string | null;
  guarantorConsentObtained?: boolean | null;
  guarantorName?: string | null;
  guarantorPhone?: string | null;
  guarantorEmployer?: string | null;
  guarantorDescription?: string | null;
  checklistPhoneVerified?: boolean | null;
  checklistGrade12Reviewed?: boolean | null;
  checklistIdentityReviewed?: boolean | null;
  checklistGuaranteeVerified?: boolean | null;
  checklistAreaConfirmed?: boolean | null;
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

type ChecklistKey = "phone" | "grade12" | "id" | "guarantee" | "area";

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

  // Checklist state per application ID
  const [checklists, setChecklists] = useState<
    Record<
      string,
      {
        phone: boolean;
        grade12: boolean;
        id: boolean;
        guarantee: boolean;
        area: boolean;
      }
    >
  >(() => {
    const map: Record<string, { phone: boolean; grade12: boolean; id: boolean; guarantee: boolean; area: boolean }> = {};
    for (const app of initialApplications) {
      map[app.id] = {
        phone: app.checklistPhoneVerified || false,
        grade12: app.grade12DocUrl ? true : app.checklistGrade12Reviewed || false,
        id: app.identityDocUrl ? true : app.checklistIdentityReviewed || false,
        guarantee: app.guarantorConsentObtained || app.checklistGuaranteeVerified || false,
        area: app.checklistAreaConfirmed || false,
      };
    }
    return map;
  });

  const toggleChecklist = (appId: string, key: "phone" | "grade12" | "id" | "guarantee" | "area") => {
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
      const matchArea = app.serviceArea?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchArea) return false;
    }
    return true;
  });

  const handleApprove = async (app: AgentApplicationRecord) => {
    setLoadingAppId(app.id);
    setErrorMessage(null);
    try {
      const currentChecklist = checklists[app.id] || {};
      const res = await reviewAgentApplicationAction({
        agentProfileId: app.id,
        action: "APPROVE",
        checklistPhoneVerified: currentChecklist.phone ?? true,
        checklistGrade12Reviewed: currentChecklist.grade12 ?? true,
        checklistIdentityReviewed: currentChecklist.id ?? true,
        checklistGuaranteeVerified: currentChecklist.guarantee ?? true,
        checklistAreaConfirmed: currentChecklist.area ?? true,
      });

      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, approvalStatus: AgentApprovalStatus.APPROVED } : a))
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
      const currentChecklist = checklists[reviewModalApp.id] || {};
      const res = await reviewAgentApplicationAction({
        agentProfileId: reviewModalApp.id,
        action: modalAction,
        rejectionReason: actionReason,
        checklistPhoneVerified: currentChecklist.phone,
        checklistGrade12Reviewed: currentChecklist.grade12,
        checklistIdentityReviewed: currentChecklist.id,
        checklistGuaranteeVerified: currentChecklist.guarantee,
        checklistAreaConfirmed: currentChecklist.area,
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
              CONMART 01B • SCREEN 5
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
            CONMART reviews applicant documents, performs 5-point verification, and confirms service areas.
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
              grade12: false,
              id: false,
              guarantee: false,
              area: false,
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">{app.user?.name}</h3>
                        {getStatusBadge(app.approvalStatus)}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {app.user?.phone} • {app.user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="gap-1 font-mono text-primary border-primary/30">
                      <MapPin className="h-3 w-3" />
                      {app.serviceArea || app.subCity || "Addis Ababa"} ({app.travelRadiusKm || 5} km radius)
                    </Badge>
                  </div>
                </div>

                {/* Content Grid: Checklist + Documents + Guarantor */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Column 1: Screen 5 Admin Review Checklist */}
                  <div className="space-y-3">
                    <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider block">
                      Admin Review Checklist
                    </span>

                    <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/60">
                      {[
                        { key: "phone", label: "Phone verified" },
                        { key: "grade12", label: "Grade 12 evidence reviewed" },
                        { key: "id", label: "Identity reviewed" },
                        { key: "guarantee", label: "Guarantee verified" },
                        { key: "area", label: "Service area confirmed" },
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
                      Uploaded Documents
                    </span>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-xs">Grade 12 Certificate</span>
                        </div>
                        {app.grade12DocUrl ? (
                          <a
                            href={app.grade12DocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Not provided</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-xs">National ID</span>
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
                          <span className="text-[10px] text-muted-foreground">Not provided</span>
                        )}
                      </div>

                      {app.guarantorDocUrl && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold text-xs">Guarantor Letter</span>
                          </div>
                          <a
                            href={app.guarantorDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Guarantor Details */}
                  <div className="space-y-3">
                    <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider block">
                      Guarantor Backing
                    </span>

                    <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5 text-xs">
                      <p className="font-bold text-foreground">
                        {app.guarantorName || "No guarantor named"}
                      </p>
                      <p className="font-mono text-muted-foreground">
                        {app.guarantorPhone || "—"}
                      </p>
                      {app.guarantorEmployer && (
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {app.guarantorEmployer}
                        </p>
                      )}
                      {app.guarantorDescription && (
                        <p className="text-muted-foreground italic text-[11px] pt-1">
                          &ldquo;{app.guarantorDescription}&rdquo;
                        </p>
                      )}
                      <div className="pt-1">
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          Consent Confirmed
                        </Badge>
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
