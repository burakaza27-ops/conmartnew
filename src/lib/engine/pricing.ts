// =============================================================================
// ECON — Proforma Line-Item Arithmetic
// =============================================================================
// Pure, client-safe pricing math shared by the live calculator in the buyer UI
// and the authoritative server-side proforma engine.
//
// Both must use this function. When the preview and the committed invoice were
// computed by separate copies of this formula, they rounded differently and a
// buyer could be shown a total that did not match the invoice they received.
//
// A preview is still only a preview: the server re-runs this against the tier
// price it reads from the database, so a tampered client cannot set its own
// price.
// =============================================================================

import { roundCurrency } from "@/lib/money";

export interface ProformaBreakdown {
  /** qty x unitPrice */
  baseSubtotal: number;
  /** baseSubtotal x platformFeePercent */
  platformFee: number;
  /** (baseSubtotal + platformFee) x vatRatePercent */
  tax: number;
  /** Amount payable. */
  grandTotal: number;
}

/**
 * Adds the platform fee and VAT to a subtotal.
 *
 * Used directly for a multi-line invoice, where the subtotal is the sum of
 * several item lines rather than a single quantity times a price.
 *
 * VAT applies to the platform fee as well as the goods, matching how the fee
 * is invoiced as a service line under Ethiopian VAT rules.
 */
export function applyFeesAndVat(
  baseSubtotal: number,
  platformFeePercent = 0,
  vatRatePercent = 15
): ProformaBreakdown {
  const roundedSubtotal = roundCurrency(baseSubtotal);
  const platformFee = roundCurrency(roundedSubtotal * (platformFeePercent / 100));
  const tax = roundCurrency((roundedSubtotal + platformFee) * (vatRatePercent / 100));

  // Summing the already-rounded components guarantees the printed lines add up
  // to the printed total, which is what a buyer's accountant will check.
  const grandTotal = roundCurrency(roundedSubtotal + platformFee + tax);

  return { baseSubtotal: roundedSubtotal, platformFee, tax, grandTotal };
}

/** Single-line invoice: one material at one tier price. */
export function calculateProformaBreakdown(
  qty: number,
  unitPrice: number,
  platformFeePercent = 0,
  vatRatePercent = 15
): ProformaBreakdown {
  return applyFeesAndVat(
    roundCurrency(qty * unitPrice),
    platformFeePercent,
    vatRatePercent
  );
}
