// =============================================================================
// ConMart — Catalog Data Fetchers (Server-Side)
// =============================================================================
// Data fetching functions for the buyer catalog and listing detail pages.
// These are plain async functions called from Server Components.
// =============================================================================

import { db } from "@/lib/db";
import type { ProductUnit } from "@/lib/types";
import { coarsenLocation, getMaskedSellerLabel } from "@/lib/security/masking";
import { isDirectChatEntitled } from "@/lib/marketplace/subscription";
import { unstable_cache } from "next/cache";
import { ensureDefaultCategories } from "@/lib/data/default-categories";

/**
 * Buyer-facing pseudonym for a supplier. Every catalog surface uses this so a
 * legal business name is never rendered before the introduction is paid for.
 */
function maskedSupplier(sellerId: string) {
  return {
    id: sellerId,
    name: "ConMart Verified Supplier",
    companyName: getMaskedSellerLabel(sellerId),
  };
}

// =============================================================================
// TYPES
// =============================================================================

/** Listing card data for the catalog grid */
export interface CatalogListing {
  id: string;
  location: string;
  active: boolean;
  imageUrl: string | null;
  product: {
    id: string;
    title: string;
    unit: ProductUnit;
    imageUrl: string | null;
    specs: Record<string, string>;
    category: {
      id: string;
      name: string;
      slug: string;
      iconName: string;
    };
  };
  seller: {
    id: string;
    name: string;
    companyName: string;
  };
  /** True when this supplier currently entitles buyer↔supplier chat. */
  directChatEnabled: boolean;
  /** Lowest price across all non-expired tiers */
  lowestPrice: number | null;
  /** Total number of active price tiers */
  tierCount: number;
}

/** Full listing detail with all price tiers */
export interface ListingDetail {
  id: string;
  location: string;
  active: boolean;
  imageUrl: string | null;
  product: {
    id: string;
    title: string;
    unit: ProductUnit;
    imageUrl: string | null;
    specs: Record<string, string>;
    category: {
      id: string;
      name: string;
      slug: string;
      iconName: string;
    };
  };
  seller: {
    id: string;
    name: string;
    companyName: string;
  };
  /** True when the supplier's subscription currently entitles direct chat. */
  directChatEnabled: boolean;
  priceTiers: Array<{
    id: string;
    minQty: number;
    maxQty: number;
    unitPrice: number;
    validUntil: Date;
    isExpired: boolean;
  }>;
}

/** Category with listing count and visuals for showcase grid */
export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  imageUrl: string | null;
  description: string | null;
  listingCount: number;
}

/** Detailed Category metadata with brands */
export interface CategoryDetailWithBrands {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  imageUrl: string | null;
  description: string | null;
  listingCount: number;
  availableBrands: string[];
}

// =============================================================================
// FETCHERS
// =============================================================================

/** Default number of catalog listings per page */
export const CATALOG_PAGE_SIZE = 24;

