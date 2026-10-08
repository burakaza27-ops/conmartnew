// =============================================================================
// ConMart — Purchase Enquiry Domain Service
// =============================================================================
// Encapsulates the core domain logic for enquiry lifecycle operations:
//   - Assisted/direct buyer resolution
//   - Enquiry submission & initial ticket linking
//   - Seller acceptance (introduction unlock transaction)
//   - Seller decline (only valid from PENDING)
//   - Deal outcome reporting & automatic seller suspension
//   - Buyer deal failure confirmation & refund triggering
//   - Dispute raising & resolution
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { generateReferenceCode } from "@/lib/engine/reference-code";
import { filterLeakedContactText } from "@/lib/security/masking";
import { createNotification } from "@/lib/notifications";
import {
  executeUnlockIntroductionTransaction,
  processDealFailureRefund,
} from "@/lib/wallet/wallet-service";
import { getDealFailureRefundPercent } from "@/lib/config/env";
import { ensureDealTicketForEnquiry } from "@/lib/marketplace/service";
import { EnquiryStatus, OutcomeType, RefundStatus, UserRole } from "@prisma/client";
import type {
  PurchaseEnquiryInput,
  DealOutcomeInput,
  RaiseDisputeInput,
  ResolveDisputeInput,
} from "@/lib/validations";

/** A seller is suspended once they reach this many failed deals at or above the threshold rate. */
export const SUSPENSION_MIN_FAILED_DEALS = 4;
export const SUSPENSION_FAILURE_RATE = 0.6;

export interface UnlockResult {
  feeAmount: number;
  walletBalances: {
    cashBalance: number;
    creditBalance: number;
    totalSpendable: number;
  };
  buyerContact: {
    name: string;
    companyName: string | null;
    phone: string;
    deliveryAddress: string;
  };
}

export interface SubmitEnquiryResult {
  enquiryId: string;
  referenceCode: string;
}

export interface DealOutcomeResult {
  refundAmount?: number;
  awaitingConfirmation?: boolean;
}

export interface DealFailureConfirmResult {
  refundAmount: number;
}

export interface RaiseDisputeResult {
  disputeId: string;
}

type Caller = { id: string; role: string; name?: string | null };

/**
 * Determines whose enquiry this is.
 *
 * Field agents raise requests for contractors who walked into a depot. Those
 * contractors get a profile with no `authId`, so they cannot sign in until
 * they register themselves. Matching is restricted to those offline profiles:
 * without that restriction an agent could file enquiries in the name of any
 * registered buyer simply by knowing their phone number.
 */
export async function resolveEnquiryBuyer(
  caller: Caller,
  data: { onBehalfOfBuyerPhone?: string; onBehalfOfBuyerName?: string }
): Promise<{ buyerId: string; agentId: string | null }> {
  const isAssistedCapture =
    Boolean(data.onBehalfOfBuyerPhone) &&
    (caller.role === "FIELD_AGENT" || caller.role === "ADMIN");

  if (!isAssistedCapture) {
    if (data.onBehalfOfBuyerPhone) {
      throw new DomainError(
        "Only ConMart field agents can raise a request on behalf of another contractor."
      );
    }
    return { buyerId: caller.id, agentId: null };
  }

  const phone = data.onBehalfOfBuyerPhone!;

  const existingOfflineBuyer = await db.user.findFirst({
    where: { phone, role: "BUYER", authId: null },
    select: { id: true },
  });

  if (existingOfflineBuyer) {
    return { buyerId: existingOfflineBuyer.id, agentId: caller.id };
  }

  const registeredHolder = await db.user.findFirst({
    where: { phone, authId: { not: null } },
    select: { id: true },
  });

  if (registeredHolder) {
    throw new DomainError(
      "That phone number belongs to a registered ConMart account. Ask them to sign in and submit the request themselves."
    );
  }

  const offlineBuyer = await db.user.create({
    data: {
      authId: null,
      role: "BUYER",
      name: data.onBehalfOfBuyerName || "Assisted Contractor",
      phone,
      companyName: data.onBehalfOfBuyerName
        ? `${data.onBehalfOfBuyerName} (Site)`
        : "Offline Contractor",
    },
    select: { id: true },
  });

  return { buyerId: offlineBuyer.id, agentId: caller.id };
}

