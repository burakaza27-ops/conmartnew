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
// they are a party to the enquiry. Server actions are public HTTP endpoints:
// write operations delegate domain business logic to `enquiry-service.ts`.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authorize } from "@/lib/auth/session";
import { sanitizeEnquiryForViewer } from "@/lib/security/masking";
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
import { toSafeErrorMessage } from "@/lib/errors";
import { isDirectChatEntitled } from "@/lib/marketplace/subscription";
import type { ActionResult } from "@/lib/types";
import {
  submitPurchaseEnquiry,
  sellerAcceptEnquiry,
  sellerDeclineEnquiry,
  reportDealOutcome,
  buyerConfirmDealFailure,
  raiseEnquiryDispute,
  resolveEnquiryDispute,
  type UnlockResult,
} from "@/lib/marketplace/enquiry-service";

export type { UnlockResult } from "@/lib/marketplace/enquiry-service";

function revalidateDealSurfaces(): void {
  revalidatePath("/seller/enquiries");
  revalidatePath("/seller/wallet");
  revalidatePath("/buyer/enquiries");
  revalidatePath("/admin/command-center");
}

// =============================================================================
// BUYER — SUBMIT ENQUIRY
// =============================================================================

export async function submitPurchaseEnquiryAction(
  input: PurchaseEnquiryInput
): Promise<ActionResult<{ enquiryId: string; referenceCode: string }>> {
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
    const result = await submitPurchaseEnquiry(caller, data);

    revalidatePath("/buyer/enquiries");
    revalidatePath("/seller/enquiries");
    revalidatePath("/seller/dashboard");
    revalidatePath("/buyer/deals");
    revalidatePath("/seller/deals");
    revalidatePath("/agent");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "submitPurchaseEnquiry"),
    };
  }
}

// =============================================================================
// SELLER — ACCEPT / DECLINE
// =============================================================================

export async function sellerAcceptEnquiryAction(
  enquiryId: string
): Promise<ActionResult<UnlockResult>> {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const result = await sellerAcceptEnquiry(auth.user, enquiryId);

    revalidatePath("/seller/enquiries");
    revalidatePath("/seller/wallet");
    revalidatePath("/buyer/enquiries");

    return {
      success: true,
      data: result,
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
): Promise<ActionResult<void>> {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    await sellerDeclineEnquiry(auth.user, enquiryId);

    revalidatePath("/seller/enquiries");
    revalidatePath("/buyer/enquiries");

    return { success: true, data: undefined };
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
): Promise<ActionResult<{ refundAmount?: number; awaitingConfirmation?: boolean }>> {
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

  try {
    const result = await reportDealOutcome(auth.user, parsed.data);
    revalidateDealSurfaces();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "reportDealOutcome"),
    };
  }
}

/**
 * Buyer confirms that an introduced deal could not be fulfilled.
 * Triggers the deal failure refund credit for the seller's wallet.
 */
export async function buyerConfirmDealFailureAction(
  enquiryId: string,
  reason?: string
): Promise<ActionResult<{ refundAmount: number }>> {
  const auth = await authorize(["BUYER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const result = await buyerConfirmDealFailure(auth.user, enquiryId, reason);
    revalidateDealSurfaces();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "buyerConfirmDealFailure"),
    };
  }
}

// =============================================================================
// DISPUTES
// =============================================================================

export async function raiseDisputeAction(
  input: RaiseDisputeInput
): Promise<ActionResult<{ disputeId: string }>> {
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

  try {
    const result = await raiseEnquiryDispute(auth.user, parsed.data);
    revalidateDealSurfaces();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "raiseDispute") };
  }
}

export async function getAdminDisputesAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      enquiryId: string;
      referenceCode: string;
      productTitle: string;
      raisedBy: string;
      claimType: string;
      description: string;
      status: string;
      resolutionNotes: string | null;
      createdAt: string;
      resolvedAt: string | null;
      buyerName: string;
      buyerPhone: string;
      sellerName: string;
      sellerCompany: string | null;
      sellerPhone: string;
      feeAmount: number;
    }>
  >
> {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

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
      take: 100,
    });

    return {
      success: true,
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
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "getAdminDisputes"),
    };
  }
}

