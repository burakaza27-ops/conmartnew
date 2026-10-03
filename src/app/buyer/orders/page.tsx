// Buyer Orders are quarantined; all buyer procurement flow is driven through verified enquiries.
import { redirect } from "next/navigation";

export default function BuyerOrdersPage() {
  redirect("/buyer/enquiries");
}
