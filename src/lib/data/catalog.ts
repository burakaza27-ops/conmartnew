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

/**
 * Fetches active listings for the buyer catalog with rich filtering & sorting.
 */
export async function fetchCatalogListings(
  categorySlug?: string,
  searchQuery?: string,
  locationFilter?: string,
  brandFilter?: string,
  sortBy: string = "newest"
): Promise<CatalogListing[]> {
  const now = new Date();

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

  const listings = await db.listing.findMany({
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
  });

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

  return mapped;
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

