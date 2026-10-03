// =============================================================================
// ConMart — Listing Detail Page (Server Component)
// =============================================================================
// Fetches listing data and supplier yard inventory, delegating rendering to
// the bilingual ListingDetailView client component.
// =============================================================================

import { notFound } from "next/navigation";
import { fetchListingDetail, fetchDepotListings } from "@/lib/data/catalog";
import { getSessionUser } from "@/lib/auth/session";
import { ListingDetailView } from "./listing-detail-view";

interface ListingDetailPageProps {
  params: Promise<{ listingId: string }>;
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const { listingId } = await params;
  const [listing, user] = await Promise.all([
    fetchListingDetail(listingId),
    getSessionUser(),
  ]);

  if (!listing || !listing.active) {
    notFound();
  }

  // Fetch other active materials from this same depot/supplier
  const depotListings = await fetchDepotListings(listing.seller.id, listing.id);
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  return (
    <ListingDetailView
      listing={listing}
      depotListings={depotListings}
      adminPhone={adminPhone}
      isAuthenticated={Boolean(user)}
    />
  );
}
