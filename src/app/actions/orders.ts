// =============================================================================
// ConMart — Order Server Actions
// =============================================================================
// Server Actions for Proforma generation and order status management.
//
// generateProforma(): Buyer-facing — validates, calculates, and persists a
//   new Proforma Invoice order.
//
// updateOrderStatus(): Admin-only — advances the order through the
//   forward-only status state machine.
//
// getOrderByReference(): Fetches order details by PRF-XXXX code.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authorize, getSessionUser } from "@/lib/auth/session";
import {
  generateReferenceCode,
  normalizeReferenceCode,
} from "@/lib/engine/reference-code";
import { generateProformaSchema, updateOrderStatusSchema } from "@/lib/validations";
import { getPlatformFeePercent, getVatRatePercent } from "@/lib/config/env";
import { applyFeesAndVat, calculateProformaBreakdown } from "@/lib/engine/pricing";
import { roundCurrency } from "@/lib/money";
import {
  ORDER_STATUS_TRANSITIONS,
  type ActionResult,
  type OrderStatus,
} from "@/lib/types";

// =============================================================================
// GENERATE PROFORMA (Buyer Action)
// =============================================================================

/**
 * Server Action: Generate a Proforma Invoice.
 *
 * Flow:
 * 1. Authenticate the caller (must be a BUYER)
 * 2. Validate input with Zod
 * 3. Run the tamper-proof Proforma calculation engine
 * 4. Generate a unique reference code
 * 5. Persist the Order record
 * 6. Return the reference code for redirect to the Proforma view
 *
 * @param input - Object with listingId and qty
 * @returns ActionResult with the generated reference code
 */
