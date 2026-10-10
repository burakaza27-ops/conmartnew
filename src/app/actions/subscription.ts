// =============================================================================
// ConMart — Subscription Server Actions
// =============================================================================
// Manages the supplier subscription lifecycle:
// - Suppliers view plans, submit Telebirr/CBE/Bank payment references.
// - Admins review & approve payments, setting ACTIVE status and expiry.
// - Suppliers query real-time Leads Dashboard analytics.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  getSubscriptionPlans,
  submitSubscriptionPayment,
  reviewSubscriptionPayment,
  updateSubscriptionPlan,
  getSupplierLeadsSummary,
} from "@/lib/subscription/subscription-service";
import {
  submitSubscriptionPaymentSchema,
  SubmitSubscriptionPaymentInput,
} from "@/lib/validations";
import { toSafeErrorMessage } from "@/lib/errors";
import { WalletTxStatus } from "@prisma/client";

/**
 * Public/Seller: Retrieves all currently active subscription plans.
 */
export async function getSubscriptionPlansAction() {
  try {
    const plans = await getSubscriptionPlans();
    return { success: true as const, data: plans };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "getSubscriptionPlansAction") };
  }
}

/**
 * Seller: Submits a payment receipt reference (Telebirr, CBE Birr, Bank Transfer)
 * for a chosen subscription tier.
 */
export async function submitSubscriptionPaymentAction(input: SubmitSubscriptionPaymentInput) {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const parsed = submitSubscriptionPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message || "Invalid payment details submitted",
    };
  }

  try {
    const payment = await submitSubscriptionPayment({
      sellerId: auth.user.id,
      tier: parsed.data.tier,
      paymentMethod: parsed.data.paymentMethod,
      referenceCode: parsed.data.referenceCode,
      slipUrl: parsed.data.slipUrl || undefined,
    });

    revalidatePath("/seller/subscription");
    revalidatePath("/seller/dashboard");
    revalidatePath("/admin/command-center");

    return {
      success: true as const,
      data: {
        paymentId: payment.id,
        referenceCode: payment.referenceCode,
        amount: Number(payment.amount),
        status: payment.status,
      },
    };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "submitSubscriptionPaymentAction") };
  }
}

/**
 * Seller: Fetches their past subscription payment requests.
 */
export async function getMySubscriptionPaymentsAction() {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const payments = await db.subscriptionPayment.findMany({
      where: { sellerId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      success: true as const,
      data: payments.map((p) => ({
        id: p.id,
        tier: p.tier,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        referenceCode: p.referenceCode,
        slipUrl: p.slipUrl,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "getMySubscriptionPaymentsAction") };
  }
}

/**
 * Seller: Retrieves the real-time Leads Dashboard metrics.
 */
export async function getSupplierLeadsSummaryAction() {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const summary = await getSupplierLeadsSummary(auth.user.id);
    return { success: true as const, data: summary };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "getSupplierLeadsSummaryAction") };
  }
}

/**
 * Admin: Fetches pending subscription payments requiring verification.
 */
export async function getPendingSubscriptionPaymentsAction() {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const payments = await db.subscriptionPayment.findMany({
      where: { status: WalletTxStatus.PENDING },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true as const,
      data: payments.map((p) => ({
        id: p.id,
        sellerId: p.sellerId,
        sellerName: p.seller.name,
        companyName: p.seller.companyName,
        sellerPhone: p.seller.phone,
        tier: p.tier,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        referenceCode: p.referenceCode,
        slipUrl: p.slipUrl,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "getPendingSubscriptionPaymentsAction") };
  }
}

/**
 * Admin: Approves or rejects a subscription payment.
 */
export async function reviewSubscriptionPaymentAction(params: {
  paymentId: string;
  approved: boolean;
  notes?: string;
}) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const updated = await reviewSubscriptionPayment({
      paymentId: params.paymentId,
      adminId: auth.user.id,
      approved: params.approved,
      notes: params.notes,
    });

    revalidatePath("/admin/command-center");
    revalidatePath("/admin/subscriptions");
    revalidatePath("/seller/subscription");
    revalidatePath("/seller/dashboard");

    return { success: true as const, data: updated };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "reviewSubscriptionPaymentAction") };
  }
}

/**
 * Admin: Updates subscription plan pricing or details.
 */
export async function updateSubscriptionPlanAction(params: {
  planId: string;
  data: {
    name?: string;
    priceETB?: number;
    durationDays?: number;
    description?: string;
    features?: string[];
  };
}) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const updated = await updateSubscriptionPlan(params.planId, params.data);
    revalidatePath("/seller/subscription");
    revalidatePath("/admin/command-center");
    return { success: true as const, data: updated };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "updateSubscriptionPlanAction") };
  }
}

