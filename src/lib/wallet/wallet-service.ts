// =============================================================================
// ConMart — Seller Wallet & Introduction Unlock Revenue Service
// =============================================================================
// Implements the core commercial model:
// 1. Dual-balance seller wallet (Cash vs Non-Withdrawable Credit).
// 2. Category-based Introduction Unlock fee deductions upon Enquiry acceptance.
// 3. Strict revenue event recording via immutable UnlockRecord.
// 4. Deal failure refund-as-credit flow (credited to non-withdrawable creditBalance).
// 5. Telebirr/Bank top-up request processing and administrative settlement.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { roundCurrency } from "@/lib/money";
import {
  calculateRefundAmount,
  splitUnlockPayment,
  totalSpendable,
} from "@/lib/wallet/accounting";
import {
  Prisma,
  WalletTxType,
  WalletTxStatus,
  OutcomeType,
  RefundStatus,
  EnquiryStatus,
} from "@prisma/client";

export interface WalletBalanceSummary {
  walletId: string;
  sellerId: string;
  cashBalance: number;
  creditBalance: number;
  totalSpendable: number;
}

/**
 * Retrieves or lazily creates a seller's prepaid wallet.
 */
export async function getOrCreateSellerWallet(
  sellerId: string
): Promise<WalletBalanceSummary> {
  let wallet = await db.wallet.findUnique({
    where: { sellerId },
  });

  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        sellerId,
        cashBalance: 0.0,
        creditBalance: 0.0,
      },
    });
  }

  const cash = Number(wallet.cashBalance);
  const credit = Number(wallet.creditBalance);

  return {
    walletId: wallet.id,
    sellerId: wallet.sellerId,
    cashBalance: cash,
    creditBalance: credit,
    totalSpendable: totalSpendable(cash, credit),
  };
}

/**
 * Checks whether the seller can afford an unlock fee.
 */
export async function canAffordUnlock(
  sellerId: string,
  feeAmount: number
): Promise<{ canAfford: boolean; totalSpendable: number; deficit: number }> {
  const wallet = await getOrCreateSellerWallet(sellerId);
  const canAfford = wallet.totalSpendable >= feeAmount;
  const deficit = canAfford ? 0 : feeAmount - wallet.totalSpendable;

  return {
    canAfford,
    totalSpendable: wallet.totalSpendable,
    deficit,
  };
}

/**
 * Executes the core revenue event: "The Contact Unlock"
 * Simultaneously deducts the unlock fee from the seller's wallet and reveals
 * the buyer & seller contact introduction.
 */