/**
 * Submits a new purchase enquiry against an active listing and wires the deal ticket.
 */
export async function submitPurchaseEnquiry(
  caller: Caller,
  data: PurchaseEnquiryInput
): Promise<SubmitEnquiryResult> {
  const { buyerId, agentId } = await resolveEnquiryBuyer(caller, data);

  const listing = await db.listing.findUnique({
    where: { id: data.listingId },
    include: {
      product: { select: { title: true, unit: true } },
      priceTiers: {
        select: { minQty: true, maxQty: true, unitPrice: true },
        orderBy: { minQty: "asc" },
      },
    },
  });

  if (!listing || !listing.active) {
    throw new DomainError("This material listing is no longer available.");
  }

  if (listing.sellerId === buyerId) {
    throw new DomainError(
      "You cannot submit a purchase request against your own listing."
    );
  }

  const enquiry = await db.enquiry.create({
    data: {
      referenceCode: generateReferenceCode("ENQ"),
      buyerId,
      sellerId: listing.sellerId,
      listingId: listing.id,
      agentId,
      qty: data.qty,
      unit: listing.product.unit,
      deliveryPreference: data.deliveryPreference,
      // Mask contact leaks from address and access constraints
      deliveryAddress: filterLeakedContactText(data.deliveryAddress),
      accessConstraints: data.accessConstraints
        ? filterLeakedContactText(data.accessConstraints)
        : null,
      requiredDate: data.requiredDate ? new Date(data.requiredDate) : undefined,
      status: EnquiryStatus.PENDING,
    },
    select: { id: true, referenceCode: true },
  });

  const matchedTier = listing.priceTiers.find(
    (tier) => data.qty >= tier.minQty && data.qty <= tier.maxQty
  );
  await ensureDealTicketForEnquiry({
    enquiryId: enquiry.id,
    buyerId,
    sellerId: listing.sellerId,
    listingId: listing.id,
    location: listing.location,
    orderTotal: matchedTier ? Number(matchedTier.unitPrice) * data.qty : 0,
  });

  await createNotification({
    userId: listing.sellerId,
    type: "ENQUIRY_RECEIVED",
    title: "New Purchase Enquiry",
    body: `Buyer requested ${data.qty} ${listing.product.unit.toLowerCase()} of ${listing.product.title}. Ref: ${enquiry.referenceCode}`,
    meta: { enquiryId: enquiry.id, referenceCode: enquiry.referenceCode },
  });

  return { enquiryId: enquiry.id, referenceCode: enquiry.referenceCode };
}

/**
 * Accepts an enquiry, debits the supplier unlock fee, and reveals contact details.
 */
export async function sellerAcceptEnquiry(
  caller: Caller,
  enquiryId: string
): Promise<UnlockResult> {
  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    select: {
      id: true,
      sellerId: true,
      buyerId: true,
      status: true,
      listing: {
        select: {
          product: {
            select: { category: { select: { unlockFee: true } } },
          },
        },
      },
    },
  });

  if (!enquiry) {
    throw new DomainError("Enquiry not found.");
  }

  if (enquiry.sellerId !== caller.id && caller.role !== "ADMIN") {
    throw new DomainError("You do not have permission to accept this enquiry.");
  }

  if (enquiry.status !== EnquiryStatus.PENDING) {
    throw new DomainError(`This enquiry is already ${enquiry.status.toLowerCase()}.`);
  }

  const result = await executeUnlockIntroductionTransaction({
    enquiryId: enquiry.id,
    sellerId: enquiry.sellerId,
    buyerId: enquiry.buyerId,
    feeAmount: Number(enquiry.listing.product.category.unlockFee),
  });

  await createNotification({
    userId: enquiry.buyerId,
    type: "ENQUIRY_ACCEPTED",
    title: "Enquiry Accepted & Introduced",
    body: "The supplier has accepted your request. Direct communication and contact details are unlocked.",
    meta: { enquiryId: enquiry.id },
  });

  return {
    feeAmount: result.feeAmount,
    walletBalances: result.walletBalances,
    buyerContact: result.buyerContact,
  };
}

