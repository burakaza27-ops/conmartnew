// =============================================================================
// ConMart — Wallet Server Actions
// =============================================================================
// Suppliers view balances and submit offline deposits; administrators settle
// them. Deposits are credited only after a human matches the reference against
// the Telebirr or bank statement, because ConMart has no payment-gateway
// callback to confirm receipt.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { authorize } from "@/lib/auth/session";
import {
  getOrCreateSellerWallet,
  submitWalletTopUpRequest,
  approveTopUpRequest,
  rejectTopUpRequest,
} from "@/lib/wallet/wallet-service";
import { createNotification } from "@/lib/notifications";
import { topUpRequestSchema } from "@/lib/validations";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import { toSafeErrorMessage } from "@/lib/errors";
import { WalletTxStatus } from "@prisma/client";

export async function getSellerWalletAction() {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const summary = await getOrCreateSellerWallet(auth.user.id);

  const [transactions, topUps] = await Promise.all([
    db.walletTransaction.findMany({
      where: { walletId: summary.walletId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.topUpRequest.findMany({
      where: { sellerId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    success: true as const,
    data: {
      ...summary,
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        amount: Number(transaction.amount),
        type: transaction.type,
        status: transaction.status,
        reference: transaction.reference,
        description: transaction.description,
        balanceAfterCash: Number(transaction.balanceAfterCash),
        balanceAfterCredit: Number(transaction.balanceAfterCredit),
        createdAt: transaction.createdAt.toISOString(),
      })),
      pendingTopUps: topUps.map((topUp) => ({
        id: topUp.id,
        amount: Number(topUp.amount),
        paymentMethod: topUp.paymentMethod,
        referenceCode: topUp.referenceCode,
        status: topUp.status,
        createdAt: topUp.createdAt.toISOString(),
      })),
    },
  };
}

export async function submitTopUpRequestAction(formData: FormData) {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const rawAmount = formData.get("amount");
  const parsed = topUpRequestSchema.safeParse({
    amount: rawAmount === null ? undefined : Number(rawAmount),
    paymentMethod: formData.get("paymentMethod") ?? "TELEBIRR",
    referenceCode: formData.get("referenceCode") ?? "",
    slipUrl: formData.get("slipUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid deposit details.",
    };
  }

  // Each pending request costs an administrator a manual reconciliation, so
  // the submission rate is capped per supplier.
  const clientId = await getClientIdentifier();
  const [byUser, byIp] = await Promise.all([
    rateLimit(`topup:user:${auth.user.id}`, { limit: 10, windowSeconds: 3600 }),
    rateLimit(`topup:ip:${clientId}`, { limit: 20, windowSeconds: 3600 }),
  ]);

  if (!byUser.allowed || !byIp.allowed) {
    return {
      success: false as const,
      error: rateLimitMessage(
        Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds)
      ),
    };
  }

  try {
    const topUp = await submitWalletTopUpRequest({
      sellerId: auth.user.id,
      ...parsed.data,
    });

    revalidatePath("/seller/wallet");
    revalidatePath("/admin/command-center");
    return { success: true as const, data: { topUpId: topUp.id } };
  } catch (error) {
    return {
      success: false as const,
      error: toSafeErrorMessage(error, "submitTopUpRequest"),
    };
  }
}

export async function approveTopUpAction(topUpId: string) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const result = await approveTopUpRequest({ topUpId, adminUserId: auth.user.id });

    await createNotification({
      userId: result.sellerId,
      type: "WALLET_TOPPED_UP",
      title: "Deposit Approved",
      body: `Your wallet deposit of ETB ${result.amount} has been verified and added to your balance (Ref: ${result.referenceCode}).`,
      meta: { topUpId, amount: result.amount },
    });

    revalidatePath("/admin/command-center");
    revalidatePath("/seller/wallet");
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: toSafeErrorMessage(error, "approveTopUp"),
    };
  }
}

export async function rejectTopUpAction(topUpId: string, reason?: string) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const result = await rejectTopUpRequest({
      topUpId,
      adminUserId: auth.user.id,
      reason,
    });

    revalidatePath("/admin/command-center");
    revalidatePath("/seller/wallet");
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: toSafeErrorMessage(error, "rejectTopUp"),
    };
  }
}

export async function getAdminPendingTopUpsAction() {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const topUps = await db.topUpRequest.findMany({
    where: { status: WalletTxStatus.PENDING },
    include: {
      seller: { select: { id: true, name: true, companyName: true, phone: true } },
      wallet: { select: { cashBalance: true, creditBalance: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true as const,
    data: topUps.map((topUp) => ({
      id: topUp.id,
      amount: Number(topUp.amount),
      paymentMethod: topUp.paymentMethod,
      referenceCode: topUp.referenceCode,
      slipUrl: topUp.slipUrl,
      createdAt: topUp.createdAt.toISOString(),
      sellerName: topUp.seller.name,
      sellerCompany: topUp.seller.companyName,
      sellerPhone: topUp.seller.phone,
      currentBalance:
        Number(topUp.wallet.cashBalance) + Number(topUp.wallet.creditBalance),
    })),
  };
}
