// =============================================================================
// ECON — Admin Command Center (Operations Hub)
// =============================================================================
// Operational control room for the Subscription & Guided Leads Directory Model:
// 1. Supplier Subscription Approvals & Tier Assignments
// 2. Guided Buyer Leads Inbox & Agent Assignments
// 3. Supplier Document Verification & Yard Inspection Compliance Queue
// 4. Trade Dispute Mediation Queue
// 5. Bank Proforma Invoices & Fulfillment
// =============================================================================

import React, { Suspense } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Inbox,
  ArrowRight,
  Building2,
  Users,
  Recycle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { WalletTxStatus } from "@prisma/client";
import { resolveSubscription } from "@/lib/marketplace/subscription";
import { fetchAllSiteWastages } from "@/lib/data/wastage";
import { fetchAllOrders } from "@/lib/data/admin";
import { OrdersTable } from "./orders-table";
import { DisputesTable } from "./disputes-table";
import { SellerVerificationTable } from "./seller-verification-table";
import { WastageModerationTable } from "./wastage-moderation-table";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Safe direct-database fetchers (each has try/catch fallback to [])
// ---------------------------------------------------------------------------

async function fetchSubscriptionPayments() {
  try {
    const payments = await db.subscriptionPayment.findMany({
      where: { status: WalletTxStatus.PENDING },
      include: {
        seller: {
          select: { id: true, name: true, companyName: true, phone: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return payments.map((p) => ({
      id: p.id,
      sellerId: p.sellerId,
      sellerName: p.seller?.name ?? "Supplier",
      companyName: p.seller?.companyName ?? "Direct Depot",
      sellerPhone: p.seller?.phone ?? "",
      tier: p.tier,
      amount: Number(p.amount ?? 0),
      paymentMethod: p.paymentMethod,
      referenceCode: p.referenceCode,
      slipUrl: p.slipUrl,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("[command-center] fetchSubscriptionPayments failed:", err);
    return [];
  }
}

async function fetchGuidedLeads() {
  try {
    const leads = await db.guidedLead.findMany({
      include: {
        assignedAgent: { select: { id: true, name: true, phone: true } },
        targetSeller: {
          select: { id: true, name: true, companyName: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return leads.map((l) => ({
      id: l.id,
      referenceCode: l.referenceCode,
      materialNeeded: l.materialNeeded,
      quantity: l.quantity,
      areaLocation: l.areaLocation,
      buyerPhone: l.buyerPhone,
      buyerName: l.buyerName,
      preferredVisitTime: l.preferredVisitTime,
      notes: l.notes,
      status: l.status,
      closeReason: l.closeReason,
      targetSeller: l.targetSeller
        ? {
            id: l.targetSeller.id,
            name: l.targetSeller.name,
            companyName: l.targetSeller.companyName,
            phone: l.targetSeller.phone,
          }
        : null,
      assignedAgent: l.assignedAgent
        ? {
            id: l.assignedAgent.id,
            name: l.assignedAgent.name,
            phone: l.assignedAgent.phone,
          }
        : null,
      createdAt: l.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("[command-center] fetchGuidedLeads failed:", err);
    return [];
  }
}

async function fetchDisputes() {
  try {
    const disputes = await db.disputeCase.findMany({
      include: {
        enquiry: {
          include: {
            buyer: { select: { name: true, phone: true, companyName: true } },
            seller: { select: { name: true, phone: true, companyName: true } },
            listing: { include: { product: { select: { title: true } } } },
          },
        },
        unlockRecord: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return disputes.map((dispute) => ({
      id: dispute.id,
      enquiryId: dispute.enquiryId,
      referenceCode: dispute.enquiry?.referenceCode ?? dispute.id.slice(0, 8),
      productTitle: dispute.enquiry?.listing?.product?.title ?? "Construction Material",
      raisedBy: dispute.raisedBy,
      claimType: dispute.claimType,
      description: dispute.description,
      status: dispute.status,
      resolutionNotes: dispute.resolutionNotes,
      createdAt: dispute.createdAt.toISOString(),
      resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
      buyerName: dispute.enquiry?.buyer?.name ?? "Buyer",
      buyerPhone: dispute.enquiry?.buyer?.phone ?? "",
      sellerName: dispute.enquiry?.seller?.name ?? "Seller",
      sellerCompany: dispute.enquiry?.seller?.companyName ?? null,
      sellerPhone: dispute.enquiry?.seller?.phone ?? "",
      feeAmount: Number(dispute.unlockRecord?.feeAmount ?? 0),
    }));
  } catch (err) {
    console.error("[command-center] fetchDisputes failed:", err);
    return [];
  }
}

async function fetchSellers() {
  try {
    const sellers = await db.user.findMany({
      where: { role: "SELLER" },
      include: {
        sellerProfile: true,
        wallet: { select: { cashBalance: true, creditBalance: true } },
        _count: { select: { sellerListings: true, sellerEnquiries: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return sellers.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      companyName: s.companyName,
      createdAt: s.createdAt.toISOString(),
      profileId: s.sellerProfile?.id || null,
      sellerType: s.sellerProfile?.sellerType || "RETAILER",
      verificationStatus: s.sellerProfile?.verificationStatus || "UNVERIFIED",
      licenseNumber: s.sellerProfile?.licenseNumber || null,
      tinNumber: s.sellerProfile?.tinNumber || null,
      vatNumber: s.sellerProfile?.vatNumber || null,
      vatRegistered: s.sellerProfile?.vatRegistered ?? false,
      licenseExpiry: s.sellerProfile?.licenseExpiry
        ? s.sellerProfile.licenseExpiry.toISOString()
        : null,
      tinExpiry: s.sellerProfile?.tinExpiry
        ? s.sellerProfile.tinExpiry.toISOString()
        : null,
      completedDealsCount: s.sellerProfile?.completedDealsCount || 0,
      failedDealsCount: s.sellerProfile?.failedDealsCount || 0,
      responseTimeAvgMinutes: s.sellerProfile?.responseTimeAvgMinutes || 60,
      listingCount: s._count?.sellerListings || 0,
      enquiryCount: s._count?.sellerEnquiries || 0,
      cashBalance: Number(s.wallet?.cashBalance ?? 0),
      creditBalance: Number(s.wallet?.creditBalance ?? 0),
      subscriptionStatus: resolveSubscription(s.sellerProfile),
      subscriptionTier: s.sellerProfile?.subscriptionTier ?? "BASIC",
      reverificationNeeded: s.sellerProfile?.reverificationNeeded ?? false,
      lastVerifiedAt: s.sellerProfile?.lastVerifiedAt
        ? s.sellerProfile.lastVerifiedAt.toISOString()
        : null,
      storedSubscriptionStatus:
        s.sellerProfile?.subscriptionStatus ?? "FREE",
      subscriptionExpiresAt: s.sellerProfile?.subscriptionExpiresAt
        ? s.sellerProfile.subscriptionExpiresAt.toISOString()
        : null,
    }));
  } catch (err) {
    console.error("[command-center] fetchSellers failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Skeleton Loaders for Smooth Streaming
// ---------------------------------------------------------------------------

function TableSkeleton({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-mono">Loading operations queue...</span>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section Components (Isolated with Suspense)
// ---------------------------------------------------------------------------

async function SellerVerificationSection() {
  const sellers = await fetchSellers();
  return <SellerVerificationTable initialSellers={sellers} />;
}

async function WastageModerationSection() {
  const wastages = await fetchAllSiteWastages();
  return <WastageModerationTable initialItems={wastages} />;
}

async function DisputesSection() {
  const disputes = await fetchDisputes();
  return <DisputesTable initialDisputes={disputes} />;
}

async function OrdersSection() {
  const orders = await fetchAllOrders();
  return (
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
  );
}

async function OperationalOverviewSection() {
  // All individual fetchers already return [] on DB failure.
  // The outer try/catch defends against pool-level failures (DNS, TLS, OOM)
  // that would crash even the individual catch blocks.
  let pendingPayments: Awaited<ReturnType<typeof fetchSubscriptionPayments>> = [];
  let guidedLeads: Awaited<ReturnType<typeof fetchGuidedLeads>> = [];
  let sellers: Awaited<ReturnType<typeof fetchSellers>> = [];
  let disputes: Awaited<ReturnType<typeof fetchDisputes>> = [];
  let agentApps: { id: string; approvalStatus?: string }[] = [];
  let orders: Awaited<ReturnType<typeof fetchAllOrders>> = [];
  let wastages: Awaited<ReturnType<typeof fetchAllSiteWastages>> = [];

  try {
    [pendingPayments, guidedLeads, sellers, disputes, agentApps, orders, wastages] =
      await Promise.all([
        fetchSubscriptionPayments(),
        fetchGuidedLeads(),
        fetchSellers(),
        fetchDisputes(),
        db.agentProfile.findMany({ select: { id: true, approvalStatus: true } }).catch(() => []),
        fetchAllOrders(),
        fetchAllSiteWastages(),
      ]);
  } catch (err) {
    console.error("[command-center] OperationalOverviewSection Promise.all failed:", err);
  }

  const pendingAgents = agentApps.filter(
    (a: { approvalStatus?: string }) =>
      a?.approvalStatus === "UNDER_REVIEW" || a?.approvalStatus === "SUBMITTED"
  );
  const pendingWastages = wastages.filter(
    (w: { status?: string }) => w?.status === "PENDING"
  );

  return (
    <div className="space-y-6">
      {/* Operational KPI grid */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard
          icon={<CreditCard className="h-4 w-4 text-emerald-500" />}
          label="Subscriptions"
          value={pendingPayments.length.toString()}
          href="/admin/subscriptions"
          badge={pendingPayments.length > 0 ? "Action Req" : undefined}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-amber-500" />}
          label="Agent Vetting"
          value={pendingAgents.length.toString()}
          href="/admin/agents"
          badge={pendingAgents.length > 0 ? `${pendingAgents.length} Pending` : undefined}
        />
        <StatCard
          icon={<UserCheck className="h-4 w-4 text-primary" />}
          label="Buyer Leads"
          value={guidedLeads.length.toString()}
          href="/agent/leads"
        />
        <StatCard
          icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
          label="Verified Yds"
          value={sellers.filter((s) => s?.verificationStatus === "VERIFIED").length.toString()}
        />
        <StatCard
          icon={<Building2 className="h-4 w-4 text-blue-500" />}
          label="Audit Due"
          value={sellers.filter((s) => s?.reverificationNeeded).length.toString()}
        />
        <StatCard
          icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}
          label="Disputes"
          value={disputes.filter((d) => d?.status === "OPEN" || d?.status === "MEDIATING").length.toString()}
          badge={disputes.filter((d) => d?.status === "OPEN").length > 0 ? "Open" : undefined}
        />
        <StatCard
          icon={<Inbox className="h-4 w-4 text-indigo-500" />}
          label="Proformas"
          value={orders.length.toString()}
        />
        <StatCard
          icon={<Recycle className="h-4 w-4 text-emerald-500" />}
          label="Surplus Lots"
          value={pendingWastages.length.toString()}
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
                5-point verification: Kebele ID, Driver&apos;s License, Vehicle Libre, marketplace hub, and service area.
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function CommandCenterPage() {
  await requireRole(["ADMIN"], "/admin/command-center");

  return (
    <div className="space-y-8">
      {/* Page header (renders immediately) */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 font-mono text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          <span>Clearinghouse Live</span>
          <span className="text-border">|</span>
          <span>Addis Ababa</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Operations
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Subscription approvals, field dispatch inspection tickets, proforma clearing, and commercial dispute mediation for Ethiopia&apos;s national construction trade network.
        </p>
      </div>

      {/* Operational KPI grid & Quick Navigation */}
      <Suspense fallback={<TableSkeleton title="Operational Overview" description="Calculating clearinghouse activity metrics..." />}>
        <OperationalOverviewSection />
      </Suspense>

      {/* 1. Supplier Verification & Document Compliance Queue (User's primary queue) */}
      <Suspense fallback={<TableSkeleton title="Supplier Verification & Document Compliance" description="Loading supplier trade licenses and depot verification records..." />}>
        <SellerVerificationSection />
      </Suspense>

      {/* 2. Site Wastages Community Moderation Queue */}
      <Suspense fallback={<TableSkeleton title="Site Wastages Moderation Queue" description="Loading community scrap and surplus listings..." />}>
        <WastageModerationSection />
      </Suspense>

      {/* 3. Trade Disputes & Mediation Queue */}
      <Suspense fallback={<TableSkeleton title="Trade Dispute & Mediation Queue" description="Loading dispute cases..." />}>
        <DisputesSection />
      </Suspense>

      {/* 4. Bank Proformas & Procurement Invoices */}
      <Suspense fallback={<TableSkeleton title="Bank Proforma Invoices & Procurement" description="Loading proformas..." />}>
        <OrdersSection />
      </Suspense>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  badge?: string;
}) {
  const content = (
    <Card className="border-border/50 shadow-2xs transition-colors hover:border-primary/40">
      <CardContent className="flex items-center gap-3 p-3.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold text-foreground tabular-nums leading-none mt-0.5">{value}</p>
          {badge && (
            <p className="text-[10px] font-semibold text-primary mt-0.5 truncate">{badge}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
