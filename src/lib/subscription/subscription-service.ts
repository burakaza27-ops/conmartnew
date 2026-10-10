// =============================================================================
// ConMart — Subscription & Supplier Leads Engine
// =============================================================================
// Implements the new recurring subscription revenue model:
// 1. Configurable Subscription Plans (Basic, Premium, Featured).
// 2. Admin-confirmed manual offline/mobile payments (Telebirr, CBE, Bank).
// 3. Automated expiry & visibility-drop rules (data retained, never deleted).
// 4. Critical Supplier Leads Dashboard analytics (views, calls, WhatsApp, directions).
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import {
  SubscriptionTier,
  SubscriptionStatus,
  PaymentMethod,
  WalletTxStatus,
  SupplierLeadEventType,
} from "@prisma/client";

export interface SubscriptionPlanItem {
  id: string;
  tier: SubscriptionTier;
  name: string;
  priceETB: number;
  durationDays: number;
  description: string;
  features: string[];
  isActive: boolean;
}

export interface SupplierLeadsDashboardSummary {
  // Current subscription status
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  daysRemaining: number;
  isExpired: boolean;
  needsRenewalNotice: boolean;

  // Real-time telemetry
  weeklyViews: number;
  monthlyViews: number;
  weeklyCallClicks: number;
  weeklyWhatsAppClicks: number;
  weeklyDirectionsClicks: number;
  weeklyAgentDeliveredLeads: number;

  totalInteractionsThisWeek: number;
  totalInteractionsLastWeek: number;
  weeklyGrowthPercentage: number;
}

/**
 * Fetches all available subscription plans.
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlanItem[]> {
  const plans = await db.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceETB: "asc" },
  });

  return plans.map((p) => ({
    id: p.id,
    tier: p.tier,
    name: p.name,
    priceETB: Number(p.priceETB),
    durationDays: p.durationDays,
    description: p.description,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    isActive: p.isActive,
  }));
}

/**
 * Admin action: Updates an existing subscription plan's pricing, name, or duration.
 */
export async function updateSubscriptionPlan(
  planId: string,
  data: {
    name?: string;
    priceETB?: number;
    durationDays?: number;
    description?: string;
    features?: string[];
  }
) {
  return db.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.priceETB !== undefined && { priceETB: data.priceETB }),
      ...(data.durationDays !== undefined && { durationDays: data.durationDays }),
      ...(data.description && { description: data.description }),
      ...(data.features && { features: data.features as never }),
    },
  });
}

/**
 * Supplier submits a manual subscription payment request (Telebirr, CBE Birr, Bank).
 * Normalizes referenceCode to uppercase/trimmed and enforces uniqueness.
 */
export async function submitSubscriptionPayment(params: {
  sellerId: string;
  tier: SubscriptionTier;
  paymentMethod: PaymentMethod;
  referenceCode: string;
  slipUrl?: string;
}) {
  const plan = await db.subscriptionPlan.findUnique({
    where: { tier: params.tier },
  });

  if (!plan) {
    throw new Error(`Plan for tier ${params.tier} not found`);
  }

  const normalizedRef = params.referenceCode.trim().toUpperCase();

  // Enforce global reference uniqueness to prevent duplicate submission floods or cross-seller reuse
  const existing = await db.subscriptionPayment.findUnique({
    where: { referenceCode: normalizedRef },
    select: { status: true },
  });

  if (existing && existing.status !== WalletTxStatus.FAILED) {
    throw new Error(
      existing.status === WalletTxStatus.PENDING
        ? "A subscription payment with this reference code is already awaiting review."
        : "This subscription payment reference code has already been processed."
    );
  }

  // Create payment record in PENDING state
  const payment = await db.subscriptionPayment.create({
    data: {
      sellerId: params.sellerId,
      tier: params.tier,
      amount: plan.priceETB,
      paymentMethod: params.paymentMethod,
      referenceCode: normalizedRef,
      slipUrl: params.slipUrl,
      status: WalletTxStatus.PENDING,
    },
  });

  // Mark profile as pending confirmation
  await db.sellerProfile.update({
    where: { userId: params.sellerId },
    data: {
      subscriptionStatus: SubscriptionStatus.PENDING_CONFIRMATION,
    },
  });

  return payment;
}

