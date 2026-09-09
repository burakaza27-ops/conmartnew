// =============================================================================
// ConMart — Purchase Enquiry Server Actions
// =============================================================================
// The core workflow:
//
//   1. A buyer submits a purchase request against a listing.
//   2. The supplier sees it with the buyer's identity masked.
//   3. Accepting debits the unlock fee and reveals both parties to each other.
//   4. Declining costs nothing.
//   5. Either side reports the outcome; a failure refunds most of the fee as
//      non-withdrawable credit.
//
// Every action re-derives the caller from the `users` table and checks that
// they are a party to the enquiry. A server action is a public HTTP endpoint:
// anything not checked here is not checked at all.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { authorize } from "@/lib/auth/session";
import {
  executeUnlockIntroductionTransaction,
  processDealFailureRefund,
} from "@/lib/wallet/wallet-service";
import {
  sanitizeEnquiryForViewer,
  filterLeakedContactText,
} from "@/lib/security/masking";
import { generateReferenceCode } from "@/lib/engine/reference-code";
import { getDealFailureRefundPercent } from "@/lib/config/env";
import {
  dealOutcomeSchema,
  purchaseEnquirySchema,
  raiseDisputeSchema,
  resolveDisputeSchema,
  type DealOutcomeInput,
  type PurchaseEnquiryInput,
  type RaiseDisputeInput,
  type ResolveDisputeInput,
} from "@/lib/validations";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import { DomainError, toSafeErrorMessage } from "@/lib/errors";
import { EnquiryStatus, OutcomeType } from "@prisma/client";
import { ensureDealTicketForEnquiry } from "@/lib/marketplace/service";

/** A seller is suspended once they fail this many deals at this failure rate. */
const SUSPENSION_MIN_FAILED_DEALS = 4;
const SUSPENSION_FAILURE_RATE = 0.6;

/**
 * Result of a server action.
 *
 * `data` is required on the success branch so that a caller who tests
 * `res.success` can read `res.data` and `res.error` without a second guard. An
 * optional `data` would leave `{ success: true, data: undefined }` in the else
 * branch of every call site, where `res.error` does not exist.
 */
type ActionResponse<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// BUYER — SUBMIT ENQUIRY
// =============================================================================

export async function submitPurchaseEnquiryAction(
  input: PurchaseEnquiryInput
): Promise<ActionResponse<{ enquiryId: string; referenceCode: string }>> {
  const auth = await authorize(["BUYER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = purchaseEnquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid purchase request.",
    };
  }

  const data = parsed.data;
  const caller = auth.user;

  const clientId = await getClientIdentifier();
  const [byUser, byIp] = await Promise.all([
    rateLimit(`enquiry:user:${caller.id}`, { limit: 20, windowSeconds: 3600 }),
    rateLimit(`enquiry:ip:${clientId}`, { limit: 40, windowSeconds: 3600 }),
  ]);

  if (!byUser.allowed || !byIp.allowed) {
    return {
      success: false,
      error: rateLimitMessage(
        Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds)
      ),
    };
  }

  try {
    const { buyerId, agentId } = await resolveEnquiryBuyer(caller, data);

    const listing = await db.listing.findUnique({
      where: { id: data.listingId },
      include: {
        product: { select: { unit: true } },
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
        // Buyers routinely paste "call me on 09..." into the address field,
        // which would hand the supplier a free introduction.
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

    revalidatePath("/buyer/enquiries");
    revalidatePath("/seller/enquiries");
    revalidatePath("/agent");

    return {
      success: true,
      data: { enquiryId: enquiry.id, referenceCode: enquiry.referenceCode },
    };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "submitPurchaseEnquiry"),
    };
  }
}

/**
 * Determines whose enquiry this is.
 *
 * Field agents raise requests for contractors who walked into a depot. Those
 * contractors get a profile with no `authId`, so they cannot sign in until
 * they register themselves. Matching is restricted to those offline profiles:
 * without that restriction an agent could file enquiries in the name of any
 * registered buyer simply by knowing their phone number.
 */