/** Paginated result wrapper for catalog listings */
export interface PaginatedCatalogResult {
  listings: CatalogListing[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/**
 * Fetches active listings for the buyer catalog with rich filtering, sorting,
 * and **page-based pagination**.
 *
 * Uses `take` / `skip` so the database only returns one page of results at a
 * time. A parallel `count()` query supplies the total for pagination controls.
 */
export async function fetchCatalogListings(
  categorySlug?: string,
  searchQuery?: string,
  locationFilter?: string,
  brandFilter?: string,
  sortBy: string = "newest",
  page: number = 1,
  pageSize: number = CATALOG_PAGE_SIZE
): Promise<PaginatedCatalogResult> {
  const now = new Date();
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(Math.max(1, Math.floor(pageSize)), 100);

  const whereClause: Record<string, unknown> = {
    active: true,
    seller: {
      OR: [
        { sellerProfile: null },
        { sellerProfile: { verificationStatus: { not: "SUSPENDED" } } },
      ],
    },
  };

  if (categorySlug && categorySlug !== "all") {
    whereClause.product = {
      category: { slug: categorySlug },
    };
  }

  if (locationFilter && locationFilter !== "all") {
    whereClause.location = {
      contains: locationFilter,
      mode: "insensitive",
    };
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    // Supplier company name is deliberately not searchable: matching on it
    // would let a buyer confirm a masked depot's legal name character by
    // character without ever paying an unlock fee.
    whereClause.OR = [
      { product: { title: { contains: q, mode: "insensitive" } } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  // Run count + page fetch in parallel for speed
  const [totalCount, listings] = await Promise.all([
    db.listing.count({ where: whereClause as never }),
    db.listing.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                iconName: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            companyName: true,
            sellerProfile: {
              select: {
                subscriptionStatus: true,
                subscriptionExpiresAt: true,
              },
            },
          },
        },
        priceTiers: {
          where: {
            validUntil: { gt: now },
          },
          orderBy: { unitPrice: "asc" },
        },
      },
      orderBy: { id: "desc" },
      take: safePageSize,
      skip: (safePage - 1) * safePageSize,
    }),
  ]);

  let mapped: CatalogListing[] = listings.map((listing) => ({
    id: listing.id,
    location: coarsenLocation(listing.location),
    active: listing.active,
    imageUrl: listing.imageUrl || listing.product.imageUrl || null,
    product: {
      id: listing.product.id,
      title: listing.product.title,
      unit: listing.product.unit as ProductUnit,
      imageUrl: listing.product.imageUrl || null,
      specs: (listing.product.specs as Record<string, string>) || {},
      category: listing.product.category,
    },
    seller: maskedSupplier(listing.seller.id),
    directChatEnabled: isDirectChatEntitled(listing.seller.sellerProfile, now),
    lowestPrice:
      listing.priceTiers.length > 0
        ? Number(listing.priceTiers[0].unitPrice)
        : null,
    tierCount: listing.priceTiers.length,
  }));

  // Filter by brand if specified
  if (brandFilter && brandFilter !== "all") {
    const targetBrand = brandFilter.toLowerCase();
    mapped = mapped.filter((item) => {
      const specBrand = item.product.specs?.brand?.toLowerCase() || "";
      const titleLower = item.product.title.toLowerCase();
      return specBrand.includes(targetBrand) || titleLower.includes(targetBrand);
    });
  }

  // Sort logic
  if (sortBy === "price_asc") {
    mapped.sort((a, b) => (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity));
  } else if (sortBy === "price_desc") {
    mapped.sort((a, b) => (b.lowestPrice ?? 0) - (a.lowestPrice ?? 0));
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));

  return {
    listings: mapped,
    totalCount,
    totalPages,
    page: safePage,
    pageSize: safePageSize,
  };
}

/**
 * Fetches full listing details including all price tiers.
 */
export async function fetchListingDetail(
  listingId: string
): Promise<ListingDetail | null> {
  const now = new Date();

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: {
      product: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconName: true,
            },
          },
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          companyName: true,
          sellerProfile: {
            select: {
              subscriptionStatus: true,
              subscriptionExpiresAt: true,
            },
          },
        },
      },
      priceTiers: {
        orderBy: { minQty: "asc" },
      },
    },
  });

  if (!listing) {
    return null;
  }

  return {
    id: listing.id,
    location: coarsenLocation(listing.location),
    active: listing.active,
    imageUrl: listing.imageUrl || listing.product.imageUrl || null,
    product: {
      id: listing.product.id,
      title: listing.product.title,
      unit: listing.product.unit as ProductUnit,
      imageUrl: listing.product.imageUrl || null,
      specs: (listing.product.specs as Record<string, string>) || {},
      category: listing.product.category,
    },
    seller: maskedSupplier(listing.seller.id),
    directChatEnabled: isDirectChatEntitled(listing.seller.sellerProfile, now),
    priceTiers: listing.priceTiers.map((tier) => ({
      id: tier.id,
      minQty: tier.minQty,
      maxQty: tier.maxQty,
      unitPrice: Number(tier.unitPrice),
      validUntil: tier.validUntil,
      isExpired: tier.validUntil < now,
    })),
  };
}

