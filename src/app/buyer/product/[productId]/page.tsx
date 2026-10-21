// =============================================================================
// ECON — Product Competing Offers Comparison Page
// =============================================================================

import { notFound } from "next/navigation";
import { fetchProductWithCompetingOffers } from "@/lib/data/catalog";
import { getSessionUser } from "@/lib/auth/session";
import { ProductOffersView } from "./product-offers-view";

interface ProductOffersPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductOffersPage({ params }: ProductOffersPageProps) {
  const { productId } = await params;
  let productWithOffers = null;
  let user = null;

  try {
    [productWithOffers, user] = await Promise.all([
      fetchProductWithCompetingOffers(productId).catch((err) => {
        console.error(`[ProductOffersPage] Failed to fetch product ${productId}:`, err);
        return null;
      }),
      getSessionUser().catch(() => null),
    ]);
  } catch (err) {
    console.error(`[ProductOffersPage] Unhandled exception loading ${productId}:`, err);
  }

  if (!productWithOffers) {
    notFound();
  }

  return <ProductOffersView product={productWithOffers} isAuthenticated={Boolean(user)} />;
}