/**
 * Declines an enquiry. Transition is only valid from PENDING.
 */
export async function sellerDeclineEnquiry(
  caller: Caller,
  enquiryId: string
): Promise<void> {
  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    select: { id: true, sellerId: true, buyerId: true, status: true },
  });

  if (!enquiry || (enquiry.sellerId !== caller.id && caller.role !== "ADMIN")) {
    throw new DomainError("Enquiry not found.");
  }

  // Declining after acceptance would strand a paid introduction, so the
  // transition is only legal from PENDING.
  if (enquiry.status !== EnquiryStatus.PENDING) {
    throw new DomainError(`This enquiry is already ${enquiry.status.toLowerCase()}.`);
  }

  const updated = await db.enquiry.updateMany({
    where: {
      id: enquiry.id,
      sellerId: caller.role === "ADMIN" ? undefined : caller.id,
      status: EnquiryStatus.PENDING,
    },
    data: { status: EnquiryStatus.DECLINED, respondedAt: new Date() },
  });

  if (updated.count !== 1) {
    throw new DomainError("This enquiry is no longer pending.");
  }

  await createNotification({
    userId: enquiry.buyerId,
    type: "ENQUIRY_DECLINED",
    title: "Enquiry Declined",
    body: "The supplier was unable to accept your purchase request at this time.",
    meta: { enquiryId: enquiry.id },
  });
}

/**
 * Reports the outcome of an unlocked deal (SUCCESS or FAILURE).
 */
export async function reportDealOutcome(
  caller: Caller,
  input: DealOutcomeInput
): Promise<DealOutcomeResult> {
  const { enquiryId, outcome, reason } = input;

  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    select: {
      id: true,
      sellerId: true,
      buyerId: true,
      status: true,
      unlockRecord: { select: { id: true, refundStatus: true } },
    },
  });

  if (!enquiry || !enquiry.unlockRecord) {
    throw new DomainError("No unlocked deal was found for this enquiry.");
  }

  if (enquiry.sellerId !== caller.id && caller.role !== "ADMIN") {
    throw new DomainError("You do not have permission to report on this deal.");
  }

  if (enquiry.status !== EnquiryStatus.ACCEPTED) {
    throw new DomainError(
      `The outcome for this deal has already been recorded as ${enquiry.status.toLowerCase()}.`
    );
  }

  if (outcome === "FAILURE") {
    // INVARIANT: Sellers MUST NOT unilaterally report FAILURE and refund themselves.
    // A refund is only granted via administrative mediation/approval or buyer confirmation.
    if (caller.role === "ADMIN") {
      const refund = await processDealFailureRefund({
        unlockRecordId: enquiry.unlockRecord.id,
        refundPercentage: getDealFailureRefundPercent(),
        reason,
      });

      await db.enquiry.update({
        where: { id: enquiry.id },
        data: { status: EnquiryStatus.FAILED },
      });

      await suspendSellerIfUnreliable(enquiry.sellerId);

      await createNotification({
        userId: enquiry.sellerId,
        type: "DEAL_FAILURE_REFUND",
        title: "Deal Refund Credited",
        body: `ETB ${refund.refundAmount} has been refunded to your wallet credit balance.`,
        meta: { enquiryId: enquiry.id, refundAmount: refund.refundAmount },
      });

      return { refundAmount: refund.refundAmount };
    }

    // Seller reports failure without self-refunding:
    await db.$transaction([
      db.unlockRecord.update({
        where: { id: enquiry.unlockRecord.id },
        data: { sellerReportedOutcome: OutcomeType.FAILURE },
      }),
      db.enquiry.update({
        where: { id: enquiry.id },
        data: { status: EnquiryStatus.FAILED },
      }),
      db.sellerProfile.upsert({
        where: { userId: enquiry.sellerId },
        update: { failedDealsCount: { increment: 1 } },
        create: { userId: enquiry.sellerId, failedDealsCount: 1 },
      }),
    ]);

    await suspendSellerIfUnreliable(enquiry.sellerId);

    await createNotification({
      userId: enquiry.buyerId,
      type: "DEAL_STATUS_CHANGED",
      title: "Supplier Reported Deal Incomplete",
      body: "The supplier reported that this deal did not materialize. Please confirm or raise a dispute with ConMart.",
      meta: { enquiryId: enquiry.id },
    });

    return { awaitingConfirmation: true };
  }

  // Outcome SUCCESS:
  await db.$transaction([
    db.unlockRecord.update({
      where: { id: enquiry.unlockRecord.id },
      data: { sellerReportedOutcome: OutcomeType.SUCCESS },
    }),
    db.enquiry.update({
      where: { id: enquiry.id },
      data: { status: EnquiryStatus.COMPLETED },
    }),
    db.sellerProfile.upsert({
      where: { userId: enquiry.sellerId },
      update: { completedDealsCount: { increment: 1 } },
      create: { userId: enquiry.sellerId, completedDealsCount: 1 },
    }),
  ]);

  return {};
}

