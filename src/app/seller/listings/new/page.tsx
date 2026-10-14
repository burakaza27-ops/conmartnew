// =============================================================================
// ECON — New Seller Listing Page (Server Component)
// =============================================================================

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NewListingForm } from "./new-listing-form";
import { ensureDefaultCategories } from "@/lib/data/default-categories";
import type { ProductUnit } from "@prisma/client";

export default async function NewListingPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/seller/listings/new");
  }

  let dbUser: { companyName: string; role: string } | null = null;
  try {
    dbUser = await db.user.findUnique({
      where: { authId: user.id },
      select: { companyName: true, role: true },
    });
  } catch (err) {
    console.error("[seller/listings/new] db.user.findUnique failed:", err);
  }

  if (!dbUser || (dbUser.role !== "SELLER" && dbUser.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  await ensureDefaultCategories();

  let categories: Array<{ id: string; name: string; slug: string; imageUrl: string | null }> = [];
  let curatedProducts: Array<{ id: string; categoryId: string; title: string; unit: ProductUnit; imageUrl: string | null; specs: Record<string, string> }> = [];
  let savedLocations: string[] = [];

  try {
    const [cats, prods, prevListings] = await Promise.all([
      db.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
      db.product.findMany({
        select: {
          id: true,
          categoryId: true,
          title: true,
          unit: true,
          imageUrl: true,
          specs: true,
        },
        orderBy: { title: "asc" },
      }),
      db.listing.findMany({
        where: { seller: { authId: user.id }, isDeleted: false },
        select: { location: true },
        distinct: ["location"],
        take: 8,
      }),
    ]);
    categories = cats;
    curatedProducts = prods.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      title: p.title,
      unit: p.unit as ProductUnit,
      imageUrl: p.imageUrl,
      specs: (p.specs as Record<string, string>) || {},
    }));
    savedLocations = Array.from(new Set(prevListings.map((l) => l.location).filter(Boolean)));
  } catch (err) {
    console.error("[seller/listings/new] category/product fetch failed:", err);
  }

  return (
    <NewListingForm
      categories={categories}
      curatedProducts={curatedProducts}
      sellerCompanyName={dbUser.companyName || "Your Company"}
      savedLocations={savedLocations}
    />
  );
}
