// =============================================================================
// ConMart — Commission Agent Guided Leads Inbox View
// =============================================================================
// Implements the 5-stage Lead Workflow from Yakob Dan's brief:
// 1. NEW: Unclaimed buyer requests from "Get Guided / Request a Visit".
// 2. ASSIGNED: Claimed by agent or assigned by admin.
// 3. GUIDING: Agent actively contacting buyer / visiting supplier depot.
// 4. DELIVERED: Successfully closed deal (auto-credits agent commission ledger).
// 5. CLOSED: Lead terminated (mandatory reason required).
// =============================================================================

"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Phone,
  MapPin,
  Clock,
  Package,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertCircle,
  Building2,
  Calendar,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  assignGuidedLeadAction,
  updateGuidedLeadStatusAction,
} from "@/app/actions/leads";
import { GuidedLeadStatus } from "@prisma/client";
import { useLanguage } from "@/lib/i18n/language-context";

export interface GuidedLeadItem {
  id: string;
  referenceCode: string;
  materialNeeded: string;
  quantity: string;
  areaLocation: string;
  buyerPhone: string;
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

interface AgentLeadsViewProps {
  initialLeads: GuidedLeadItem[];
  currentAgentId: string;
}

export function AgentLeadsView({ initialLeads, currentAgentId }: AgentLeadsViewProps) {
  const { locale } = useLanguage();
  const [leads, setLeads] = useState(initialLeads);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  // Modals state
  const [deliveringLead, setDeliveringLead] = useState<GuidedLeadItem | null>(null);
  const [commissionFee, setCommissionFee] = useState<number>(200);

  const [closingLead, setClosingLead] = useState<GuidedLeadItem | null>(null);
  const [closeReason, setCloseReason] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const handleClaimLead = async (leadId: string) => {
    setActionLoadingId(leadId);
    setActionError(null);
    try {
      const res = await assignGuidedLeadAction(leadId, currentAgentId);
      if (!res.success) {
        setActionError(res.error);
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, status: GuidedLeadStatus.ASSIGNED, assignedAgent: { id: currentAgentId, name: "Me", phone: "" } }
              : l
          )
        );
      }
    } catch {
      setActionError("Failed to claim lead. Please retry.");
    } finally {
      setActionLoadingId(null);
    }
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
      }
    } catch {
      setActionError("Failed to record delivery.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingLead) return;

    if (!closeReason.trim()) {
      setActionError(locale === "am" ? "እባክዎ የመዝጊያ ምክንያት ያስገቡ" : "Please provide a reason for closing");
      return;
    }

    setActionLoadingId(closingLead.id);
    setActionError(null);
    try {
      const res = await updateGuidedLeadStatusAction({
        leadId: closingLead.id,
        status: GuidedLeadStatus.CLOSED,
        closeReason: closeReason.trim(),
      });
      if (!res.success) {
        setActionError(res.error);
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === closingLead.id
              ? { ...l, status: GuidedLeadStatus.CLOSED, closeReason: closeReason.trim() }
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
        return <Badge className="bg-blue-600 text-white text-[10px]">NEW / UNCLAIMED</Badge>;
      case GuidedLeadStatus.ASSIGNED:
        return <Badge className="bg-amber-600 text-white text-[10px]">ASSIGNED</Badge>;
      case GuidedLeadStatus.GUIDING:
        return <Badge className="bg-purple-600 text-white text-[10px]">GUIDING</Badge>;
      case GuidedLeadStatus.DELIVERED:
        return <Badge className="bg-emerald-600 text-white text-[10px]">DELIVERED</Badge>;
      case GuidedLeadStatus.CLOSED:
        return <Badge variant="secondary" className="text-[10px] text-muted-foreground">CLOSED</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <UserCheck className="h-7 w-7 text-primary" />
          {locale === "am" ? "የኮሚሽን ወኪል የመሪዎች ገቢ ሣጥን" : "Agent Guided Leads Inbox"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {locale === "am"
            ? "በአካባቢዎ ከገዢዎች የተላኩ የቁሳቁስ ጥያቄዎችን ይቀበሉ፣ መጋዘኖችን አገናኙ እና ለእያንዳንዱ የተረከበ ዕቃ ኮሚሽን ያግኙ።"
            : "Review inbound buyer requests, claim leads in your territory, guide visits to partner depots, and earn guaranteed agent commissions."}
        </p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: locale === "am" ? "ሁሉም" : "All Leads" },
            { id: GuidedLeadStatus.NEW, label: locale === "am" ? "አዳዲስ" : "New / Unclaimed" },
            { id: GuidedLeadStatus.ASSIGNED, label: locale === "am" ? "የተመደቡ" : "Assigned" },
            { id: GuidedLeadStatus.GUIDING, label: locale === "am" ? "በሂደት ላይ" : "Guiding" },
            { id: GuidedLeadStatus.DELIVERED, label: locale === "am" ? "የተረከቡ" : "Delivered" },
            { id: GuidedLeadStatus.CLOSED, label: locale === "am" ? "የተዘጉ" : "Closed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference code, material, buyer phone..."
              className="pl-8 text-xs"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              placeholder="Filter by sub-city / area (e.g. Bole, CMC, Kality)..."
              className="pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Leads List */}
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

                    <div className="text-[11px] text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
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
                        {locale === "am" ? "መጠን: " : "Quantity: "}
                        <strong className="text-foreground">{lead.quantity}</strong>
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
                        <a
                          href={`tel:${lead.buyerPhone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 font-mono font-bold text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {lead.buyerPhone}
                        </a>
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
                    <a
                      href={`tel:${lead.buyerPhone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{locale === "am" ? "ደውል" : "Call Buyer"}</span>
                    </a>

                    <div className="flex items-center gap-2 ml-auto">
                      {lead.status === GuidedLeadStatus.NEW && (
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleClaimLead(lead.id)}
                          className="gap-1.5 text-xs font-bold"
                        >
                          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{locale === "am" ? "እኔ ላስተናግደው (Claim)" : "Claim Lead"}</span>
                        </Button>
                      )}

                      {lead.status === GuidedLeadStatus.ASSIGNED && (
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleStartGuiding(lead.id)}
                          className="gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span>{locale === "am" ? "መምራት ጀምር" : "Start Guiding"}</span>
                        </Button>
                      )}

                      {(lead.status === GuidedLeadStatus.ASSIGNED ||
                        lead.status === GuidedLeadStatus.GUIDING) && (
                        <>
                          <Button
                            size="sm"
                            disabled={isLoading}
                            onClick={() => setDeliveringLead(lead)}
                            className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{locale === "am" ? "ተረክቧል (Delivered)" : "Mark Delivered"}</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isLoading}
                            onClick={() => setClosingLead(lead)}
                            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{locale === "am" ? "ዝጋ" : "Close"}</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Mark Delivered Modal */}
      <Dialog open={Boolean(deliveringLead)} onOpenChange={() => setDeliveringLead(null)}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {locale === "am" ? "ዕቃው መረከቡን አረጋግጥ" : "Confirm Delivery & Commission"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {locale === "am"
                ? "ይህ እርምጃ መሪውን እንደተረከበ ይመዘግባል እንዲሁም የኮሚሽን ሂሳብዎን ወዲያውኑ ያሳድጋል።"
                : "This marks the guided visit as delivered and automatically logs your commission into the ConMart accounting ledger."}
            </DialogDescription>
          </DialogHeader>

          {deliveringLead && (
            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <p>
                  <strong>Lead: </strong> {deliveringLead.referenceCode} ({deliveringLead.materialNeeded})
                </p>
                <p>
                  <strong>Buyer Phone: </strong> {deliveringLead.buyerPhone}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="commissionFee" className="text-xs font-semibold">
                  {locale === "am" ? "የሚገባዎት ኮሚሽን (ETB)" : "Commission Earned (ETB)"}
                </Label>
                <Input
                  id="commissionFee"
                  type="number"
                  min="0"
                  step="50"
                  value={commissionFee}
                  onChange={(e) => setCommissionFee(Number(e.target.value))}
                  className="font-mono font-bold text-base"
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Default standard per-delivery fee: 200 ETB
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDeliveringLead(null)}>
                  {locale === "am" ? "ሰርዝ" : "Cancel"}
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {locale === "am" ? "አረጋግጥ" : "Confirm Delivery"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Close Lead Modal */}
      <Dialog open={Boolean(closingLead)} onOpenChange={() => setClosingLead(null)}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {locale === "am" ? "ያልተሳካ መሪ ዝጋ" : "Close Undelivered Lead"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {locale === "am"
                ? "እባክዎ መሪው ያልተሳካበትን ምክንያት በግልጽ ይግለጹ (ለምሳሌ: ገዢው ስልክ አያነሳም፣ ዋጋ አልተስማሙም)።"
                : "A reason is mandatory when closing an undelivered lead for accounting and review."}
            </DialogDescription>
          </DialogHeader>

          {closingLead && (
            <form onSubmit={handleConfirmClose} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="closeReason" className="text-xs font-semibold">
                  {locale === "am" ? "የመዝጊያ ምክንያት *" : "Reason for Closing *"}
                </Label>
                <Textarea
                  id="closeReason"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="e.g. Buyer unreachable after 3 attempts, Material out of stock at partner depot, Buyer postponed project..."
                  className="text-xs min-h-[80px]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setClosingLead(null)}>
                  {locale === "am" ? "ተመለስ" : "Back"}
                </Button>
                <Button type="submit" variant="destructive" className="font-bold">
                  {locale === "am" ? "መሪውን ዝጋ" : "Close Lead"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