/**
 * Buyer confirms that an introduced deal could not be fulfilled.
 * Triggers the deal failure refund credit for the seller's wallet.
 */
export async function buyerConfirmDealFailure(
  caller: Caller,
  enquiryId: string,
  reason?: string
): Promise<DealFailureConfirmResult> {
  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      unlockRecord: true,
    },
  });

  if (!enquiry || !enquiry.unlockRecord) {
    throw new DomainError("No unlocked deal found for this enquiry.");
  }

  if (enquiry.buyerId !== caller.id && caller.role !== "ADMIN") {
    throw new DomainError("You are not authorized to confirm this deal outcome.");
  }

  if (enquiry.unlockRecord.refundStatus !== RefundStatus.NONE) {
    throw new DomainError("A refund has already been processed for this introduction.");
  }

  const refund = await processDealFailureRefund({
    unlockRecordId: enquiry.unlockRecord.id,
    refundPercentage: getDealFailureRefundPercent(),
    reason: reason ?? "Buyer confirmed deal failure",
  });

  await db.$transaction([
    db.unlockRecord.update({
      where: { id: enquiry.unlockRecord.id },
      data: {
        buyerOutcomeResponse: OutcomeType.FAILURE,
      },
    }),
    db.enquiry.update({
      where: { id: enquiry.id },
      data: { status: EnquiryStatus.FAILED },
    }),
  ]);

  await createNotification({
    userId: enquiry.sellerId,
    type: "DEAL_FAILURE_REFUND",
    title: "Deal Refund Credited",
    body: `Buyer confirmed deal could not proceed. ETB ${refund.refundAmount} has been refunded to your wallet credit balance.`,
    meta: { enquiryId: enquiry.id, refundAmount: refund.refundAmount },
  });

  return { refundAmount: refund.refundAmount };
}

/**
 * Raises a dispute against an unlocked enquiry.
 */