export async function generateProformaAction(
  input: { listingId: string; qty: number }
): Promise<ActionResult<{ referenceCode: string }>> {
  // ---------------------------------------------------------------------------
  // 1. Authenticate
  // ---------------------------------------------------------------------------
  const auth = await authorize(["BUYER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  const dbUser = auth.user;

  // ---------------------------------------------------------------------------
  // 2. Validate input
  // ---------------------------------------------------------------------------
  const parsed = generateProformaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input data.",
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Atomically validate, calculate, and persist the proforma in a transaction
  // ---------------------------------------------------------------------------
  try {
    const referenceCode = await db.$transaction(async (tx) => {
      // Re-fetch listing with active tiers inside the transaction
      const listing = await tx.listing.findUnique({
        where: { id: parsed.data.listingId },
        include: {
          priceTiers: {
            orderBy: { minQty: "asc" },
          },
        },
      });

      if (!listing) {
        throw new Error("The requested material listing does not exist.");
      }

      if (!listing.active) {
        throw new Error("This material listing is no longer active.");
      }

      const now = new Date();
      const matchingTier = listing.priceTiers.find(
        (tier) =>
          parsed.data.qty >= tier.minQty &&
          parsed.data.qty <= tier.maxQty &&
          tier.validUntil > now
      );

      if (!matchingTier) {
        throw new Error(
          `No active pricing tier available for quantity ${parsed.data.qty}. Please adjust quantity.`
        );
      }

      // Recalculated server-side from the tier price in the database. The
      // quantity is the only figure the client gets to influence.
      const unitPrice = Number(matchingTier.unitPrice);
      const { baseSubtotal, platformFee, tax, grandTotal } =
        calculateProformaBreakdown(
          parsed.data.qty,
          unitPrice,
          getPlatformFeePercent(),
          getVatRatePercent()
        );

      // Attempt order persistence with atomic retry on unique constraint collision
      let attempts = 0;
      while (attempts < 5) {
        attempts++;
        const code = generateReferenceCode();
        try {
          const created = await tx.order.create({
            data: {
              referenceCode: code,
              buyerId: dbUser.id,
              sellerId: listing.sellerId,
              listingId: listing.id,
              qty: parsed.data.qty,
              baseSubtotal,
              platformFee,
              tax,
              grandTotal,
              status: "GENERATED",
            },
            select: { referenceCode: true },
          });
          return created.referenceCode;
        } catch (dbErr: unknown) {
          const isUniqueViolation =
            typeof dbErr === "object" &&
            dbErr !== null &&
            "code" in dbErr &&
            (dbErr as { code: string }).code === "P2002";

          if (isUniqueViolation && attempts < 5) {
            continue; // Collision on reference code, retry with new code
          }
          throw dbErr;
        }
      }

      throw new Error("Could not allocate order reference code. Please try again.");
    });

    // ---------------------------------------------------------------------------
    // 4. Revalidate paths and return
    // ---------------------------------------------------------------------------
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/orders");
    revalidatePath("/buyer");
    revalidatePath("/seller/dashboard");
    revalidatePath("/admin/command-center");

    return { success: true, data: { referenceCode } };
  } catch (err: unknown) {
    console.error("Atomic proforma generation error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to save the proforma. Please try again.";
    return { success: false, error: message };
  }
}

// =============================================================================
// GENERATE MULTI-ITEM PROFORMA (Buyer Action)
// =============================================================================

/**
 * Server Action: Generate a consolidated Proforma Invoice for multiple line items.
 *
 * Atomically:
 * 1. Authenticates buyer
 * 2. Validates non-empty item array
 * 3. Enforces active listing & price tier checks for each item in a transaction
 * 4. Sums subtotals, computes 10% fee and 15% VAT
 * 5. Generates unique reference code with collision retry
 * 6. Creates Order and all OrderItem records
 */
export async function generateMultiItemProformaAction(
  items: Array<{ listingId: string; qty: number }>
): Promise<ActionResult<{ referenceCode: string }>> {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, error: "Cart cannot be empty." };
  }

  // 1. Authenticate
  const auth = await authorize(["BUYER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }
  const dbUser = auth.user;

  try {
    const referenceCode = await db.$transaction(async (tx) => {
      const now = new Date();
      let totalBaseSubtotal = 0;
      const validatedItems: Array<{
        listingId: string;
        sellerId: string;
        qty: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      for (const item of items) {
        if (!item.qty || item.qty <= 0) {
          throw new Error("Invalid quantity specified for one or more materials.");
        }

        const listing = await tx.listing.findUnique({
          where: { id: item.listingId },
          include: {
            priceTiers: { orderBy: { minQty: "asc" } },
            product: { select: { title: true } },
          },
        });

        if (!listing || !listing.active) {
          throw new Error(
            `Material "${listing?.product?.title ?? item.listingId}" is no longer active.`
          );
        }

        const matchingTier = listing.priceTiers.find(
          (t) => item.qty >= t.minQty && item.qty <= t.maxQty && t.validUntil > now
        );

        if (!matchingTier) {
          throw new Error(
            `No active wholesale pricing tier found for ${item.qty} units of "${listing.product.title}".`
          );
        }

        const unitPrice = Number(matchingTier.unitPrice);
        const itemSubtotal = roundCurrency(item.qty * unitPrice);
        totalBaseSubtotal += itemSubtotal;

        validatedItems.push({
          listingId: listing.id,
          sellerId: listing.sellerId,
          qty: item.qty,
          unitPrice,
          subtotal: itemSubtotal,
        });
      }

      const { baseSubtotal, platformFee, tax, grandTotal } = applyFeesAndVat(
        totalBaseSubtotal,
        getPlatformFeePercent(),
        getVatRatePercent()
      );
      totalBaseSubtotal = baseSubtotal;

      // Attempt order persistence with atomic retry on unique collision
      let attempts = 0;
      while (attempts < 5) {
        attempts++;
        const code = generateReferenceCode();
        try {
          const created = await tx.order.create({
            data: {
              referenceCode: code,
              buyerId: dbUser.id,
              sellerId: validatedItems[0]?.sellerId,
              listingId: validatedItems[0]?.listingId,
              qty: validatedItems.reduce((s, i) => s + i.qty, 0),
              baseSubtotal: totalBaseSubtotal,
              platformFee,
              tax,
              grandTotal,
              status: "GENERATED",
              items: {
                create: validatedItems.map((vi) => ({
                  listingId: vi.listingId,
                  sellerId: vi.sellerId,
                  qty: vi.qty,
                  unitPrice: vi.unitPrice,
                  subtotal: vi.subtotal,
                })),
              },
            },
            select: { referenceCode: true },
          });
          return created.referenceCode;
        } catch (dbErr: unknown) {
          const isUniqueViolation =
            typeof dbErr === "object" &&
            dbErr !== null &&
            "code" in dbErr &&
            (dbErr as { code: string }).code === "P2002";

          if (isUniqueViolation && attempts < 5) {
            continue;
          }
          throw dbErr;
        }
      }

      throw new Error("Could not allocate order reference code. Please try again.");
    });

    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/orders");
    revalidatePath("/buyer");
    revalidatePath("/seller/dashboard");
    revalidatePath("/admin/command-center");

    return { success: true, data: { referenceCode } };
  } catch (err: unknown) {
    console.error("Multi-item proforma generation error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to compile the master proforma. Please try again.";
    return { success: false, error: message };
  }
}



// =============================================================================
// UPDATE ORDER STATUS (Admin Action)
// =============================================================================

/**
 * Server Action: Advance the order status in the state machine.
 *
 * Enforces:
 * - Caller must be ADMIN
 * - Status can only move forward (GENERATED → CALL_RECEIVED → PROCURED → IN_TRANSIT → DELIVERED)
 * - Cannot skip states or go backwards
 *
 * @param input - Object with orderId and newStatus
 * @returns ActionResult indicating success or failure
 */
export async function updateOrderStatusAction(
  input: { orderId: string; newStatus: string }
): Promise<ActionResult<{ status: OrderStatus }>> {
  // ---------------------------------------------------------------------------
  // 1. Authenticate and authorize (Admin only)
  // ---------------------------------------------------------------------------
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  // ---------------------------------------------------------------------------
  // 2. Validate input
  // ---------------------------------------------------------------------------
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input data.",
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Fetch current order and validate state transition
  // ---------------------------------------------------------------------------
  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, status: true, referenceCode: true },
  });

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  // Verify the transition is valid (forward-only)
  const currentStatus = order.status as OrderStatus;
  const expectedNext = ORDER_STATUS_TRANSITIONS[currentStatus];

  if (expectedNext === null) {
    return {
      success: false,
      error: `Order ${order.referenceCode} is already delivered. No further status changes allowed.`,
    };
  }

  if (parsed.data.newStatus !== expectedNext) {
    return {
      success: false,
      error: `Invalid status transition. Order ${order.referenceCode} is currently "${currentStatus}". ` +
        `The next valid status is "${expectedNext}".`,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Update the order status
  // ---------------------------------------------------------------------------
  try {
    const updated = await db.order.update({
      where: { id: parsed.data.orderId },
      data: { status: parsed.data.newStatus },
      select: { status: true },
    });

    revalidatePath("/admin/command-center");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/orders");
    revalidatePath("/seller/dashboard");

    return {
      success: true,
      data: { status: updated.status as OrderStatus },
    };
  } catch (dbError: unknown) {
    console.error("Order status update failed:", dbError);
    return { success: false, error: "Failed to update order status." };
  }
}

/**
 * Cancels an order inquiry.
 * Accessible by:
 * - The Buyer who owns the order (only while status === 'GENERATED')
 * - Platform Admin
 */
export async function cancelOrderInquiryAction(
  orderId: string
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const auth = await authorize(["BUYER", "ADMIN"]);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }
    const dbUser = auth.user;

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, status: true, referenceCode: true },
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    const isOwner = order.buyerId === dbUser.id;
    const isAdmin = dbUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "You are not authorized to cancel this order inquiry." };
    }

    if (order.status !== "GENERATED" && !isAdmin) {
      return {
        success: false,
        error: `Order ${order.referenceCode} has already progressed to "${order.status}" and cannot be cancelled automatically. Please contact the dispatch desk.`,
      };
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/buyer/orders");
    revalidatePath(`/buyer/proforma/${order.referenceCode}`);
    revalidatePath("/seller/dashboard");
    revalidatePath("/admin/command-center");

    return { success: true, data: { orderId } };
  } catch (error) {
    console.error("Error cancelling order inquiry:", error);
    return { success: false, error: "Failed to cancel order inquiry." };
  }
}

