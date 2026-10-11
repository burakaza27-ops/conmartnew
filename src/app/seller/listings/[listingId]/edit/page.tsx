// =============================================================================
// ConMart — Edit Seller Listing Page (Server Component)
// =============================================================================

import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { EditListingForm } from "./edit-listing-form";
import type { ProductUnit } from "@/lib/types";

interface EditListingPageProps {
  params: Promise<{ listingId: string }>;
}

async function fetchListingForEdit(id: string) {
  return db.listing.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      priceTiers: {
        orderBy: { minQty: "asc" },
      },
    },
  });
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { listingId } = await params;

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?redirect=/seller/listings/${listingId}/edit`);
  }

  let dbUser: { id: string; companyName: string; role: string } | null = null;
  try {
    dbUser = await db.user.findUnique({
      where: { authId: user.id },
      select: { id: true, companyName: true, role: true },
    });
  } catch (err) {
    console.error("[seller/listings/edit] db.user.findUnique failed:", err);
  }

  if (!dbUser || (dbUser.role !== "SELLER" && dbUser.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  let listing: Awaited<ReturnType<typeof fetchListingForEdit>> = null;
  try {
    listing = await fetchListingForEdit(listingId);
  } catch (err) {
    console.error("[seller/listings/edit] fetchListingForEdit failed:", err);
  }

  if (!listing) {
    notFound();
  }

  // Authorization: must own listing or be admin
  if (listing.sellerId !== dbUser.id && dbUser.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <EditListingForm
      listingId={listing.id}
      initialTitle={listing.product.title}
      initialLocation={listing.location}
      initialImageUrl={listing.imageUrl || listing.product.imageUrl || ""}
      categoryName={listing.product.category.name}
      unit={listing.product.unit as ProductUnit}
      sellerCompanyName={dbUser.companyName || "Your Company"}
      initialTiers={listing.priceTiers.map((t) => ({
        id: t.id,
        minQty: t.minQty,
        maxQty: t.maxQty,
        unitPrice: Number(t.unitPrice),
        validUntil: t.validUntil,
      }))}
    />
  );
}
