// =============================================================================
// ECON — Commission Agent Guided Leads & 01B Dashboard View
// =============================================================================
// Implements the complete Yakob Dan 01B specification:
// 1. Screen 5: Applicant status holding view for agents UNDER_REVIEW.
// 2. Screen 6: Approved Agent Dashboard with service area, availability switch,
//    and nearby visit request cards with buyer phone privacy masking.
// 3. 5-stage assignment workflow: Assigned -> Guiding -> Delivered -> Closed.
// =============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  Phone,
  MapPin,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertCircle,
  Building2,
  Loader2,
  Lock,
  ShieldCheck,
  Check,
  Sparkles,
  FileEdit,
  Truck,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateGuidedLeadStatusAction } from "@/app/actions/leads";
import {
  toggleAgentOnlineStatusAction,
  acceptNearbyRequestAction,
  disputeLeadAssignmentAction,
} from "@/app/actions/agents";
import { GuidedLeadStatus, AgentApprovalStatus, Prisma } from "@prisma/client";
import { useLanguage } from "@/lib/i18n/language-context";

export interface GuidedLeadItem {
  id: string;
  referenceCode: string;
  materialNeeded: string;
  quantity: string;
  areaLocation: string;
  buyerPhone: string;
  isPhoneRevealed?: boolean;
  buyerName?: string | null;
  preferredVisitTime?: string | null;
  notes?: string | null;
  status: GuidedLeadStatus;
  closeReason?: string | null;
  targetSeller?: {
    id: string;
    name: string;
    companyName: string;
    phone: string;
  } | null;
  assignedAgent?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  createdAt: string;
}

export interface AgentProfileSummary {
  id?: string;
  isAvailableForAssignments?: boolean;
  isOnline?: boolean;
  marketplaceHub?: string | null;
  serviceType?: string | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  introductoryEndsAt?: string | Date | null;
  jobCreditBalance?: Prisma.Decimal | number | string | null;
  serviceArea?: string | null;
  approvalStatus?: AgentApprovalStatus | string;
  rejectionReason?: string | null;
  correctionNote?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  reviewedAt?: string | Date | null;
  travelRadiusKm?: number | null;
  availableDaysHours?: string | null;
  guarantorType?: string | null;
  guarantorName?: string | null;
  user?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

interface AgentLeadsViewProps {
  initialLeads: GuidedLeadItem[];
  currentAgentId: string;
  isAdmin?: boolean;
  agentProfile?: AgentProfileSummary | null;
}

export function AgentLeadsView({
  initialLeads,
  currentAgentId,
  isAdmin = false,
  agentProfile,
}: AgentLeadsViewProps) {
  const { locale } = useLanguage();
  const [leads, setLeads] = useState<GuidedLeadItem[]>(initialLeads);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  // Agent availability & real-time dispatch state
  const [isOnline, setIsOnline] = useState<boolean>(agentProfile?.isOnline ?? true);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Modals state
  const [deliveringLead, setDeliveringLead] = useState<GuidedLeadItem | null>(null);
  const [commissionFee, setCommissionFee] = useState<number>(200);
  const [visitOutcome, setVisitOutcome] = useState("");

  const [closingLead, setClosingLead] = useState<GuidedLeadItem | null>(null);
  const [closeReason, setCloseReason] = useState("");

  // Dispute modal state
  const [disputeModalLead, setDisputeModalLead] = useState<GuidedLeadItem | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Online / Offline Switch Toggle
  const handleToggleOnline = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    setTogglingOnline(true);
    setActionError(null);
    try {
      const res = await toggleAgentOnlineStatusAction(nextStatus);
      if (!res.success) {
        setIsOnline(!nextStatus);
        setActionError(res.error);
      }
    } catch {
      setIsOnline(!nextStatus);
      setActionError("Failed to update dispatch online status.");
    } finally {
      setTogglingOnline(false);
    }
  };

