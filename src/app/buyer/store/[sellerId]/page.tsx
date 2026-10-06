// =============================================================================
// ECON — Seller Store Page
// =============================================================================
// Public storefront for a single supplier — shows their name, verification,
// and all active product listings. No phone/contact until enquiry is unlocked.
// =============================================================================

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchSellerStore } from "@/lib/data/catalog";
import { SellerStoreView } from "./seller-store-view";

interface StorePageProps {
  params: Promise<{ sellerId: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { sellerId } = await params;
  const store = await fetchSellerStore(sellerId);
  if (!store) return { title: "Store Not Found | ECON" };
  return {
    title: `${store.companyName} — Store | ECON`,
    description: `Browse ${store.listings.length} construction materials from ${store.companyName} on ECON.`,
  };
}

export default async function SellerStorePage({ params }: StorePageProps) {
  const { sellerId } = await params;
  const store = await fetchSellerStore(sellerId);

  if (!store) notFound();

  return <SellerStoreView store={store} />;
}
