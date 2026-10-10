// =============================================================================
// ConMart — Seller Wallet Redirect (Pivoted to Subscription Model)
// =============================================================================
// The prepaid wallet and pay-per-lead unlock flow have been completely removed
// in favor of the Supplier Subscription Directory model.
// =============================================================================

import { redirect } from "next/navigation";

export default function SellerWalletPage() {
  redirect("/seller/subscription");
}