export async function executeUnlockIntroductionTransaction({
  enquiryId,
  sellerId,
  buyerId,
  feeAmount,
}: {
  enquiryId: string;
  sellerId: string;
  buyerId: string;
  feeAmount: number;
}) {
  return await db.$transaction(async (tx) => {
    // 1. Fetch enquiry and verify status
    const enquiry = await tx.enquiry.findUnique({
      where: { id: enquiryId },
      include: {
        buyer: { select: { id: true, name: true, phone: true, companyName: true } },
        seller: { select: { id: true, name: true, phone: true, companyName: true } },
        listing: { select: { id: true, location: true, product: { select: { title: true } } } },
      },
    });

    if (!enquiry) {
      throw new DomainError("Enquiry not found.");
    }

    if (enquiry.sellerId !== sellerId) {
      throw new DomainError("Enquiry seller does not match the wallet being charged.");
    }

    if (enquiry.status !== EnquiryStatus.PENDING) {
      throw new DomainError(
        `This enquiry is already ${enquiry.status.toLowerCase()} and cannot be unlocked again.`
      );
    }

    // 2. Advance the enquiry from PENDING to ACCEPTED first with atomic updateMany.
    // This locks the enquiry and guarantees that any concurrent decline or accept
    // attempt fails before any wallet balance is deducted or ledger record created.
    const accepted = await tx.enquiry.updateMany({
      where: { id: enquiry.id, status: EnquiryStatus.PENDING },
      data: {
        status: EnquiryStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    if (accepted.count !== 1) {
      throw new DomainError(
        "This enquiry was already answered or declined from another session. No fee has been charged."
      );
    }

    // 3. Fetch or create seller wallet
    let wallet = await tx.wallet.findUnique({
      where: { sellerId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { sellerId, cashBalance: 0.0, creditBalance: 0.0 },
      });
    }

    const currentCash = Number(wallet.cashBalance);
    const currentCredit = Number(wallet.creditBalance);

    const { fromCredit: creditDeduction, fromCash: cashDeduction } =
      splitUnlockPayment(feeAmount, currentCredit, currentCash);

    const newCredit = roundCurrency(currentCredit - creditDeduction);
    const newCash = roundCurrency(currentCash - cashDeduction);

    // 4. Debit the wallet, guarding on the balances we just read.
    //
    // Two enquiries accepted at the same moment would otherwise both pass the
    // affordability check and both write an absolute balance, letting the
    // second overwrite the first and spend the same birr twice. Matching on
    // the prior balances makes the loser of the race update zero rows.
    const debited = await tx.wallet.updateMany({
      where: {
        id: wallet.id,
        cashBalance: new Prisma.Decimal(currentCash),
        creditBalance: new Prisma.Decimal(currentCredit),
      },
      data: {
        cashBalance: new Prisma.Decimal(newCash),
        creditBalance: new Prisma.Decimal(newCredit),
      },
    });

    if (debited.count !== 1) {
      throw new DomainError(
        "Your wallet balance changed while this introduction was being unlocked. Please try again."
      );
    }

    // 5. Record immutable wallet ledger entry
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(-feeAmount),
        type: WalletTxType.UNLOCK_FEE,
        status: WalletTxStatus.COMPLETED,
        reference: `UNLOCK-${enquiry.referenceCode}`,
        description: `Contact Unlock Introduction for #${enquiry.referenceCode} (${enquiry.listing.product.title})`,
        balanceAfterCash: new Prisma.Decimal(newCash),
        balanceAfterCredit: new Prisma.Decimal(newCredit),
      },
    });

    // 6. Create the revenue record. The unique constraint on `enquiry_id` is
    //    the final backstop against charging twice for one introduction.
    const unlockRecord = await tx.unlockRecord.create({
      data: {
        enquiryId: enquiry.id,
        sellerId,
        buyerId,
        feeAmount: new Prisma.Decimal(feeAmount),
        paidFromCash: new Prisma.Decimal(cashDeduction),
        paidFromCredit: new Prisma.Decimal(creditDeduction),
        sellerReportedOutcome: OutcomeType.PENDING,
        buyerOutcomeResponse: OutcomeType.PENDING,
        refundStatus: RefundStatus.NONE,
      },
    });

    // Prisma Decimal fields are class instances and cannot cross the server
    // action boundary, so amounts are converted to numbers here rather than
    // returning the record itself.
    return {
      success: true as const,
      unlockRecordId: unlockRecord.id,
      feeAmount: roundCurrency(feeAmount),
      paidFromCredit: creditDeduction,
      paidFromCash: cashDeduction,
      walletBalances: {
        cashBalance: newCash,
        creditBalance: newCredit,
        totalSpendable: totalSpendable(newCash, newCredit),
      },
      buyerContact: {
        name: enquiry.buyer.name,
        companyName: enquiry.buyer.companyName,
        phone: enquiry.buyer.phone,
        deliveryAddress: enquiry.deliveryAddress,
      },
      sellerContact: {
        name: enquiry.seller.name,
        companyName: enquiry.seller.companyName,
        phone: enquiry.seller.phone,
        depotLocation: enquiry.listing.location,
      },
    };
  });
}

/**
 * Processes a deal failure refund: Returns a majority percentage of the unlock fee
 * back to the seller's wallet as NON-WITHDRAWABLE creditBalance.
 */