/**
 * Fetches all categories with their active listing counts, images, and descriptions.
 * Cached with Next.js unstable_cache (60s TTL / 'categories' tag) for instant sub-millisecond responses.
 */
const fetchCachedCategoriesWithCounts = unstable_cache(
  async (): Promise<CategoryWithCount[]> => {
    const categories = await db.category.findMany({
      include: {
        products: {
          include: {
            listings: {
              where: { active: true },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      iconName: cat.iconName,
      imageUrl: cat.imageUrl || null,
      description: cat.description || null,
      listingCount: cat.products.reduce(
        (total, product) => total + product.listings.length,
        0
      ),
    }));
  },
  ["categories-with-counts-v2"],
  { revalidate: 60, tags: ["categories"] }
);

export async function fetchCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  await ensureDefaultCategories();
  const cached = await fetchCachedCategoriesWithCounts();
  if (cached.length > 0) {
    return cached;
  }

  const categories = await db.category.findMany({
    include: {
      products: {
        include: {
          listings: {
            where: { active: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    iconName: cat.iconName,
    imageUrl: cat.imageUrl || null,
    description: cat.description || null,
    listingCount: cat.products.reduce(
      (total, product) => total + product.listings.length,
      0
    ),
  }));
}

/**
 * Fetches a single category with its brand options and listings count.
 */
export async function fetchCategoryBySlug(
  slug: string
): Promise<CategoryDetailWithBrands | null> {
  await ensureDefaultCategories();

  const category = await db.category.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          listings: {
            where: { active: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  const brandsSet = new Set<string>();
  for (const prod of category.products) {
    const specs = (prod.specs as Record<string, string>) || {};
    if (specs.brand) {
      brandsSet.add(specs.brand);
    }
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    iconName: category.iconName,
    imageUrl: category.imageUrl || null,
    description: category.description || null,
    listingCount: category.products.reduce(
      (total, product) => total + product.listings.length,
      0
    ),
    availableBrands: Array.from(brandsSet).sort(),
  };
}

/**
 * Fetches a buyer's orders with listing/product details.
 */
export async function fetchBuyerOrders(buyerAuthId: string) {
  const dbUser = await db.user.findUnique({
    where: { authId: buyerAuthId },
    select: { id: true },
  });

  if (!dbUser) {
    return [];
  }

  const orders = await db.order.findMany({
    where: { buyerId: dbUser.id },
    include: {
      listing: {
        include: {
          product: {
            select: { title: true, unit: true },
          },
        },
      },
      seller: {
        select: { companyName: true },
      },
      items: {
        include: {
          listing: {
            include: {
              product: {
                select: { title: true, unit: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => {
    const totalQty =
      order.qty ?? order.items.reduce((sum, item) => sum + item.qty, 0);
    const title =
      order.items.length > 1
        ? `${order.items.length} Materials (${order.items
            .map((i) => i.listing.product.title)
            .slice(0, 2)
            .join(", ")}${order.items.length > 2 ? "..." : ""})`
        : order.items[0]?.listing?.product?.title ??
          order.listing?.product?.title ??
          "Construction Materials";
    const unit =
      order.items.length > 1
        ? "Items"
        : order.items[0]?.listing?.product?.unit ??
          order.listing?.product?.unit ??
          "UNIT";
    const location =
      order.items[0]?.listing?.location ??
      order.listing?.location ??
      "Addis Ababa";

    return {
      id: order.id,
      referenceCode: order.referenceCode,
      qty: totalQty,
      grandTotal: Number(order.grandTotal),
      status: order.status,
      createdAt: order.createdAt,
      productTitle: title,
      productUnit: unit,
      sellerCompany: `ConMart Verified Depot (${location})`,
    };
  });
}

export type BuyerOrderRow = Awaited<ReturnType<typeof fetchBuyerOrders>>[number];

/**
 * Fetches recent buyer purchase enquiries for the category hub.
 */
export async function fetchRecentBuyerEnquiries(
  buyerAuthId: string,
  limit: number = 3
) {
  const dbUser = await db.user.findUnique({
    where: { authId: buyerAuthId },
    select: { id: true },
  });

  if (!dbUser) {
    return [];
  }

  const enquiries = await db.enquiry.findMany({
    where: { buyerId: dbUser.id },
    include: {
      listing: {
        include: {
          product: {
            select: {
              title: true,
              unit: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      unlockRecord: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return enquiries.map((enq) => ({
    id: enq.id,
    referenceCode: enq.referenceCode,
    qty: enq.qty,
    unit: enq.unit,
    status: enq.status,
    productTitle: enq.listing.product.title,
    categoryName: enq.listing.product.category.name,
    isUnlocked: !!enq.unlockRecord,
    createdAt: enq.createdAt,
  }));
}

/**
 * Fetches top recent buyer orders for the Category Hub dashboard.
 */
export async function fetchRecentBuyerOrders(
  buyerAuthId: string,
  limit: number = 3
) {
  const dbUser = await db.user.findUnique({
    where: { authId: buyerAuthId },
    select: { id: true },
  });

  if (!dbUser) {
    return [];
  }

  const orders = await db.order.findMany({
    where: { buyerId: dbUser.id },
    include: {
      listing: {
        include: {
          product: {
            select: { title: true, unit: true },
          },
        },
      },
      seller: {
        select: { companyName: true },
      },
      items: {
        include: {
          listing: {
            include: {
              product: {
                select: { title: true, unit: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return orders.map((order) => {
    const totalQty =
      order.qty ?? order.items.reduce((sum, item) => sum + item.qty, 0);
    const title =
      order.items.length > 1
        ? `${order.items.length} Materials (${order.items
            .map((i) => i.listing.product.title)
            .slice(0, 2)
            .join(", ")}${order.items.length > 2 ? "..." : ""})`
        : order.items[0]?.listing?.product?.title ??
          order.listing?.product?.title ??
          "Construction Materials";
    const unit =
      order.items.length > 1
        ? "Items"
        : order.items[0]?.listing?.product?.unit ??
          order.listing?.product?.unit ??
          "UNIT";
    const location =
      order.items[0]?.listing?.location ??
      order.listing?.location ??
      "Addis Ababa";

    return {
      id: order.id,
      referenceCode: order.referenceCode,
      qty: totalQty,
      grandTotal: Number(order.grandTotal),
      status: order.status,
      createdAt: order.createdAt,
      productTitle: title,
      productUnit: unit,
      sellerCompany: `ConMart Verified Depot (${location})`,
    };
  });
}

/**
 * Fetches other active listings offered from the same supplier/depot.
 * Used on the listing detail page so buyers can bundle multiple materials
 * from the same physical warehouse to save on freight/trucking.
 */
export async function fetchDepotListings(
  sellerId: string,
  excludeListingId?: string
): Promise<CatalogListing[]> {
  const now = new Date();
  const listings = await db.listing.findMany({
    where: {
      sellerId,
      active: true,
      ...(excludeListingId ? { id: { not: excludeListingId } } : {}),
    },
    include: {
      product: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconName: true,
            },
          },
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          companyName: true,
          sellerProfile: {
            select: {
              subscriptionStatus: true,
              subscriptionExpiresAt: true,
            },
          },
        },
      },
      priceTiers: {
        where: {
          validUntil: { gt: now },
        },
        orderBy: { unitPrice: "asc" },
      },
    },
    orderBy: { id: "desc" },
  });

  return listings.map((listing) => ({
    id: listing.id,
    location: coarsenLocation(listing.location),
    active: listing.active,
    imageUrl: listing.imageUrl || listing.product.imageUrl || null,
    product: {
      id: listing.product.id,
      title: listing.product.title,
      unit: listing.product.unit as ProductUnit,
      imageUrl: listing.product.imageUrl || null,
      specs: (listing.product.specs as Record<string, string>) || {},
      category: listing.product.category,
    },
    seller: maskedSupplier(listing.seller.id),
    directChatEnabled: isDirectChatEntitled(listing.seller.sellerProfile, now),
    lowestPrice:
      listing.priceTiers.length > 0
        ? Number(listing.priceTiers[0].unitPrice)
        : null,
    tierCount: listing.priceTiers.length,
  }));
}

export interface CompetingOffer {
  listingId: string;
  sellerId: string;
  depotName: string;
  location: string;
  sellerType: string;
  verificationStatus: string;
  vatRegistered: boolean;
  directChatEnabled: boolean;
  lowestPrice: number | null;
  moq: number;
  tiers: Array<{
    id: string;
    minQty: number;
    maxQty: number;
    unitPrice: number;
    validUntil: Date;
  }>;
}

export interface ProductWithOffers {
  id: string;
  title: string;
  unit: ProductUnit;
  imageUrl: string | null;
  specs: Record<string, string>;
  category: {
    id: string;
    name: string;
    slug: string;
    unlockFee: number;
  };
  offers: CompetingOffer[];
}

// =============================================================================
// PRODUCT-GROUPED CATALOG (deduplicated by product, not listing)
// =============================================================================

/** One row in the product-grouped catalog grid */
export interface ProductCatalogRow {
  productId: string;
  title: string;
  unit: ProductUnit;
  imageUrl: string | null;
  specs: Record<string, string>;
  category: {
    id: string;
    name: string;
    slug: string;
    iconName: string;
  };
  /** Number of active suppliers offering this product */
  supplierCount: number;
  /** Lowest price across all supplier listings */
  lowestPrice: number | null;
  /** Highest price across all supplier listings */
  highestPrice: number | null;
}

/**
 * Fetches products grouped & deduplicated for the catalog grid.
 * Each product appears once; clicking it leads to the competing-offers page
 * showing all suppliers sorted by price.
 */
export async function fetchProductsCatalog(
  categorySlug?: string,
  searchQuery?: string,
  brandFilter?: string,
  sortBy: string = "supplier_count"
): Promise<ProductCatalogRow[]> {
  const now = new Date();

  const whereClause: Record<string, unknown> = {
    listings: {
      some: {
        active: true,
        seller: {
          OR: [
            { sellerProfile: null },
            { sellerProfile: { verificationStatus: { not: "SUSPENDED" } } },
          ],
        },
      },
    },
  };

  if (categorySlug && categorySlug !== "all") {
    whereClause.category = { slug: categorySlug };
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    whereClause.title = { contains: q, mode: "insensitive" };
  }

  const products = await db.product.findMany({
    where: whereClause,
    include: {
      category: {
        select: { id: true, name: true, slug: true, iconName: true },
      },
      listings: {
        where: {
          active: true,
          seller: {
            OR: [
              { sellerProfile: null },
              { sellerProfile: { verificationStatus: { not: "SUSPENDED" } } },
            ],
          },
        },
        include: {
          priceTiers: {
            where: { validUntil: { gt: now } },
            orderBy: { unitPrice: "asc" },
          },
        },
      },
    },
  });

  let rows: ProductCatalogRow[] = products
    .filter((p) => p.listings.length > 0)
    .map((p) => {
      const allPrices = p.listings.flatMap((l) =>
        l.priceTiers.map((t) => Number(t.unitPrice))
      );
      const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
      const highestPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

      return {
        productId: p.id,
        title: p.title,
        unit: p.unit as ProductUnit,
        imageUrl: p.imageUrl || null,
        specs: (p.specs as Record<string, string>) || {},
        category: p.category,
        supplierCount: p.listings.length,
        lowestPrice,
        highestPrice,
      };
    });

  // Brand filter (applied after loading since brand is in specs JSON)
  if (brandFilter && brandFilter !== "all") {
    const target = brandFilter.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.specs?.brand?.toLowerCase().includes(target) ||
        r.title.toLowerCase().includes(target)
    );
  }

  // Sort
  if (sortBy === "price_asc") {
    rows.sort((a, b) => (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity));
  } else if (sortBy === "price_desc") {
    rows.sort((a, b) => (b.lowestPrice ?? 0) - (a.lowestPrice ?? 0));
  } else {
    // Default: most suppliers first (gives buyers most choice at top)
    rows.sort((a, b) => b.supplierCount - a.supplierCount);
  }

  return rows;
}

// =============================================================================
// SELLER STORE (public profile)
// =============================================================================

export interface SellerStoreListing {
  listingId: string;
  productId: string;
  productTitle: string;
  productUnit: ProductUnit;
  imageUrl: string | null;
  location: string;
  lowestPrice: number | null;
  tierCount: number;
  categoryName: string;
  categorySlug: string;
  stockState: string;
}

export interface SellerStoreProfile {
  sellerId: string;
  companyName: string;
  sellerType: string;
  verificationStatus: string;
  vatRegistered: boolean;
  completedDealsCount: number;
  responseTimeAvgMinutes: number;
  subscriptionStatus: string;
  directChatEnabled: boolean;
  listings: SellerStoreListing[];
}

/**
 * Fetches a seller's public store profile — company name, verification badge,
 * and all their active product listings. Company name is intentionally public
 * (this is the seller's chosen storefront). Contact details (phone) remain
 * server-side only until the introduction fee is paid.
 */
export async function fetchSellerStore(
  sellerId: string
): Promise<SellerStoreProfile | null> {
  const now = new Date();

  const seller = await db.user.findUnique({
    where: { id: sellerId, role: "SELLER" },
    select: {
      id: true,
      companyName: true,
      sellerProfile: {
        select: {
          sellerType: true,
          verificationStatus: true,
          vatRegistered: true,
          completedDealsCount: true,
          responseTimeAvgMinutes: true,
          subscriptionStatus: true,
          subscriptionExpiresAt: true,
        },
      },
      sellerListings: {
        where: { active: true },
        include: {
          product: {
            include: {
              category: {
                select: { name: true, slug: true },
              },
            },
          },
          priceTiers: {
            where: { validUntil: { gt: now } },
            orderBy: { unitPrice: "asc" },
          },
        },
        orderBy: { id: "desc" },
      },
    },
  });

  if (!seller) return null;

  const profile = seller.sellerProfile;

  return {
    sellerId: seller.id,
    companyName: seller.companyName ?? "Verified Supplier",
    sellerType: profile?.sellerType ?? "RETAILER",
    verificationStatus: profile?.verificationStatus ?? "UNVERIFIED",
    vatRegistered: profile?.vatRegistered ?? false,
    completedDealsCount: profile?.completedDealsCount ?? 0,
    responseTimeAvgMinutes: profile?.responseTimeAvgMinutes ?? 60,
    subscriptionStatus: profile?.subscriptionStatus ?? "FREE",
    directChatEnabled: isDirectChatEntitled(profile, now),
    listings: seller.sellerListings.map((l) => ({
      listingId: l.id,
      productId: l.product.id,
      productTitle: l.product.title,
      productUnit: l.product.unit as ProductUnit,
      imageUrl: l.imageUrl || l.product.imageUrl || null,
      location: coarsenLocation(l.location),
      lowestPrice:
        l.priceTiers.length > 0 ? Number(l.priceTiers[0].unitPrice) : null,
      tierCount: l.priceTiers.length,
      categoryName: l.product.category.name,
      categorySlug: l.product.category.slug,
      stockState: l.stockState,
    })),
  };
}

/**
 * Fetches a paginated list of active seller stores for the stores browse page.
 */
export interface SellerStoreCard {
  sellerId: string;
  companyName: string;
  sellerType: string;
  verificationStatus: string;
  subscriptionStatus: string;
  activeListingCount: number;
  location: string | null;
}

export async function fetchSellerStores(): Promise<SellerStoreCard[]> {
  const sellers = await db.user.findMany({
    where: {
      role: "SELLER",
      OR: [
        { sellerProfile: null },
        { sellerProfile: { verificationStatus: { not: "SUSPENDED" } } },
      ],
      sellerListings: { some: { active: true } },
    },
    select: {
      id: true,
      companyName: true,
      sellerProfile: {
        select: {
          sellerType: true,
          verificationStatus: true,
          subscriptionStatus: true,
        },
      },
      sellerListings: {
        where: { active: true },
        select: { location: true },
      },
    },
  });

  return sellers.map((s) => ({
    sellerId: s.id,
    companyName: s.companyName ?? "Verified Supplier",
    sellerType: s.sellerProfile?.sellerType ?? "RETAILER",
    verificationStatus: s.sellerProfile?.verificationStatus ?? "UNVERIFIED",
    subscriptionStatus: s.sellerProfile?.subscriptionStatus ?? "FREE",
    activeListingCount: s.sellerListings.length,
    location: s.sellerListings[0]?.location
      ? coarsenLocation(s.sellerListings[0].location)
      : null,
  }));
}

/**
 * Fetches a product and all competing seller depot offers side-by-side.
 */
export async function fetchProductWithCompetingOffers(
  productId: string
): Promise<ProductWithOffers | null> {
  const now = new Date();

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          unlockFee: true,
        },
      },
      listings: {
        where: {
          active: true,
          seller: {
            OR: [
              { sellerProfile: null },
              { sellerProfile: { verificationStatus: { not: "SUSPENDED" } } },
            ],
          },
        },
        include: {
          seller: {
            select: {
              id: true,
              sellerProfile: {
                select: {
                  sellerType: true,
                  verificationStatus: true,
                  vatRegistered: true,
                  subscriptionStatus: true,
                  subscriptionExpiresAt: true,
                },
              },
            },
          },
          priceTiers: {
            where: { validUntil: { gt: now } },
            orderBy: { minQty: "asc" },
          },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const offers: CompetingOffer[] = product.listings.map((listing) => {
    const profile = listing.seller.sellerProfile;
    const lowestPrice =
      listing.priceTiers.length > 0
        ? Math.min(...listing.priceTiers.map((t) => Number(t.unitPrice)))
        : null;
    const moq =
      listing.priceTiers.length > 0
        ? Math.min(...listing.priceTiers.map((t) => t.minQty))
        : 1;

    return {
      listingId: listing.id,
      sellerId: listing.seller.id,
      depotName: getMaskedSellerLabel(listing.seller.id),
      location: coarsenLocation(listing.location),
      sellerType: profile?.sellerType || "RETAILER",
      // A supplier with no profile row has not been reviewed. Defaulting these
      // to VERIFIED / VAT-registered would show a trust badge nobody earned.
      verificationStatus: profile?.verificationStatus || "UNVERIFIED",
      vatRegistered: profile?.vatRegistered ?? false,
      directChatEnabled: isDirectChatEntitled(profile, now),
      lowestPrice,
      moq,
      tiers: listing.priceTiers.map((t) => ({
        id: t.id,
        minQty: t.minQty,
        maxQty: t.maxQty,
        unitPrice: Number(t.unitPrice),
        validUntil: t.validUntil,
      })),
    };
  });

  // Sort offers with lowest starting price first
  offers.sort((a, b) => (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity));

  return {
    id: product.id,
    title: product.title,
    unit: product.unit as ProductUnit,
    imageUrl: product.imageUrl || null,
    specs: (product.specs as Record<string, string>) || {},
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
      unlockFee: Number(product.category.unlockFee),
    },
    offers,
  };
}

