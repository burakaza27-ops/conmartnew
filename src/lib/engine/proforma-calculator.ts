// =============================================================================
// ECON — Proforma Calculation Engine (Server-Side Only)
// =============================================================================
// Tamper-proof server-side pricing calculation for Proforma Invoices.
//
// This module is the single source of truth for all pricing. Client-side
// calculations are preview-only and MUST be re-validated here before
// committing an order to the database.
//
// Calculation formula:
//   Base Subtotal  = requested_qty × tier_unit_price
//   Platform Fee   = Base Subtotal × (PLATFORM_FEE_PERCENT / 100)
//   Tax (VAT)      = (Base Subtotal + Platform Fee) × (VAT_RATE_PERCENT / 100)
//   Grand Total    = Base Subtotal + Platform Fee + Tax
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import { getPlatformFeePercent, getVatRatePercent } from "@/lib/config/env";
import { calculateProformaBreakdown } from "@/lib/engine/pricing";
import type {
  ProformaCalculationInput,
  ProformaCalculationResult,
  ProformaCalculationError,
} from "@/lib/types";

/**
 * Discriminated union result type for the proforma calculator.
 * Ensures callers handle both success and error cases explicitly.
 */
export type ProformaResult =
  | { ok: true; data: ProformaCalculationResult }
  | { ok: false; error: ProformaCalculationError };

/**
 * Calculates the complete Proforma Invoice breakdown for a given listing
 * and requested quantity.
 *
 * This function is the ONLY authoritative source for pricing calculations.
 * It enforces:
 * - Listing existence and active status
 * - Quantity falls within a valid, non-expired price tier
 * - Correct mathematical calculation of all line items
 *
 * @param input - The listing ID and requested quantity
 * @returns A discriminated union with either the calculation result or an error
 */
export async function calculateProforma(
  input: ProformaCalculationInput
): Promise<ProformaResult> {
  const { listingId, requestedQty } = input;

  // ---------------------------------------------------------------------------
  // 1. Validate quantity is a positive integer
  // ---------------------------------------------------------------------------
  if (
    !Number.isInteger(requestedQty) ||
    requestedQty <= 0
  ) {
    return {
      ok: false,
      error: {
        code: "INVALID_QUANTITY",
        message: "Quantity must be a positive whole number.",
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Fetch the listing with its price tiers
  // ---------------------------------------------------------------------------
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: {
      priceTiers: {
        orderBy: { minQty: "asc" },
      },
    },
  });

  if (!listing) {
    return {
      ok: false,
      error: {
        code: "LISTING_NOT_FOUND",
        message: "The requested listing does not exist.",
      },
    };
  }

  if (!listing.active) {
    return {
      ok: false,
      error: {
        code: "LISTING_INACTIVE",
        message: "This listing is no longer active.",
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Find the applicable price tier
  //    Must satisfy: minQty <= requestedQty <= maxQty
  // ---------------------------------------------------------------------------
  const now = new Date();

  const matchingTier = listing.priceTiers.find(
    (tier) =>
      requestedQty >= tier.minQty &&
      requestedQty <= tier.maxQty
  );

  if (!matchingTier) {
    return {
      ok: false,
      error: {
        code: "NO_MATCHING_TIER",
        message: `No pricing tier available for a quantity of ${requestedQty}. ` +
          "Please adjust your quantity to match an available tier.",
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Check if the matching tier has expired
  // ---------------------------------------------------------------------------
  if (matchingTier.validUntil < now) {
    return {
      ok: false,
      error: {
        code: "TIER_EXPIRED",
        message:
          "The pricing for this quantity range has expired. " +
          "Please contact the seller for updated pricing.",
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Calculate all line items
  //    All calculations use Number for precision-safe operations.
  //    Prisma Decimal is converted to Number for arithmetic.
  // ---------------------------------------------------------------------------
  const unitPrice = Number(matchingTier.unitPrice);

  // The same function backs the buyer's live calculator, so the preview and
  // the committed invoice cannot drift apart.
  const breakdown = calculateProformaBreakdown(
    requestedQty,
    unitPrice,
    getPlatformFeePercent(),
    getVatRatePercent()
  );

  // ---------------------------------------------------------------------------
  // 6. Return the complete calculation result
  // ---------------------------------------------------------------------------
  return {
    ok: true,
    data: {
      tierId: matchingTier.id,
      unitPrice,
      qty: requestedQty,
      ...breakdown,
      listingId: listing.id,
      sellerId: listing.sellerId,
    },
  };
}
