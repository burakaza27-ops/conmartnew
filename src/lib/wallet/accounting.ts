// =============================================================================
// ECON — Wallet Accounting Rules
// =============================================================================
// The arithmetic behind the seller wallet, kept free of database and
// server-only imports so the rules that move money can be unit tested directly.
//
// A wallet holds two balances:
//   cash   — topped up by the supplier, withdrawable
//   credit — issued by ECON as a goodwill refund, not withdrawable
// =============================================================================

import { DomainError } from "@/lib/errors";
import { roundCurrency } from "@/lib/money";

export interface UnlockPaymentSplit {
  fromCredit: number;
  fromCash: number;
}

/**
 * Splits an unlock fee across the two balances.
 *
 * Credit is spent before cash. It cannot be withdrawn, so spending it first
 * preserves the supplier's withdrawable funds and stops goodwill credit
 * accumulating indefinitely as a liability.
 *
 * @throws DomainError when the combined balance cannot cover the fee.
 */
export function splitUnlockPayment(
  feeAmount: number,
  creditBalance: number,
  cashBalance: number
): UnlockPaymentSplit {
  if (!Number.isFinite(feeAmount) || feeAmount < 0) {
    throw new DomainError("Unlock fee must be a positive amount.");
  }

  const available = roundCurrency(creditBalance + cashBalance);

  if (available < roundCurrency(feeAmount)) {
    throw new DomainError(
      `Insufficient wallet balance. Available: ${available.toFixed(2)} ETB, ` +
        `required: ${feeAmount.toFixed(2)} ETB. Please top up your wallet to accept this enquiry.`
    );
  }

  const fromCredit = roundCurrency(Math.min(creditBalance, feeAmount));

  return { fromCredit, fromCash: roundCurrency(feeAmount - fromCredit) };
}

/**
 * Portion of an unlock fee returned as non-withdrawable credit when a deal
 * collapses after the introduction was paid for.
 */
export function calculateRefundAmount(
  feePaid: number,
  refundPercentage: number
): number {
  if (!Number.isFinite(refundPercentage) || refundPercentage < 0 || refundPercentage > 100) {
    throw new DomainError("Refund percentage must be between 0 and 100.");
  }

  if (!Number.isFinite(feePaid) || feePaid < 0) {
    throw new DomainError("Fee paid must be a positive amount.");
  }

  return roundCurrency(feePaid * (refundPercentage / 100));
}

/** Total a supplier can spend right now. */
export function totalSpendable(cashBalance: number, creditBalance: number): number {
  return roundCurrency(cashBalance + creditBalance);
}