  // Dispute Submission
  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalLead || !disputeReason.trim()) return;
    setSubmittingDispute(true);
    setActionError(null);
    try {
      const res = await disputeLeadAssignmentAction({
        leadId: disputeModalLead.id,
        reason: disputeReason.trim(),
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setDisputeSuccessMsg(
          res.data.refunded
            ? "Dispute approved. 100 ETB has been refunded to your wallet."
            : "Dispute recorded. No fee was deducted under your 6-month free intro."
        );
        setTimeout(() => {
          setDisputeModalLead(null);
          setDisputeReason("");
          setDisputeSuccessMsg(null);
        }, 1500);
      }
    } catch {
      setActionError("Failed to submit dispute.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (activeTab !== "ALL" && lead.status !== activeTab) return false;
    if (areaFilter.trim() && !lead.areaLocation.toLowerCase().includes(areaFilter.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRef = lead.referenceCode.toLowerCase().includes(q);
      const matchMat = lead.materialNeeded.toLowerCase().includes(q);
      const matchPhone = lead.buyerPhone.includes(q);
      if (!matchRef && !matchMat && !matchPhone) return false;
    }
    return true;
  });

  // Nearby unassigned visit requests
  const nearbyRequests = leads.filter(
    (l) => l.status === GuidedLeadStatus.NEW && (!l.assignedAgent || l.assignedAgent.id !== currentAgentId)
  );

  // Claim / Accept assignment
  const handleAcceptRequest = async (leadId: string) => {
    setActionLoadingId(leadId);
    setActionError(null);
    try {
      const res = await acceptNearbyRequestAction(leadId);
      if (!res.success) {
        setActionError(res.error);
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  status: GuidedLeadStatus.ASSIGNED,
                  buyerPhone: res.data.buyerPhone,
                  isPhoneRevealed: true,
                  assignedAgent: { id: currentAgentId, name: "Me", phone: "" },
                }
              : l
          )
        );
      }
    } catch {
      setActionError("Failed to accept request. Please retry.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = (leadId: string) => {
    // Hide from local view
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const handleStartGuiding = async (leadId: string) => {
    setActionLoadingId(leadId);
    setActionError(null);
    try {
      const res = await updateGuidedLeadStatusAction({
        leadId,
        status: GuidedLeadStatus.GUIDING,
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: GuidedLeadStatus.GUIDING } : l))
        );
      }
    } catch {
      setActionError("Failed to update status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringLead) return;

    setActionLoadingId(deliveringLead.id);
    setActionError(null);
    try {
      const res = await updateGuidedLeadStatusAction({
        leadId: deliveringLead.id,
        status: GuidedLeadStatus.DELIVERED,
        commissionFee,
        visitOutcome: visitOutcome.trim() || undefined,
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === deliveringLead.id ? { ...l, status: GuidedLeadStatus.DELIVERED } : l
          )
        );
        setDeliveringLead(null);
        setVisitOutcome("");
      }
    } catch {
      setActionError("Failed to mark delivery.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingLead) return;

    if (!closeReason.trim()) {
      setActionError("A close reason is required.");
      return;
    }

    setActionLoadingId(closingLead.id);
    setActionError(null);
    try {
      const res = await updateGuidedLeadStatusAction({
        leadId: closingLead.id,
        status: GuidedLeadStatus.CLOSED,
        closeReason,
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === closingLead.id
              ? { ...l, status: GuidedLeadStatus.CLOSED, closeReason }
              : l
          )
        );
        setClosingLead(null);
        setCloseReason("");
      }
    } catch {
      setActionError("Failed to close lead.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: GuidedLeadStatus) => {
    switch (status) {
      case GuidedLeadStatus.NEW:
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-500/30 bg-blue-500/5">
            {locale === "am" ? "አዲስ ጥያቄ" : "New Request"}
          </Badge>
        );
      case GuidedLeadStatus.ASSIGNED:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5">
            {locale === "am" ? "ተመድቧል" : "Assigned"}
          </Badge>
        );
      case GuidedLeadStatus.GUIDING:
        return (
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
            {locale === "am" ? "በመመራት ላይ" : "Guiding"}
          </Badge>
        );
      case GuidedLeadStatus.DELIVERED:
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
            {locale === "am" ? "ጉብኝት ተጠናቋል" : "Visit Completed"}
          </Badge>
        );
      case GuidedLeadStatus.CLOSED:
        return (
          <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">
            {locale === "am" ? "የተዘጋ" : "Closed"}
          </Badge>
        );
    }
  };

  // ===========================================================================
  // SCREEN 5: APPLICANT HOLDING STATUS (When agent is not yet approved)
  // ===========================================================================
  const approvalStatus = agentProfile?.approvalStatus as AgentApprovalStatus | undefined;
  const isApproved = isAdmin || approvalStatus === AgentApprovalStatus.APPROVED;

  if (!isApproved) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-black tracking-widest text-primary uppercase">
                ECON 01B
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-muted-foreground">
                Agent Application Status
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {locale === "am" ? "የወኪል ማመልከቻ ሁኔታ" : "Agent Application Status"}
            </h1>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-bold rounded-full w-fit">
            Approval Required
          </Badge>
        </div>

        {/* If no profile yet: Prompt to apply */}
        {!agentProfile && (
          <Card className="border-border/80 p-8 text-center space-y-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <Sparkles className="size-7" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Complete Your Online Agent Application
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              To start receiving nearby buyer visit requests and earning commissions, submit your Grade 12
              credentials, service area, and guarantor details.
            </p>
            <Link href="/agent/apply">
              <Button className="font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <span>Start Agent Application</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        )}

        {/* Changes Required Notice */}
        {approvalStatus === AgentApprovalStatus.CHANGES_REQUIRED && (
          <Card className="border-amber-500/40 bg-amber-500/5 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Changes Required Before Approval
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {agentProfile?.rejectionReason ||
                    "Our verification team requested clarifications on your submitted documents or guarantor."}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/agent/apply">
                <Button className="text-xs font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                  <FileEdit className="h-3.5 w-3.5" />
                  <span>Update Application & Re-upload Documents</span>
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Rejected or Suspended Notice */}
        {(approvalStatus === AgentApprovalStatus.REJECTED ||
          approvalStatus === AgentApprovalStatus.SUSPENDED) && (
          <Card className="border-destructive/40 bg-destructive/5 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-destructive">
                  Application Status: {approvalStatus}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {agentProfile?.rejectionReason ||
                    "Your application was not approved or your agent privileges have been suspended. Please contact ECON support for assistance."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* APPLICANT STATUS: UNDER REVIEW HOLDING CARD */}
        {(approvalStatus === AgentApprovalStatus.SUBMITTED ||
          approvalStatus === AgentApprovalStatus.UNDER_REVIEW) && (
          <Card className="border border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/10">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Agent Credential Vetting & Compliance Clearance
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Official vetting against Kebele records, Grade 12 certificates, and guarantor confirmation.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Application Status Pipeline Tracker */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block font-mono">
                  Verification Pipeline
                </span>
                <div className="flex items-center justify-between gap-2 max-w-xl mx-auto py-2">
                  {[
                    { label: "Submitted", active: true, done: true },
                    { label: "Compliance Review", active: true, done: false, current: true },
                    { label: "Field Authorization", active: false, done: false },
                  ].map((step, idx) => (
                    <React.Fragment key={step.label}>
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all ${
                            step.done
                              ? "bg-primary text-primary-foreground"
                              : step.current
                              ? "border-2 border-primary bg-primary/20 text-primary ring-2 ring-primary/20"
                              : "border border-border text-muted-foreground bg-muted/30"
                          }`}
                        >
                          {step.done ? <Check className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium ${
                            step.current ? "font-bold text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${
                            step.done ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Status Notice */}
              <div className="rounded-xl border border-border/80 bg-muted/10 p-5 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0 border border-amber-500/20">
                  <Clock className="size-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-foreground">Application Under Compliance Review</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                    Your credentials and guarantor documents are being audited by ECON Operations. Field lead dispatch will activate immediately upon verification.
                  </p>
                </div>
              </div>

              {/* Application Details Summary */}
              <div className="rounded-xl border border-border/60 p-5 space-y-4 bg-card text-xs">
                <span className="font-bold text-foreground block border-b border-border/40 pb-2">
                  Submitted Profile Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-muted-foreground">
                  <div>
                    <span className="font-semibold block text-foreground">Service Area:</span>
                    <span>{agentProfile?.serviceArea || "Bole"} ({agentProfile?.travelRadiusKm || 5} km radius)</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-foreground">Guarantor Type:</span>
                    <span>
                      {agentProfile?.guarantorType === "GOVERNMENT_EMPLOYEE"
                        ? "Government Employee"
                        : "Community / Other"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-foreground">Guarantor Name:</span>
                    <span>{agentProfile?.guarantorName || "—"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link href="/agent/apply">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>Edit Application Details</span>
                    </Button>
                  </Link>
                  <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                    Submitted on {agentProfile?.createdAt ? new Date(agentProfile.createdAt).toLocaleDateString() : "Recently"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 6: APPROVED AGENT DASHBOARD & NEARBY ASSIGNMENTS
  // ===========================================================================
  return (
    <div className="space-y-6">
      {/* Header Strip — Industrial Terminal Look */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  Field Operations & Procurement Dispatch
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5">
                  Authorized Agent
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Officer: <strong className="text-foreground">{agentProfile?.user?.name || "Field Agent"}</strong> • On-site contractor verification, materials inspection & dispatch
              </p>
            </div>
          </div>

          {/* Dispatch ONLINE/OFFLINE switch */}
          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-2.5 self-start sm:self-auto">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                  }`}
                />
                <span className="text-xs font-bold text-foreground">
                  {isOnline ? "ONLINE — Receiving Dispatch" : "OFFLINE — Dispatch Paused"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground block font-mono">
                {isOnline
                  ? `Active in ${agentProfile?.marketplaceHub || "Megenagna"}`
                  : "Switch online to receive contractor leads"}
              </span>
            </div>
            <Switch
              checked={isOnline}
              disabled={togglingOnline}
              onCheckedChange={handleToggleOnline}
              className="accent-primary"
            />
          </div>
        </div>

        {/* Hub Station & Driver Profile Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
            <span className="font-semibold text-foreground">Stationed Hub:</span>
            <Badge variant="outline" className="gap-1.5 font-mono text-xs text-primary border-primary/30 bg-primary/5 font-bold">
              <MapPin className="h-3 w-3 text-primary" />
              {agentProfile?.marketplaceHub || "Megenagna"}
            </Badge>

            <Badge variant="secondary" className="gap-1 font-mono text-[11px]">
              <Truck className="h-3 w-3" />
              {agentProfile?.vehicleType || "ISUZU"} {agentProfile?.vehiclePlateNumber ? `(${agentProfile.vehiclePlateNumber})` : ""}
            </Badge>

            <Link href="/agent/wallet">
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-semibold hover:bg-emerald-500/20 cursor-pointer">
                <Sparkles className="h-2.5 w-2.5" />
                6-Month Free Intro Active • Wallet
              </Badge>
            </Link>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono">
            Operating Hours: <strong className="text-foreground">{agentProfile?.availableDaysHours || "Mon - Sat, 08:00 - 18:00 EAT"}</strong>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Screen 6: Priority Field Dispatch Orders (Procurement Manifest Slips) */}
      {nearbyRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Priority Field Dispatch Orders ({nearbyRequests.length} Pending Acceptance)
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              Contractor identity sealed until dispatch acceptance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {nearbyRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-border/90 bg-card p-4 space-y-3.5 shadow-xs transition-all hover:border-primary/50"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                      #{req.referenceCode}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold uppercase tracking-wider">
                      ● Dispatch Available
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Urgent Site Request
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      Material Spec & Volume
                    </span>
                    <strong className="text-foreground text-sm font-bold block mt-0.5">
                      {req.materialNeeded}
                    </strong>
                    <span className="text-muted-foreground text-xs font-mono">
                      Quantity: <strong className="text-foreground">{req.quantity}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      Target Area / Yard
                    </span>
                    <strong className="text-foreground text-xs font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      {req.areaLocation}
                    </strong>
                    {req.preferredVisitTime && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-mono">
                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                        {req.preferredVisitTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Privacy Protected Phone Box */}
                <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/40 px-3 py-2 text-xs">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    Buyer Phone:
                  </span>
                  <span className="font-mono font-bold text-xs text-foreground">
                    {req.buyerPhone}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <Button
                    onClick={() => handleAcceptRequest(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="flex-1 font-bold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground h-9"
                  >
                    {actionLoadingId === req.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Check className="h-3.5 w-3.5" />
                    <span>Accept & Claim Order</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeclineRequest(req.id)}
                    className="text-xs font-semibold h-9 px-3"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads Navigation Tabs & Search Controls */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-1">
            {[
              { id: "ALL", label: locale === "am" ? "ሁሉም" : "All Leads" },
              { id: GuidedLeadStatus.NEW, label: locale === "am" ? "አዳዲስ" : "New" },
              { id: GuidedLeadStatus.ASSIGNED, label: locale === "am" ? "የተመደቡ" : "Assigned" },
              { id: GuidedLeadStatus.GUIDING, label: locale === "am" ? "በመመራት ላይ" : "Guiding" },
              { id: GuidedLeadStatus.DELIVERED, label: locale === "am" ? "ጉብኝት የተጠናቀቁ" : "Visit Completed" },
              { id: GuidedLeadStatus.CLOSED, label: locale === "am" ? "የተዘጉ" : "Closed" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, material..."
                className="pl-8 text-xs"
              />
            </div>
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                placeholder="Filter area (e.g. Bole)..."
                className="pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Leads Feed List */}
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <Card className="border-border/80 p-12 text-center text-xs text-muted-foreground">
              {locale === "am" ? "ምንም የተገኘ ጥያቄ የለም።" : "No guided leads matching current filters."}
            </Card>
          ) : (
            filteredLeads.map((lead) => {
              const isAssignedToMe = lead.assignedAgent?.id === currentAgentId;
              const isLoading = actionLoadingId === lead.id;

              return (
                <Card key={lead.id} className="border-border/80 bg-card shadow-xs overflow-hidden">
                  <div className="p-5 space-y-4">
                    {/* Top Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-primary">
                          {lead.referenceCode}
                        </span>
                        {getStatusBadge(lead.status)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {lead.areaLocation}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                        {(() => {
                          try {
                            return new Date(lead.createdAt).toLocaleString(
                              locale === "am" ? "am-ET" : "en-US",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }
                            );
                          } catch {
                            return String(lead.createdAt);
                          }
                        })()}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Material & Quantity */}
                      <div className="space-y-1">
                        <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider block">
                          {locale === "am" ? "የሚፈለገው ቁሳቁስ" : "Requested Material"}
                        </span>
                        <p className="font-bold text-sm text-foreground">{lead.materialNeeded}</p>
                        <p className="text-muted-foreground">
                          Quantity: <strong className="text-foreground">{lead.quantity}</strong>
                        </p>
                      </div>

                      {/* Buyer Contact */}
                      <div className="space-y-1">
                        <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider block">
                          {locale === "am" ? "የገዢው መረጃ" : "Buyer Contact"}
                        </span>
                        {lead.buyerName && (
                          <p className="font-medium text-foreground">{lead.buyerName}</p>
                        )}
                        <div className="pt-0.5">
                          {lead.isPhoneRevealed || isAssignedToMe || isAdmin ? (
                            <a
                              href={`tel:${lead.buyerPhone.replace(/\s+/g, "")}`}
                              className="inline-flex items-center gap-1.5 font-mono font-bold text-primary hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {lead.buyerPhone}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground">
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              {lead.buyerPhone}
                            </span>
                          )}
                        </div>
                        {lead.preferredVisitTime && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lead.preferredVisitTime}
                          </p>
                        )}
                      </div>

                      {/* Depot or Assignment Info */}
                      <div className="space-y-1">
                        <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider block">
                          {locale === "am" ? "የተመደበ መጋዘን / ወኪል" : "Depot / Assigned Agent"}
                        </span>
                        {lead.targetSeller ? (
                          <p className="text-foreground flex items-center gap-1 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {lead.targetSeller.companyName || lead.targetSeller.name}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">Open Depot Sourcing</p>
                        )}

                        {lead.assignedAgent ? (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground mt-1">
                            Agent: {lead.assignedAgent.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/30 mt-1">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Notes / Close Reason */}
                    {lead.notes && (
                      <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                        <strong className="text-foreground">Notes: </strong>
                        {lead.notes}
                      </div>
                    )}

                    {lead.closeReason && (
                      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                        <strong>Closed Reason: </strong>
                        {lead.closeReason}
                      </div>
                    )}

                    {/* Action Buttons Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
                      {lead.isPhoneRevealed || isAssignedToMe || isAdmin ? (
                        <a
                          href={`tel:${lead.buyerPhone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Call Buyer</span>
                        </a>
                      ) : (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <span>Phone masked until accepted</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {lead.status === GuidedLeadStatus.NEW && (
                          <Button
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleAcceptRequest(lead.id)}
                            className="gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Accept Lead</span>
                          </Button>
                        )}

                        {lead.status === GuidedLeadStatus.ASSIGNED && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoading}
                              onClick={() => setDisputeModalLead(lead)}
                              className="gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-semibold"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Unreachable / Dispute</span>
                            </Button>

                            <Button
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleStartGuiding(lead.id)}
                              className="gap-1.5 text-xs font-bold"
                            >
                              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span>Start Guiding</span>
                            </Button>
                          </>
                        )}

                        {lead.status === GuidedLeadStatus.GUIDING && (
                          <Button
                            size="sm"
                            disabled={isLoading}
                            onClick={() => setDeliveringLead(lead)}
                            className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Record Delivery</span>
                          </Button>
                        )}

                        {lead.status !== GuidedLeadStatus.DELIVERED &&
                          lead.status !== GuidedLeadStatus.CLOSED && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isLoading}
                              onClick={() => setClosingLead(lead)}
                              className="text-xs text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Close Lead</span>
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Confirm Visit Completed Dialog */}
      <Dialog open={!!deliveringLead} onOpenChange={(open) => { if (!open) { setDeliveringLead(null); setVisitOutcome(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{locale === "am" ? "ጉብኝት ያረጋግጡ — ኮሚሽን ያስቀምጡ" : "Confirm Visit Completed & Earn Commission"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {locale === "am"
                ? `ገዢ ${deliveringLead?.buyerName || "ደንበኛ"} ወደ መጋዘኑ አስጎብኝቻለሁ ወይም ትዕዛዙ ተጠናቋል።`
                : `Confirm you guided buyer ${deliveringLead?.buyerName || "customer"} to inspect and order materials at the depot.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmDelivery} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{locale === "am" ? "የጉብኝት ውጤት (አማራጭ)" : "Visit Outcome Note (optional)"}</Label>
              <Input
                placeholder={locale === "am" ? "ምሳሌ: ትዕዛዝ ተጠናቋል — 50 ሲሚንቶ" : "e.g. Order placed – 50 bags cement"}
                value={visitOutcome}
                onChange={(e) => setVisitOutcome(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{locale === "am" ? "የኮሚሽን ክፍያ (ብር)" : "Commission Fee Earned (ETB)"}</Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={commissionFee}
                onChange={(e) => setCommissionFee(Number(e.target.value))}
                className="text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-muted-foreground">
                {locale === "am" ? "ማረጋገጫ ሲሰጥ ወደ ኮሚሽን መዝገብዎ ይዛወራል።" : "Credited to your commission ledger upon confirmation."}
              </span>
            </div>

            {actionError && (
              <p className="text-xs text-destructive">{actionError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setDeliveringLead(null); setVisitOutcome(""); }}
              >
                {locale === "am" ? "ሰርዝ" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoadingId === deliveringLead?.id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
              >
                {actionLoadingId === deliveringLead?.id && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {locale === "am" ? "ጉብኝት ያረጋግጡ" : "Confirm Visit Completed"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Lead Dialog */}
      <Dialog open={!!closingLead} onOpenChange={(open) => !open && setClosingLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>Close Guided Lead</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              A mandatory reason is required to close this lead.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmClose} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Reason for Closing *</Label>
              <Textarea
                required
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="e.g. Buyer unreachable after 3 calls, supplier out of stock, price mismatched..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setClosingLead(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={actionLoadingId === closingLead?.id || !closeReason.trim()}
              >
                {actionLoadingId === closingLead?.id && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                )}
                Close Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dispute / Unreachable Buyer Dialog */}
      <Dialog
        open={!!disputeModalLead}
        onOpenChange={(open) => {
          if (!open) {
            setDisputeModalLead(null);
            setDisputeReason("");
            setDisputeSuccessMsg(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
              <span>Dispute Assignment / Unreachable Buyer</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              If the buyer is fake or unreachable after repeated calls, dispute this lead to receive an immediate 100 ETB job credit refund to your wallet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisputeSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason for Dispute *</Label>
              <Textarea
                required
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Buyer's phone is switched off after 3 attempts across 2 hours, wrong material request, or fake order."
                rows={3}
                className="text-xs"
              />
            </div>

            {disputeSuccessMsg && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{disputeSuccessMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDisputeModalLead(null);
                  setDisputeReason("");
                  setDisputeSuccessMsg(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingDispute || !disputeReason.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
              >
                {submittingDispute && <Loader2 className="h-3 w-3 animate-spin" />}
                Submit Dispute & Claim Refund
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
