// =============================================================================
// ConMart — Admin Command Center (Operations Hub)
// =============================================================================
// Operational control room for the Subscription & Guided Leads Directory Model:
// 1. Supplier Subscription Approvals & Tier Assignments
// 2. Guided Buyer Leads Inbox & Agent Assignments
// 3. Supplier Document Verification & Yard Inspection Compliance Queue
// 4. Trade Dispute Mediation Queue
// 5. Bank Proforma Invoices & Fulfillment
// =============================================================================

import Link from "next/link";
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Inbox,
  Sparkles,
  ArrowRight,
  Building2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAllOrders } from "@/lib/data/admin";
import { requireRole } from "@/lib/auth/session";
import { getPendingSubscriptionPaymentsAction } from "@/app/actions/subscription";
import { getGuidedLeadsAction } from "@/app/actions/leads";
import { getAdminDisputesAction } from "@/app/actions/enquiries";
import { getAdminSellersAction } from "@/app/actions/sellers";
import { getAdminAgentApplicationsAction } from "@/app/actions/agents";
import { OrdersTable } from "./orders-table";
import { DisputesTable } from "./disputes-table";
import { SellerVerificationTable } from "./seller-verification-table";
import { formatETB } from "@/lib/types";

export default async function CommandCenterPage() {
  await requireRole(["ADMIN"], "/admin/command-center");

  const [orders, subscriptionsRes, guidedLeadsRes, disputesRes, sellersRes, agentsRes] = await Promise.all([
    fetchAllOrders(),
    getPendingSubscriptionPaymentsAction(),
    getGuidedLeadsAction(),
    getAdminDisputesAction(),
    getAdminSellersAction(),
    getAdminAgentApplicationsAction(),
  ]);

  const pendingPayments = subscriptionsRes.success && subscriptionsRes.data ? subscriptionsRes.data : [];
  const guidedLeads = guidedLeadsRes.success && guidedLeadsRes.data ? guidedLeadsRes.data : [];
  const disputes = disputesRes.success && disputesRes.data ? disputesRes.data : [];
  const sellers = sellersRes.success && sellersRes.data ? sellersRes.data : [];
  const agentApps = agentsRes.success && agentsRes.data ? agentsRes.data : [];
  const pendingAgents = agentApps.filter((a) => a.approvalStatus === "UNDER_REVIEW" || a.approvalStatus === "SUBMITTED");

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Addis Ababa Construction Materials Trading Hub
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Operations Command Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time oversight: supplier subscription verification, guided buyer leads assignment, depot yard compliance, and dispute mediation.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-emerald-500" />}
          label="Pending Subscriptions"
          value={pendingPayments.length.toString()}
          href="/admin/subscriptions"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-amber-500" />}
          label="Agent Vetting"
          value={pendingAgents.length.toString()}
          href="/admin/agents"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5 text-primary" />}
          label="Guided Buyer Leads"
          value={guidedLeads.length.toString()}
          href="/agent/leads"
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-indigo-500" />}
          label="Verified Suppliers"
          value={sellers.filter((s) => s.verificationStatus === "VERIFIED").length.toString()}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5 text-blue-500" />}
          label="Re-check Due"
          value={sellers.filter((s) => s.reverificationNeeded).length.toString()}
        />
        <StatCard
          icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
          label="Open Disputes"
          value={disputes.filter((d) => d.status === "OPEN" || d.status === "MEDIATING").length.toString()}
        />
        <StatCard
          icon={<Inbox className="h-5 w-5 text-amber-500" />}
          label="Bank Proformas"
          value={orders.length.toString()}
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">Supplier Subscriptions Queue</h3>
                {pendingPayments.length > 0 && (
                  <Badge className="bg-amber-600 text-white text-[10px]">
                    {pendingPayments.length} Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Review Telebirr, CBE Bank, and Awash Bank transaction slips to activate supplier directory listings.
              </p>
            </div>
            <Link href="/admin/subscriptions">
              <Button size="sm" className="gap-1.5 font-bold shadow-xs shrink-0">
                <span>Review Plans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">01B Agent Vetting Queue</h3>
                {pendingAgents.length > 0 && (
                  <Badge className="bg-amber-600 text-white text-[10px]">
                    {pendingAgents.length} Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                5-point verification: Grade 12 certificates, National ID, guarantor backing, and service areas.
              </p>
            </div>
            <Link href="/admin/agents">
              <Button size="sm" className="gap-1.5 font-bold shadow-xs shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
                <span>Review Agents</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Buyer Guided Leads Inbox</h3>
                {guidedLeads.filter((l) => l.status === "NEW").length > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px]">
                    {guidedLeads.filter((l) => l.status === "NEW").length} New
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Assign contractor material requests to field commission agents and track delivery stages.
              </p>
            </div>
            <Link href="/agent/leads">
              <Button size="sm" variant="outline" className="gap-1.5 font-bold shrink-0">
                <span>Open Leads</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 1. Supplier Verification & Document Compliance Queue */}
      <SellerVerificationTable initialSellers={sellers} />

      {/* 2. Trade Disputes & Mediation Queue */}
      <DisputesTable initialDisputes={disputes} />

      {/* 3. Bank Proformas & Procurement Invoices */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Bank Proforma Invoices & Procurement
            </h2>
            <p className="text-xs text-muted-foreground">
              Official bank proformas generated by contractors for loan, LC, or offline procurement.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {orders.length} total proformas
          </span>
        </div>
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <Card className="border-border/50 shadow-2xs hover:border-primary/40 transition-colors">
      <CardContent className="flex items-center gap-3 pt-4 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="text-base font-bold text-foreground font-mono">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
