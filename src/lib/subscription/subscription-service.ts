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

  // Create payment record in PENDING state
  const payment = await db.subscriptionPayment.create({
    data: {
      sellerId: params.sellerId,
      tier: params.tier,
      amount: plan.priceETB,
      paymentMethod: params.paymentMethod,
      referenceCode: params.referenceCode.trim(),
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
 * When approved, sets subscription status to ACTIVE and calculates new expiry.
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

  if (payment.status !== WalletTxStatus.PENDING) {
    throw new Error("Payment has already been processed");
  }

  if (!params.approved) {
    return db.subscriptionPayment.update({
      where: { id: params.paymentId },
      data: {
        status: WalletTxStatus.FAILED,
        reviewedBy: params.adminId,
        reviewedAt: new Date(),
        notes: params.notes || "Rejected by admin",
      },
    });
  }

  const plan = await db.subscriptionPlan.findUnique({
    where: { tier: payment.tier },
  });
  const durationDays = plan?.durationDays ?? 30;

  const now = new Date();
  const currentExpiry = payment.seller.sellerProfile?.subscriptionExpiresAt;
  const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Run update in transaction
  return db.$transaction(async (tx) => {
    const updatedPayment = await tx.subscriptionPayment.update({
      where: { id: params.paymentId },
      data: {
        status: WalletTxStatus.COMPLETED,
        reviewedBy: params.adminId,
        reviewedAt: now,
        notes: params.notes,
      },
    });

    await tx.sellerProfile.update({
      where: { userId: payment.sellerId },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionTier: payment.tier,
        subscriptionExpiresAt: newExpiry,
      },
    });

    return updatedPayment;
  });
}

/**
 * Telemetry: Records interaction events on a supplier's listing or store.
 */
export async function logSupplierLeadEvent(params: {
  sellerId: string;
  eventType: SupplierLeadEventType;
  listingId?: string;
  buyerPhone?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await db.supplierLeadEvent.create({
      data: {
        sellerId: params.sellerId,
        eventType: params.eventType,
        listingId: params.listingId,
        buyerPhone: params.buyerPhone,
        metadata: (params.metadata as never) || {},
      },
    });
  } catch (err) {
    // Non-fatal telemetry logging
    console.error("Failed to log supplier lead event:", err);
    return null;
  }
}

/**
 * Supplier Leads Dashboard Analytics Engine
 * Calculates views, direct calls, WhatsApp taps, directions, and trend comparisons.
 */
export async function getSupplierLeadsSummary(sellerId: string): Promise<SupplierLeadsDashboardSummary> {
  const profile = await db.sellerProfile.findUnique({
    where: { userId: sellerId },
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Run analytics aggregation queries in parallel
  const [
    weeklyEvents,
    previousWeekEvents,
    monthlyViewsCount,
  ] = await Promise.all([
    // This week's events
    db.supplierLeadEvent.findMany({
      where: {
        sellerId,
        createdAt: { gte: oneWeekAgo },
      },
      select: { eventType: true },
    }),

    // Previous week's events (for trend comparison)
    db.supplierLeadEvent.findMany({
      where: {
        sellerId,
        createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
      },
      select: { eventType: true },
    }),

    // Monthly views
    db.supplierLeadEvent.count({
      where: {
        sellerId,
        eventType: SupplierLeadEventType.VIEW,
        createdAt: { gte: oneMonthAgo },
      },
    }),
  ]);

  // Aggregate this week
  let weeklyViews = 0;
  let weeklyCallClicks = 0;
  let weeklyWhatsAppClicks = 0;
  let weeklyDirectionsClicks = 0;
  let weeklyAgentDeliveredLeads = 0;

  for (const ev of weeklyEvents) {
    if (ev.eventType === SupplierLeadEventType.VIEW) weeklyViews++;
    else if (ev.eventType === SupplierLeadEventType.CALL_CLICK) weeklyCallClicks++;
    else if (ev.eventType === SupplierLeadEventType.WHATSAPP_CLICK) weeklyWhatsAppClicks++;
    else if (ev.eventType === SupplierLeadEventType.DIRECTIONS_CLICK) weeklyDirectionsClicks++;
    else if (ev.eventType === SupplierLeadEventType.AGENT_DELIVERED) weeklyAgentDeliveredLeads++;
  }

  const thisWeekInteractions = weeklyCallClicks + weeklyWhatsAppClicks + weeklyDirectionsClicks + weeklyAgentDeliveredLeads;
  const lastWeekInteractions = previousWeekEvents.filter(
    (e) => e.eventType !== SupplierLeadEventType.VIEW
  ).length;

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