async function resolveEnquiryBuyer(
  caller: { id: string; role: string },
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

// =============================================================================
// SELLER — ACCEPT / DECLINE
// =============================================================================

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

export async function sellerAcceptEnquiryAction(
  enquiryId: string
): Promise<ActionResponse<UnlockResult>> {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
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

    if (enquiry.sellerId !== auth.user.id && auth.user.role !== "ADMIN") {
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

    revalidatePath("/seller/enquiries");
    revalidatePath("/seller/wallet");
    revalidatePath("/buyer/enquiries");

    // Only the supplier's own side of the introduction is returned. The
    // seller's contact block stays server-side; they already know it.
    return {
      success: true,
      data: {
        feeAmount: result.feeAmount,
        walletBalances: result.walletBalances,
        buyerContact: result.buyerContact,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "sellerAcceptEnquiry"),
    };
  }
}

export async function sellerDeclineEnquiryAction(
  enquiryId: string
): Promise<ActionResponse> {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const enquiry = await db.enquiry.findUnique({
      where: { id: enquiryId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!enquiry || (enquiry.sellerId !== auth.user.id && auth.user.role !== "ADMIN")) {
      throw new DomainError("Enquiry not found.");
    }

    // Declining after acceptance would strand a paid introduction, so the
    // transition is only legal from PENDING.
    if (enquiry.status !== EnquiryStatus.PENDING) {
      throw new DomainError(`This enquiry is already ${enquiry.status.toLowerCase()}.`);
    }

    await db.enquiry.update({
      where: { id: enquiry.id },
      data: { status: EnquiryStatus.DECLINED, respondedAt: new Date() },
    });

    revalidatePath("/seller/enquiries");
    revalidatePath("/buyer/enquiries");

    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "sellerDeclineEnquiry"),
    };
  }
}

// =============================================================================
// DEAL OUTCOME
// =============================================================================

export async function reportDealOutcomeAction(
  input: DealOutcomeInput
): Promise<ActionResponse<{ refundAmount?: number }>> {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = dealOutcomeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid outcome report.",
    };
  }

  const { enquiryId, outcome, reason } = parsed.data;

  try {
    const enquiry = await db.enquiry.findUnique({
      where: { id: enquiryId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        unlockRecord: { select: { id: true } },
      },
    });

    if (!enquiry || !enquiry.unlockRecord) {
      throw new DomainError("No unlocked deal was found for this enquiry.");
    }

    // The refund debits ConMart's revenue, so only the supplier who paid the
    // fee — or an administrator mediating — may declare the outcome.
    if (enquiry.sellerId !== auth.user.id && auth.user.role !== "ADMIN") {
      throw new DomainError("You do not have permission to report on this deal.");
    }

    if (enquiry.status !== EnquiryStatus.ACCEPTED) {
      throw new DomainError(
        `The outcome for this deal has already been recorded as ${enquiry.status.toLowerCase()}.`
      );
    }

    if (outcome === "FAILURE") {
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

      revalidateDealSurfaces();
      return { success: true, data: { refundAmount: refund.refundAmount } };
    }

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

    revalidateDealSurfaces();
    return { success: true, data: {} };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "reportDealOutcome"),
    };
  }
}

/**
 * Suspends a supplier whose deals keep collapsing after buyers have been
 * introduced, which is the signature of a listing that does not reflect real
 * stock.
 */
async function suspendSellerIfUnreliable(sellerId: string): Promise<void> {
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

function revalidateDealSurfaces(): void {
  revalidatePath("/seller/enquiries");
  revalidatePath("/seller/wallet");
  revalidatePath("/buyer/enquiries");
  revalidatePath("/admin/command-center");
}

// =============================================================================
// DISPUTES
// =============================================================================

export async function raiseDisputeAction(
  input: RaiseDisputeInput
): Promise<ActionResponse<{ disputeId: string }>> {
  const auth = await authorize(["BUYER", "SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = raiseDisputeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid dispute submission.",
    };
  }

  const { enquiryId, claimType, description, evidenceUrls } = parsed.data;

  try {
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

    const isParty =
      enquiry.buyerId === auth.user.id || enquiry.sellerId === auth.user.id;

    if (!isParty && auth.user.role !== "ADMIN") {
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
          raisedBy: auth.user.role,
          claimType,
          // Evidence descriptions are a natural place to smuggle a phone
          // number past the paywall.
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

    revalidateDealSurfaces();
    return { success: true, data: { disputeId: dispute.id } };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "raiseDispute") };
  }
}