export async function raiseEnquiryDispute(
  caller: Caller,
  input: RaiseDisputeInput
): Promise<RaiseDisputeResult> {
  const { enquiryId, claimType, description, evidenceUrls } = input;

  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      unlockRecord: { select: { id: true } },
    },
  });

  if (!enquiry || !enquiry.unlockRecord) {
    throw new DomainError("No unlocked deal was found for this enquiry.");
  }

  const isParty = enquiry.buyerId === caller.id || enquiry.sellerId === caller.id;

  if (!isParty && caller.role !== "ADMIN") {
    throw new DomainError("Only the parties to this deal can raise a dispute.");
  }

  const existingOpenCase = await db.disputeCase.findFirst({
    where: { enquiryId: enquiry.id, status: { in: ["OPEN", "MEDIATING"] } },
    select: { id: true },
  });

  if (existingOpenCase) {
    throw new DomainError(
      "A dispute for this deal is already open with the ConMart mediation desk."
    );
  }

  const dispute = await db.$transaction(async (tx) => {
    const created = await tx.disputeCase.create({
      data: {
        enquiryId: enquiry.id,
        unlockRecordId: enquiry.unlockRecord!.id,
        raisedBy: caller.role as UserRole,
        claimType,
        description: filterLeakedContactText(description),
        evidenceUrls,
      },
      select: { id: true },
    });

    await tx.enquiry.update({
      where: { id: enquiry.id },
      data: { status: EnquiryStatus.DISPUTED },
    });

    return created;
  });

  return { disputeId: dispute.id };
}

/**
 * Resolves a dispute case (admin only).
 */
export async function resolveEnquiryDispute(
  input: ResolveDisputeInput
): Promise<void> {
  const { disputeId, status, resolutionNotes, grantRefund } = input;

  const dispute = await db.disputeCase.findUnique({
    where: { id: disputeId },
    include: { unlockRecord: true },
  });

  if (!dispute) {
    throw new DomainError("Dispute not found.");
  }

  if (dispute.resolvedAt) {
    throw new DomainError("This dispute has already been resolved.");
  }

  if (grantRefund && dispute.unlockRecord.refundStatus === RefundStatus.NONE) {
    await processDealFailureRefund({
      unlockRecordId: dispute.unlockRecord.id,
      refundPercentage: getDealFailureRefundPercent(),
      reason: `Dispute resolution: ${resolutionNotes}`,
    });
  }

  await db.$transaction([
    db.disputeCase.update({
      where: { id: disputeId },
      data: { status, resolutionNotes, resolvedAt: new Date() },
    }),
    db.enquiry.update({
      where: { id: dispute.enquiryId },
      data: {
        status: grantRefund ? EnquiryStatus.FAILED : EnquiryStatus.COMPLETED,
      },
    }),
  ]);

  if (grantRefund) {
    await createNotification({
      userId: dispute.unlockRecord.buyerId,
      type: "DEAL_FAILURE_REFUND",
      title: "Dispute Resolved",
      body: `ConMart mediation resolved your dispute. The deal has been closed.`,
      meta: { enquiryId: dispute.enquiryId },
    });
    await createNotification({
      userId: dispute.unlockRecord.sellerId,
      type: "DEAL_FAILURE_REFUND",
      title: "Dispute Resolved — Wallet Credited",
      body: `ConMart mediation resolved the dispute for enquiry #${dispute.enquiryId}. Your wallet has been credited.`,
      meta: { enquiryId: dispute.enquiryId },
    });
  }
}

/**
 * Suspends a supplier whose deals keep collapsing after buyers have been
 * introduced, which is the signature of a listing that does not reflect real stock.
 */
export async function suspendSellerIfUnreliable(sellerId: string): Promise<void> {
  const profile = await db.sellerProfile.findUnique({
    where: { userId: sellerId },
    select: { id: true, completedDealsCount: true, failedDealsCount: true },
  });

  if (!profile || profile.failedDealsCount < SUSPENSION_MIN_FAILED_DEALS) {
    return;
  }

  const totalDeals = profile.completedDealsCount + profile.failedDealsCount;
  if (totalDeals === 0) return;

  if (profile.failedDealsCount / totalDeals > SUSPENSION_FAILURE_RATE) {
    await db.sellerProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: "SUSPENDED" },
    });
  }
}
