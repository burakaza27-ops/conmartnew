// =============================================================================
// ConMart — Product Competing Offers Comparison Page
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
  const [productWithOffers, user] = await Promise.all([
    fetchProductWithCompetingOffers(productId),
    getSessionUser(),
  ]);

  if (!productWithOffers) {
    notFound();
  }

  return <ProductOffersView product={productWithOffers} isAuthenticated={Boolean(user)} />;
}