export async function getAdminDisputesAction() {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

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
  });

  return {
    success: true as const,
    // Administrators mediate between the parties, so they see both sides
    // unmasked. This payload must never be reused on a buyer or seller route.
    data: disputes.map((dispute) => ({
      id: dispute.id,
      enquiryId: dispute.enquiryId,
      referenceCode: dispute.enquiry.referenceCode,
      productTitle: dispute.enquiry.listing.product.title,
      raisedBy: dispute.raisedBy,
      claimType: dispute.claimType,
      description: dispute.description,
      status: dispute.status,
      resolutionNotes: dispute.resolutionNotes,
      createdAt: dispute.createdAt.toISOString(),
      resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
      buyerName: dispute.enquiry.buyer.name,
      buyerPhone: dispute.enquiry.buyer.phone,
      sellerName: dispute.enquiry.seller.name,
      sellerCompany: dispute.enquiry.seller.companyName,
      sellerPhone: dispute.enquiry.seller.phone,
      feeAmount: Number(dispute.unlockRecord.feeAmount),
    })),
  };
}

export async function resolveDisputeAction(
  input: ResolveDisputeInput
): Promise<ActionResponse> {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = resolveDisputeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid resolution.",
    };
  }

  const { disputeId, status, resolutionNotes, grantRefund } = parsed.data;

  try {
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

    if (grantRefund && dispute.unlockRecord.refundStatus !== "REFUNDED_CREDIT") {
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

    revalidateDealSurfaces();
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "resolveDispute") };
  }
}

// =============================================================================
// LISTS
// =============================================================================

export async function getSellerEnquiriesAction() {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const seller = auth.user;

  const enquiries = await db.enquiry.findMany({
    where: { sellerId: seller.id },
    include: {
      buyer: { select: { id: true, name: true, phone: true, companyName: true } },
      seller: { select: { id: true, name: true, phone: true, companyName: true } },
      listing: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true, unlockFee: true } } },
          },
        },
      },
      unlockRecord: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true as const,
    data: enquiries.map((enquiry) => {
      const contact = sanitizeEnquiryForViewer({
        enquiry,
        viewerUserId: seller.id,
        viewerRole: seller.role,
      });

      return {
        id: enquiry.id,
        referenceCode: enquiry.referenceCode,
        qty: enquiry.qty,
        unit: enquiry.unit,
        deliveryPreference: enquiry.deliveryPreference,
        deliveryAddress: enquiry.deliveryAddress,
        accessConstraints: enquiry.accessConstraints,
        status: enquiry.status,
        createdAt: enquiry.createdAt.toISOString(),
        productTitle: enquiry.listing.product.title,
        categoryName: enquiry.listing.product.category.name,
        unlockFee: Number(enquiry.listing.product.category.unlockFee),
        isUnlocked: contact.isUnlocked,
        buyerContact: contact.buyer,
        unlockRecord: enquiry.unlockRecord
          ? {
              feeAmount: Number(enquiry.unlockRecord.feeAmount),
              unlockedAt: enquiry.unlockRecord.unlockedAt.toISOString(),
              refundStatus: enquiry.unlockRecord.refundStatus,
              sellerReportedOutcome: enquiry.unlockRecord.sellerReportedOutcome,
            }
          : null,
      };
    }),
  };
}

export async function getBuyerEnquiriesAction() {
  const auth = await authorize(["BUYER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const buyer = auth.user;

  const enquiries = await db.enquiry.findMany({
    where: { buyerId: buyer.id },
    include: {
      buyer: { select: { id: true, name: true, phone: true, companyName: true } },
      seller: { select: { id: true, name: true, phone: true, companyName: true } },
      listing: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true, unlockFee: true } } },
          },
        },
      },
      unlockRecord: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true as const,
    data: enquiries.map((enquiry) => {
      const contact = sanitizeEnquiryForViewer({
        enquiry,
        viewerUserId: buyer.id,
        viewerRole: buyer.role,
      });

      return {
        id: enquiry.id,
        referenceCode: enquiry.referenceCode,
        qty: enquiry.qty,
        unit: enquiry.unit,
        deliveryPreference: enquiry.deliveryPreference,
        deliveryAddress: enquiry.deliveryAddress,
        accessConstraints: enquiry.accessConstraints,
        status: enquiry.status,
        createdAt: enquiry.createdAt.toISOString(),
        productTitle: enquiry.listing.product.title,
        categoryName: enquiry.listing.product.category.name,
        // Sourced from the sanitizer so an un-introduced buyer never receives
        // the supplier's street-level depot address.
        listingLocation: contact.seller.location,
        isUnlocked: contact.isUnlocked,
        sellerContact: contact.seller,
        unlockRecord: enquiry.unlockRecord
          ? {
              unlockedAt: enquiry.unlockRecord.unlockedAt.toISOString(),
              sellerReportedOutcome: enquiry.unlockRecord.sellerReportedOutcome,
            }
          : null,
      };
    }),
  };
}
