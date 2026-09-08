// =============================================================================
// ConMart — New Seller Listing Page (Server Component)
// =============================================================================

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NewListingForm } from "./new-listing-form";
import { ensureDefaultCategories } from "@/lib/data/default-categories";

export default async function NewListingPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/seller/listings/new");
  }

  const dbUser = await db.user.findUnique({
    where: { authId: user.id },
    select: { companyName: true, role: true },
  });

  if (!dbUser || (dbUser.role !== "SELLER" && dbUser.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  await ensureDefaultCategories();

  // Fetch all active categories and curated products for selection
  const [categories, curatedProducts] = await Promise.all([
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
  ]);

  return (
    <NewListingForm
      categories={categories}
      curatedProducts={curatedProducts.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        title: p.title,
        unit: p.unit,
        imageUrl: p.imageUrl,
        specs: (p.specs as Record<string, string>) || {},
      }))}
      sellerCompanyName={dbUser.companyName || "Your Company"}
    />
  );
}
