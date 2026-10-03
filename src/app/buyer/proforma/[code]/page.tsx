// Buyer Proforma pages are quarantined; all transactions are conducted via Enquiries and Introductions.
import { redirect } from "next/navigation";

export default function ProformaPage() {
  redirect("/buyer/enquiries");
}