export async function resolveDisputeAction(
  input: ResolveDisputeInput
): Promise<ActionResult<void>> {
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

  try {
    await resolveEnquiryDispute(parsed.data);
    revalidateDealSurfaces();
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "resolveDispute") };
  }
}

// =============================================================================
// LISTS
// =============================================================================

export async function getSellerEnquiriesAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      referenceCode: string;
      qty: number;
      unit: string;
      deliveryPreference: string;
      deliveryAddress: string;
      accessConstraints: string | null;
      status: string;
      createdAt: string;
      productTitle: string;
      categoryName: string;
      unlockFee: number;
      isUnlocked: boolean;
      directChatEnabled: boolean;
      dealTicket: {
        id: string;
        referenceCode: string;
        status: string;
        roomId: string | null;
      } | null;
      buyerContact: {
        name: string;
        companyName?: string | null;
        phone?: string;
        exactAddress?: string;
      };
      unlockRecord: {
        feeAmount: number;
        unlockedAt: string;
        refundStatus: string;
        sellerReportedOutcome: string | null;
      } | null;
    }>
  >
> {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const seller = auth.user;

  try {
    const enquiries = await db.enquiry.findMany({
      where: { sellerId: seller.id },
      include: {
        buyer: { select: { id: true, name: true, phone: true, companyName: true } },
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            companyName: true,
            sellerProfile: {
              select: { subscriptionStatus: true, subscriptionExpiresAt: true },
            },
          },
        },
        listing: {
          include: {
            product: {
              include: { category: { select: { id: true, name: true, unlockFee: true } } },
            },
          },
        },
        unlockRecord: true,
        dealTicket: {
          select: {
            id: true,
            referenceCode: true,
            status: true,
            rooms: { select: { id: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      success: true,
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
          directChatEnabled: isDirectChatEntitled(enquiry.seller.sellerProfile),
          dealTicket: mapEnquiryDealTicket(enquiry.dealTicket, "SELLER"),
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
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "getSellerEnquiries"),
    };
  }
}

export async function getBuyerEnquiriesAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      referenceCode: string;
      qty: number;
      unit: string;
      deliveryPreference: string;
      deliveryAddress: string;
      accessConstraints: string | null;
      status: string;
      createdAt: string;
      productTitle: string;
      categoryName: string;
      listingLocation: string | null;
      isUnlocked: boolean;
      directChatEnabled: boolean;
      dealTicket: {
        id: string;
        referenceCode: string;
        status: string;
        roomId: string | null;
      } | null;
      sellerContact: {
        name?: string;
        companyName?: string | null;
        phone?: string;
        location?: string | null;
      };
      unlockRecord: {
        unlockedAt: string;
        sellerReportedOutcome: string | null;
      } | null;
    }>
  >
> {
  const auth = await authorize(["BUYER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const buyer = auth.user;

  try {
    const enquiries = await db.enquiry.findMany({
      where: { buyerId: buyer.id },
      include: {
        buyer: { select: { id: true, name: true, phone: true, companyName: true } },
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            companyName: true,
            sellerProfile: {
              select: { subscriptionStatus: true, subscriptionExpiresAt: true },
            },
          },
        },
        listing: {
          include: {
            product: {
              include: { category: { select: { id: true, name: true, unlockFee: true } } },
            },
          },
        },
        unlockRecord: true,
        dealTicket: {
          select: {
            id: true,
            referenceCode: true,
            status: true,
            rooms: { select: { id: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      success: true,
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
          listingLocation: contact.seller.location,
          isUnlocked: contact.isUnlocked,
          directChatEnabled: isDirectChatEntitled(enquiry.seller.sellerProfile),
          dealTicket: mapEnquiryDealTicket(enquiry.dealTicket, "BUYER"),
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
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "getBuyerEnquiries"),
    };
  }
}

function mapEnquiryDealTicket(
  ticket:
    | {
        id: string;
        referenceCode: string;
        status: string;
        rooms: { id: string; type: string }[];
      }
    | null
    | undefined,
  viewer: "BUYER" | "SELLER"
) {
  if (!ticket) return null;
  const roomType = viewer === "BUYER" ? "BUYER_AGENT" : "SELLER_AGENT";
  return {
    id: ticket.id,
    referenceCode: ticket.referenceCode,
    status: ticket.status,
    roomId: ticket.rooms.find((room) => room.type === roomType)?.id ?? null,
  };
}