export async function processDealFailureRefund({
  unlockRecordId,
  refundPercentage = 80,
  reason,
}: {
  unlockRecordId: string;
  refundPercentage?: number;
  reason?: string;
}) {
  return await db.$transaction(async (tx) => {
    const unlockRecord = await tx.unlockRecord.findUnique({
      where: { id: unlockRecordId },
      include: {
        enquiry: { select: { referenceCode: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    if (!unlockRecord) {
      throw new DomainError("Unlock record not found.");
    }

    if (unlockRecord.refundStatus !== RefundStatus.NONE) {
      throw new DomainError(
        "A refund for this introduction has already been processed."
      );
    }

    const refundAmount = calculateRefundAmount(
      Number(unlockRecord.feeAmount),
      refundPercentage
    );

    const wallet = await tx.wallet.findUnique({
      where: { sellerId: unlockRecord.sellerId },
    });

    if (!wallet) {
      throw new DomainError("Seller wallet not found.");
    }

    // Credit is added with an atomic increment rather than an absolute write,
    // so a concurrent unlock debiting the same wallet cannot be clobbered. The
    // returned row supplies the true post-update balances for the ledger.
    const creditedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { creditBalance: { increment: new Prisma.Decimal(refundAmount) } },
    });

    const currentCash = Number(creditedWallet.cashBalance);
    const newCredit = Number(creditedWallet.creditBalance);

    // Ledger transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(refundAmount),
        type: WalletTxType.REFUND_CREDIT,
        status: WalletTxStatus.COMPLETED,
        reference: `REFUND-${unlockRecord.enquiry.referenceCode}`,
        description: `Deal Failure Refund Credit (${refundPercentage}%) for #${unlockRecord.enquiry.referenceCode}: ${reason || "Deal did not materialize"}`,
        balanceAfterCash: new Prisma.Decimal(currentCash),
        balanceAfterCredit: new Prisma.Decimal(newCredit),
      },
    });

    // Guarding on RefundStatus.NONE makes a concurrent second refund attempt
    // update zero rows and roll the whole transaction back.
    const settled = await tx.unlockRecord.updateMany({
      where: { id: unlockRecordId, refundStatus: RefundStatus.NONE },
      data: {
        refundStatus: RefundStatus.REFUNDED_CREDIT,
        refundCreditAmount: new Prisma.Decimal(refundAmount),
        sellerReportedOutcome: OutcomeType.FAILURE,
      },
    });

    if (settled.count !== 1) {
      throw new DomainError(
        "A refund for this introduction has already been processed."
      );
    }

    // Update seller metrics. Read back by suspendSellerIfUnreliable to decide
    // whether this supplier's failure rate warrants suspension.
    // If the seller already self-reported failure, failedDealsCount was already incremented.
    if (unlockRecord.sellerReportedOutcome !== OutcomeType.FAILURE) {
      await tx.sellerProfile.upsert({
        where: { userId: unlockRecord.sellerId },
        update: {
          failedDealsCount: { increment: 1 },
        },
        create: {
          userId: unlockRecord.sellerId,
          failedDealsCount: 1,
        },
      });
    }

    return {
      success: true as const,
      unlockRecordId,
      refundAmount,
      newCreditBalance: newCredit,
    };
  });
}

/**
 * Submits a new wallet top-up request (Telebirr, CBE Bank, etc.)
 */
