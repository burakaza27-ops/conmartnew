// =============================================================================
// ECON — Buyer Purchase Enquiries Tracker Page
// =============================================================================

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getBuyerEnquiriesAction } from "@/app/actions/enquiries";
import { BuyerEnquiriesView } from "./buyer-enquiries-view";

export const metadata = {
  title: "My Purchase Enquiries | ECON Ethiopia",
  description: "Track your purchase requests sent to verified Ethiopian construction suppliers.",
};

export default async function BuyerEnquiriesPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/buyer/enquiries");
  }

  const result = await getBuyerEnquiriesAction();
  const enquiries = result.success && result.data ? result.data : [];

  return <BuyerEnquiriesView initialEnquiries={enquiries} />;
}