/**
 * Admin reviews and confirms/rejects a subscription payment.
 * Hardened with atomic conditional update (`updateMany` guarding `status: PENDING`)
 * to completely eliminate TOCTOU race conditions and double-crediting bugs.
 */
export async function reviewSubscriptionPayment(params: {
  paymentId: string;
  adminId: string;
  approved: boolean;
  notes?: string;
}) {
  const payment = await db.subscriptionPayment.findUnique({
    where: { id: params.paymentId },
    include: { seller: { include: { sellerProfile: true } } },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  const now = new Date();

  return db.$transaction(async (tx) => {
    // Atomic state guard: only transition if currently in PENDING status
    const updateResult = await tx.subscriptionPayment.updateMany({
      where: {
        id: params.paymentId,
        status: WalletTxStatus.PENDING,
      },
      data: {
        status: params.approved ? WalletTxStatus.COMPLETED : WalletTxStatus.FAILED,
        reviewedBy: params.adminId,
        reviewedAt: now,
        notes: params.notes || (params.approved ? undefined : "Rejected by admin"),
      },
    });

    if (updateResult.count === 0) {
      throw new Error("Payment has already been processed or is no longer pending.");
    }

    if (params.approved) {
      const plan = await tx.subscriptionPlan.findUnique({
        where: { tier: payment.tier },
      });
      const durationDays = plan?.durationDays ?? 30;

      const currentExpiry = payment.seller.sellerProfile?.subscriptionExpiresAt;
      const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await tx.sellerProfile.update({
        where: { userId: payment.sellerId },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionTier: payment.tier,
          subscriptionExpiresAt: newExpiry,
        },
      });
    }

    return tx.subscriptionPayment.findUniqueOrThrow({
      where: { id: params.paymentId },
    });
  });
}

// -----------------------------------------------------------------------------
// Telemetry Event Buffering
// -----------------------------------------------------------------------------

interface BufferedLeadEvent {
  sellerId: string;
  eventType: SupplierLeadEventType;
  listingId?: string | null;
  buyerPhone?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const TELEMETRY_BUFFER: BufferedLeadEvent[] = [];
const BUFFER_MAX_SIZE = 50;
const FLUSH_INTERVAL_MS = 3000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export async function flushTelemetryBuffer() {
  if (TELEMETRY_BUFFER.length === 0) return;
  const batch = TELEMETRY_BUFFER.splice(0, TELEMETRY_BUFFER.length);

  try {
    await db.supplierLeadEvent.createMany({
      data: batch.map((item) => ({
        sellerId: item.sellerId,
        eventType: item.eventType,
        listingId: item.listingId || null,
        buyerPhone: item.buyerPhone || null,
        metadata: item.metadata as never,
        createdAt: item.createdAt,
      })),
    });
  } catch (err) {
    console.error("Telemetry batch flush error (non-fatal):", err);
  }
}

function scheduleTelemetryFlush() {
  if (!flushTimer) {
    flushTimer = setTimeout(async () => {
      flushTimer = null;
      await flushTelemetryBuffer();
    }, FLUSH_INTERVAL_MS);
    if (typeof flushTimer.unref === "function") {
      flushTimer.unref();
    }
  }
}

/**
 * Telemetry: Records interaction events on a supplier's listing or store.
 * Buffers events in memory and flushes in batches using createMany to prevent
 * saturating the database connection pool on high-frequency traffic.
 */
export async function logSupplierLeadEvent(params: {
  sellerId: string;
  eventType: SupplierLeadEventType;
  listingId?: string;
  buyerPhone?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    TELEMETRY_BUFFER.push({
      sellerId: params.sellerId,
      eventType: params.eventType,
      listingId: params.listingId || null,
      buyerPhone: params.buyerPhone || null,
      metadata: params.metadata || {},
      createdAt: new Date(),
    });

    if (TELEMETRY_BUFFER.length >= BUFFER_MAX_SIZE) {
      await flushTelemetryBuffer();
    } else {
      scheduleTelemetryFlush();
    }
    return { queued: true };
  } catch (err) {
    // Non-fatal telemetry logging
    console.error("Failed to buffer supplier lead event:", err);
    return null;
  }
}

/**
 * Supplier Leads Dashboard Analytics Engine
 * Database-Level Analytics Aggregation:
 * Pushes groupings and counts directly into PostgreSQL via `groupBy` and `count`,
 * completely eliminating raw event array loading into Node.js V8 heap.
 */
export async function getSupplierLeadsSummary(sellerId: string): Promise<SupplierLeadsDashboardSummary> {
  const profile = await db.sellerProfile.findUnique({
    where: { userId: sellerId },
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Run analytics aggregation queries in parallel at the database level
  const [
    weeklyGrouped,
    lastWeekInteractions,
    monthlyViewsCount,
  ] = await Promise.all([
    // Group this week's events by type directly in PostgreSQL
    db.supplierLeadEvent.groupBy({
      by: ["eventType"],
      where: {
        sellerId,
        createdAt: { gte: oneWeekAgo },
      },
      _count: {
        eventType: true,
      },
    }),

    // Count previous week's interactions (excluding views) in PostgreSQL
    db.supplierLeadEvent.count({
      where: {
        sellerId,
        createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        eventType: { not: SupplierLeadEventType.VIEW },
      },
    }),

    // Monthly views count in PostgreSQL
    db.supplierLeadEvent.count({
      where: {
        sellerId,
        eventType: SupplierLeadEventType.VIEW,
        createdAt: { gte: oneMonthAgo },
      },
    }),
  ]);

  let weeklyViews = 0;
  let weeklyCallClicks = 0;
  let weeklyWhatsAppClicks = 0;
  let weeklyDirectionsClicks = 0;
  let weeklyAgentDeliveredLeads = 0;

  for (const row of weeklyGrouped) {
    const count = row._count.eventType;
    switch (row.eventType) {
      case SupplierLeadEventType.VIEW:
        weeklyViews = count;
        break;
      case SupplierLeadEventType.CALL_CLICK:
        weeklyCallClicks = count;
        break;
      case SupplierLeadEventType.WHATSAPP_CLICK:
        weeklyWhatsAppClicks = count;
        break;
      case SupplierLeadEventType.DIRECTIONS_CLICK:
        weeklyDirectionsClicks = count;
        break;
      case SupplierLeadEventType.AGENT_DELIVERED:
        weeklyAgentDeliveredLeads = count;
        break;
    }
  }

  const thisWeekInteractions =
    weeklyCallClicks + weeklyWhatsAppClicks + weeklyDirectionsClicks + weeklyAgentDeliveredLeads;

  let growthPercentage = 0;
  if (lastWeekInteractions === 0) {
    growthPercentage = thisWeekInteractions > 0 ? 100 : 0;
  } else {
    growthPercentage = Math.round(((thisWeekInteractions - lastWeekInteractions) / lastWeekInteractions) * 100);
  }

  const expiresAt = profile?.subscriptionExpiresAt || null;
  const isExpired = expiresAt ? expiresAt < now : true;
  const daysRemaining = expiresAt && !isExpired
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    tier: profile?.subscriptionTier || SubscriptionTier.BASIC,
    status: profile?.subscriptionStatus || SubscriptionStatus.FREE,
    expiresAt,
    daysRemaining,
    isExpired,
    needsRenewalNotice: !isExpired && daysRemaining <= 7,

    weeklyViews,
    monthlyViews: monthlyViewsCount,
    weeklyCallClicks,
    weeklyWhatsAppClicks,
    weeklyDirectionsClicks,
    weeklyAgentDeliveredLeads,

    totalInteractionsThisWeek: thisWeekInteractions,
    totalInteractionsLastWeek: lastWeekInteractions,
    weeklyGrowthPercentage: growthPercentage,
  };
}
