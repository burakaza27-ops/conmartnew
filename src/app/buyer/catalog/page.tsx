// =============================================================================
// ECON — Buyer Catalog Route Redirect
// =============================================================================
// Redirects legacy or generic /buyer/catalog links to the dedicated
// focused category route (/buyer/category/[categorySlug]).
// =============================================================================

import { redirect } from "next/navigation";

interface CatalogPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    location?: string;
    brand?: string;
    sort?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const category = params.category || "all";

  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set("search", params.search);
  if (params.location) queryParams.set("location", params.location);
  if (params.brand) queryParams.set("brand", params.brand);
  if (params.sort) queryParams.set("sort", params.sort);

  const qs = queryParams.toString();
  redirect(`/buyer/category/${category}${qs ? `?${qs}` : ""}`);
}