export async function submitWalletTopUpRequest({
  sellerId,
  amount,
  paymentMethod,
  referenceCode,
  slipUrl,
}: {
  sellerId: string;
  amount: number;
  paymentMethod: "TELEBIRR" | "CBE_BANK" | "AWASH_BANK" | "CASH_DEPOSIT";
  referenceCode: string;
  slipUrl?: string;
}) {
  const wallet = await getOrCreateSellerWallet(sellerId);

  const normalizedRef = referenceCode.trim().toUpperCase();

  // One bank reference corresponds to one real deposit globally. Submitting it twice —
  // across accounts or deliberately — would put two claims on the same transfer.
  const duplicate = await db.topUpRequest.findFirst({
    where: {
      referenceCode: normalizedRef,
      status: { in: [WalletTxStatus.PENDING, WalletTxStatus.COMPLETED] },
    },
    select: { status: true },
  });

  if (duplicate) {
    throw new DomainError(
      duplicate.status === WalletTxStatus.PENDING
        ? "A deposit with this reference is already awaiting review."
        : "This deposit reference has already been credited to your wallet."
    );
  }

  return db.topUpRequest.create({
    data: {
      sellerId,
      walletId: wallet.walletId,
      amount: new Prisma.Decimal(amount),
      paymentMethod,
      referenceCode: normalizedRef,
      slipUrl,
      status: WalletTxStatus.PENDING,
    },
    select: { id: true },
  });
}

/**
 * Admin approves a top-up request and credits the seller's cash balance.
 */
export async function approveTopUpRequest({
  topUpId,
  adminUserId,
}: {
  topUpId: string;
  adminUserId: string;
}) {
  return await db.$transaction(async (tx) => {
    const topUp = await tx.topUpRequest.findUnique({
      where: { id: topUpId },
      include: { wallet: true },
    });

    if (!topUp) {
      throw new DomainError("Top-up request not found.");
    }

    // Claim the request before crediting anything. If a second administrator
    // approves the same deposit concurrently, this matches zero rows and the
    // transaction aborts before the wallet is credited twice.
    const claimed = await tx.topUpRequest.updateMany({
      where: { id: topUpId, status: WalletTxStatus.PENDING },
      data: {
        status: WalletTxStatus.COMPLETED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    if (claimed.count !== 1) {
      throw new DomainError(
        `This deposit has already been reviewed (${topUp.status.toLowerCase()}).`
      );
    }

    const creditAmount = Number(topUp.amount);

    const creditedWallet = await tx.wallet.update({
      where: { id: topUp.walletId },
      data: { cashBalance: { increment: new Prisma.Decimal(creditAmount) } },
    });

    const newCash = Number(creditedWallet.cashBalance);
    const currentCredit = Number(creditedWallet.creditBalance);

    // Create ledger entry
    await tx.walletTransaction.create({
      data: {
        walletId: topUp.walletId,
        amount: new Prisma.Decimal(creditAmount),
        type: WalletTxType.TOP_UP,
        status: WalletTxStatus.COMPLETED,
        reference: `TOPUP-${topUp.referenceCode}`,
        description: `Wallet deposit approved via ${topUp.paymentMethod} (Ref: ${topUp.referenceCode})`,
        balanceAfterCash: new Prisma.Decimal(newCash),
        balanceAfterCredit: new Prisma.Decimal(currentCredit),
      },
    });

    return {
      success: true as const,
      topUpId,
      sellerId: topUp.sellerId,
      referenceCode: topUp.referenceCode,
      amount: roundCurrency(creditAmount),
      newCashBalance: newCash,
    };
  });
}

/**
 * Admin rejects a top-up request.
 */
export async function rejectTopUpRequest({
  topUpId,
  adminUserId,
  reason,
}: {
  topUpId: string;
  adminUserId: string;
  reason?: string;
}) {
  const rejected = await db.topUpRequest.updateMany({
    where: { id: topUpId, status: WalletTxStatus.PENDING },
    data: {
      status: WalletTxStatus.FAILED,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  });

  if (rejected.count !== 1) {
    throw new DomainError(
      "This deposit could not be rejected because it is no longer pending review."
    );
  }

  // `reason` is recorded on the audit trail rather than the request row, which
  // has no field for it; see docs/ARCHITECTURE.md for the planned schema change.
  console.info(
    `Top-up ${topUpId} rejected by admin ${adminUserId}${reason ? `: ${reason}` : ""}`
  );

  return { success: true as const, topUpId, status: WalletTxStatus.FAILED };
}
