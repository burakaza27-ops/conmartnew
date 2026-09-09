// =============================================================================
// ConMart — Mediated-Deal Commission Arithmetic
// =============================================================================
// Pure. The write path persists whatever this function returns; it does not
// re-derive percentages in SQL. Shares are of the *fee*, not of the order.
// =============================================================================

import { roundCurrency } from "@/lib/money";

export const DEFAULT_TOTAL_FEE_PERCENT = 5;
export const DEFAULT_PLATFORM_SHARE_PERCENT = 60;
export const DEFAULT_AGENT_SHARE_PERCENT = 40;

export interface CommissionInput {
  orderTotal: number;
  totalFeePercent?: number;
  platformSharePercent?: number;
  agentSharePercent?: number;
}

export interface CommissionBreakdown {
  orderTotal: number;
  totalFeePercent: number;
  platformSharePercent: number;
  agentSharePercent: number;
  feeAmount: number;
  platformAmount: number;
  agentAmount: number;
}

export function calculateCommission(input: CommissionInput): CommissionBreakdown {
  const orderTotal = roundCurrency(input.orderTotal);
  const totalFeePercent = input.totalFeePercent ?? DEFAULT_TOTAL_FEE_PERCENT;
  const platformSharePercent =
    input.platformSharePercent ?? DEFAULT_PLATFORM_SHARE_PERCENT;
  const agentSharePercent = input.agentSharePercent ?? DEFAULT_AGENT_SHARE_PERCENT;

  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    throw new RangeError("Commission requires a positive order total.");
  }

  if (totalFeePercent < 0 || totalFeePercent > 100) {
    throw new RangeError("Total fee percent must be between 0 and 100.");
  }

  if (
    roundCurrency(platformSharePercent + agentSharePercent) !== 100
  ) {
    throw new RangeError("Platform and agent shares must add up to 100.");
  }

  const feeAmount = roundCurrency(orderTotal * (totalFeePercent / 100));
  const platformAmount = roundCurrency(feeAmount * (platformSharePercent / 100));
  const agentAmount = roundCurrency(feeAmount - platformAmount);

  return {
    orderTotal,
    totalFeePercent,
    platformSharePercent,
    agentSharePercent,
    feeAmount,
    platformAmount,
    agentAmount,
  };
}