// =============================================================================
// FETCH ORDER BY REFERENCE (Read Action)
// =============================================================================

/** Shape of an individual line item returned by getOrderByReference */
export interface OrderItemDetail {
  id: string;
  listingId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  productTitle: string;
  productUnit: string;
  location: string;
  seller: {
    id: string;
    name: string;
    phone: string;
    companyName: string;
  };
}

/** Shape of the order details returned by getOrderByReference */
export interface OrderDetails {
  id: string;
  referenceCode: string;
  qty: number;
  baseSubtotal: number;
  platformFee: number;
  tax: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: Date;
  buyer: {
    id: string;
    name: string;
    phone: string;
    companyName: string;
  };
  seller: {
    id: string;
    name: string;
    phone: string;
    companyName: string;
  };
  listing?: {
    id: string;
    location: string;
    product: {
      title: string;
      unit: string;
    };
  } | null;
  items: OrderItemDetail[];
}

/**
 * Fetches complete order details by reference code.
 * Used by both the Proforma view (buyer) and Command Center (admin).
 *
 * @param referenceCode - The PRF-XXXXXX reference code
 * @returns The full order details or null if not found
 */
export async function getOrderByReference(
  referenceCode: string
): Promise<OrderDetails | null> {
  // 1. Authenticate caller
  const dbUser = await getSessionUser();
  if (!dbUser) {
    return null;
  }

  const normalized = normalizeReferenceCode(referenceCode);
  if (!normalized) {
    return null;
  }

  const order = await db.order.findUnique({
    where: { referenceCode: normalized },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          phone: true,
          companyName: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          phone: true,
          companyName: true,
        },
      },
      listing: {
        include: {
          product: {
            select: {
              title: true,
              unit: true,
            },
          },
        },
      },
      items: {
        include: {
          listing: {
            include: {
              product: {
                select: {
                  title: true,
                  unit: true,
                },
              },
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              phone: true,
              companyName: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  // 2. Authorization Check (IDOR Protection)
  const isAdmin = dbUser.role === "ADMIN";
  const isBuyer = dbUser.id === order.buyerId;
  const isSeller =
    dbUser.id === order.sellerId ||
    order.items.some((item) => item.sellerId === dbUser.id);

  if (!isAdmin && !isBuyer && !isSeller) {
    return null; // Forbidden: caller does not own and cannot administer this order
  }

  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  // 3. Disintermediation Masking
  // If caller is Buyer: Seller's private phone and company are completely masked
  const sanitizedSeller = isAdmin && order.seller
    ? order.seller
    : {
        id: order.seller?.id ?? "conmart",
        name: "ConMart Desk Coordinator",
        phone: adminPhone,
        companyName: order.seller
          ? `ConMart Verified Supplier Depot (#DEPOT-${order.seller.id.slice(-4).toUpperCase()})`
          : "ConMart Multi-Depot Network",
      };

  // If caller is Seller: Buyer's contact info is routed through ConMart Ops
  const sanitizedBuyer = isAdmin
    ? order.buyer
    : isBuyer
    ? order.buyer
    : {
        id: order.buyer.id,
        name: "Commercial Buyer Account",
        phone: adminPhone,
        companyName: "ConMart Verified Contractor",
      };

  const mappedItems: OrderItemDetail[] =
    order.items.length > 0
      ? order.items.map((item) => ({
          id: item.id,
          listingId: item.listingId,
          qty: item.qty,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          productTitle: item.listing.product.title,
          productUnit: item.listing.product.unit,
          location: item.listing.location,
          seller: isAdmin
            ? item.seller
            : {
                id: item.seller.id,
                name: "ConMart Desk Coordinator",
                phone: adminPhone,
                companyName: `ConMart Partner Depot (#DEPOT-${item.seller.id.slice(-4).toUpperCase()})`,
              },
        }))
      : order.listing && order.seller
      ? [
          {
            id: order.id,
            listingId: order.listing.id,
            qty: order.qty ?? 0,
            unitPrice: order.qty ? Number(order.baseSubtotal) / order.qty : 0,
            subtotal: Number(order.baseSubtotal),
            productTitle: order.listing.product.title,
            productUnit: order.listing.product.unit,
            location: order.listing.location,
            seller: sanitizedSeller,
          },
        ]
      : [];

  return {
    id: order.id,
    referenceCode: order.referenceCode,
    qty: order.qty ?? mappedItems.reduce((acc, i) => acc + i.qty, 0),
    baseSubtotal: Number(order.baseSubtotal),
    platformFee: Number(order.platformFee),
    tax: Number(order.tax),
    grandTotal: Number(order.grandTotal),
    status: order.status as OrderStatus,
    createdAt: order.createdAt,
    buyer: sanitizedBuyer,
    seller: sanitizedSeller,
    listing: order.listing
      ? {
          id: order.listing.id,
          location: order.listing.location,
          product: order.listing.product,
        }
      : null,
    items: mappedItems,
  };
}
