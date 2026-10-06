// =============================================================================
// ConMart — Focused Category Catalog Page (Stage 2 — Product-Grouped)
// =============================================================================
// Shows ONE card per product type. Clicking a product reveals all suppliers
// competing on price. No more duplicate [Bar, Bar, Bar] entries.
// =============================================================================

import { notFound } from "next/navigation";
import {
  fetchProductsCatalog,
  fetchCategoriesWithCounts,
  fetchCategoryBySlug,
} from "@/lib/data/catalog";
import { CategoryView } from "./category-view";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{
    search?: string;
    brand?: string;
    sort?: string;
  }>;
}

export default async function FocusedCategoryCatalogPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { categorySlug } = await params;
  const sParams = await searchParams;

  const searchQuery = sParams.search;
  const brandFilter = sParams.brand;
  const sortBy = sParams.sort || "supplier_count";

  const isAll = categorySlug === "all";

  const [allCategories, categoryDetail, products] = await Promise.all([
    fetchCategoriesWithCounts(),
    isAll ? null : fetchCategoryBySlug(categorySlug),
    fetchProductsCatalog(categorySlug, searchQuery, brandFilter, sortBy),
  ]);

  if (!isAll && !categoryDetail) {
    notFound();
  }

  const availableBrands = Array.from(
    new Set(
      products
        .map((p) => p.specs?.brand)
        .filter((b): b is string => Boolean(b))
    )
  ).sort();

  return (
    <CategoryView
      allCategories={allCategories}
      categorySlug={categorySlug}
      categoryDetail={categoryDetail}
      products={products}
      availableBrands={availableBrands}
      searchQuery={searchQuery}
      brandFilter={brandFilter}
      sortBy={sortBy}
    />
  );
}
