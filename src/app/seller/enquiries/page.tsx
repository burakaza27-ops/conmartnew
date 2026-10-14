// =============================================================================
// ECON — Seller Enquiry Inbox Page
// =============================================================================

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getSellerEnquiriesAction } from "@/app/actions/enquiries";
import { getSellerWalletAction } from "@/app/actions/wallet";
import { SellerEnquiriesView } from "./enquiries-view";

export const metadata = {
  title: "Purchase Enquiries Inbox | ECON Ethiopia",
  description: "Review incoming purchase enquiries from verified contractors and unlock introduction contacts.",
};

export default async function SellerEnquiriesPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/seller/enquiries");
  }

  const [enquiriesRes, walletRes] = await Promise.all([
    getSellerEnquiriesAction(),
    getSellerWalletAction(),
  ]);

  const enquiries = enquiriesRes.success && enquiriesRes.data ? enquiriesRes.data : [];
  const wallet = walletRes.success && walletRes.data ? walletRes.data : {
    totalSpendable: 0,
    cashBalance: 0,
    creditBalance: 0,
  };

  return (
    <SellerEnquiriesView
      initialEnquiries={enquiries}
      walletSpendable={wallet.totalSpendable}
      walletCash={wallet.cashBalance}
      walletCredit={wallet.creditBalance}
    />
  );
}
