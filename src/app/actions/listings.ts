"use server";

// =============================================================================
// ECON — Listing Server Actions
// =============================================================================
// Handles:
// 1. Creation of new products and seller listings with volume price tiers & images
// 2. Status toggling (active/inactive)
// 3. Deletion of listings
// =============================================================================

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProductUnit, StockState } from "@prisma/client";
import { qualifyReferralIfApplicable } from "@/lib/marketplace/referral";
import {
  rateLimit,
  getClientIdentifier,
  rateLimitMessage,
} from "@/lib/security/rate-limit";

export interface CreatePriceTierInput {
  minQty: number;
  maxQty: number;
  unitPrice: number;
  validDays?: number;
}

export interface CreateListingInput {
  categoryId: string;
  title: string;
  unit: ProductUnit;
  specs: Record<string, string>;
  location: string;
  imageUrl?: string;
  brand?: string;
  description?: string;
  availableQty?: number;
  existingProductId?: string;
  priceTiers: CreatePriceTierInput[];
}

export async function createSellerListing(input: CreateListingInput) {
  try {
    const auth = await authorize(["SELLER", "ADMIN"]);
    if (!auth.ok) {
      return { error: auth.error };
    }
    const dbUser = auth.user;

    // Rate-limit: 30 listing creations per hour per seller
    const clientId = await getClientIdentifier();
    const rl = await rateLimit(`listing:create:${dbUser.id}`, { limit: 30, windowSeconds: 3600 });
    if (!rl.allowed) {
      return { error: rateLimitMessage(rl.retryAfterSeconds) };
    }

    if (!input.title || input.title.trim().length < 3) {
      return { error: "Please enter a valid product title (at least 3 characters)." };
    }

    if (!input.categoryId) {
      return { error: "Please select a product category." };
    }

    if (!input.location || input.location.trim().length < 2) {
      return { error: "Please enter your warehouse/yard location." };
    }

    if (!input.priceTiers || input.priceTiers.length === 0) {
      return { error: "Please provide at least one volume pricing tier." };
    }

    // Validate price tiers
    for (const tier of input.priceTiers) {
      if (tier.minQty <= 0 || tier.maxQty <= 0 || tier.unitPrice <= 0) {
        return { error: "Tier quantities and unit prices must be greater than zero." };
      }
      if (tier.minQty > tier.maxQty) {
        return { error: "Minimum quantity cannot exceed maximum quantity in any tier." };
      }
    }

    // Sort tiers by minQty to check for overlaps
    const sortedTiers = [...input.priceTiers].sort((a, b) => a.minQty - b.minQty);
    for (let i = 1; i < sortedTiers.length; i++) {
      if (sortedTiers[i].minQty <= sortedTiers[i - 1].maxQty) {
        return {
          error: `Price tier quantities overlap: [${sortedTiers[i - 1].minQty}–${sortedTiers[i - 1].maxQty}] and [${sortedTiers[i].minQty}–${sortedTiers[i].maxQty}]. Each tier must have distinct quantity intervals.`,
        };
      }
    }

    // Fetch category for slug-based revalidation
    const category = await db.category.findUnique({
      where: { id: input.categoryId },
      select: { slug: true },
    });

    if (category) {
      const catSlug = category.slug.toLowerCase();
      const titleLower = input.title.toLowerCase();
      if (catSlug.includes("rebar") && (titleLower.includes("cement") || titleLower.includes("ሲሚንቶ"))) {
        return { error: "Cement products cannot be listed under the Rebar category." };
      }
      if (catSlug.includes("cement") && (titleLower.includes("rebar") || titleLower.includes("steel bar") || titleLower.includes("ብረት"))) {
        return { error: "Steel/rebar products cannot be listed under the Cement category." };
      }
    }

    // Execute in a single transaction
    const result = await db.$transaction(async (tx) => {
      // 0. Ensure SellerProfile and Wallet exist for this seller
      const existingProfile = await tx.sellerProfile.findUnique({
        where: { userId: dbUser.id },
      });
      if (!existingProfile) {
        await tx.sellerProfile.create({
          data: {
            userId: dbUser.id,
            verificationStatus: "UNVERIFIED",
            sellerType: "RETAILER",
          },
        });
      }

      const existingWallet = await tx.wallet.findUnique({
        where: { sellerId: dbUser.id },
      });
      if (!existingWallet) {
        await tx.wallet.create({
          data: {
            sellerId: dbUser.id,
            cashBalance: 0,
            creditBalance: 0,
          },
        });
      }

      // 1. Link to existing curated Product or create new definition
      let targetProductId = input.existingProductId;

      if (targetProductId) {
        const existingProd = await tx.product.findUnique({
          where: { id: targetProductId },
          select: { title: true },
        });
        if (
          !existingProd ||
          existingProd.title.trim().toLowerCase() !== input.title.trim().toLowerCase()
        ) {
          targetProductId = undefined;
        }
      }

      if (!targetProductId) {
        const product = await tx.product.create({
          data: {
            categoryId: input.categoryId,
            title: input.title.trim(),
            unit: input.unit,
            imageUrl: input.imageUrl || null,
            specs: input.specs || {},
          },
        });
        targetProductId = product.id;
      }

      const roundedAvailableQty =
        input.availableQty !== undefined && input.availableQty !== null
          ? Math.max(0, Math.round(input.availableQty))
          : null;

      // 2. Create the Listing
      const listing = await tx.listing.create({
        data: {
          sellerId: dbUser.id,
          productId: targetProductId,
          active: true,
          location: input.location.trim(),
          imageUrl: input.imageUrl || null,
          brand: input.brand?.trim() || null,
          description: input.description?.trim() || null,
          availableQty: roundedAvailableQty,
        },
      });

      // 3. Create the Price Tiers
      const defaultValidUntil = new Date();
      defaultValidUntil.setMonth(defaultValidUntil.getMonth() + 6); // 6 months default

      const tierCreates = input.priceTiers.map((tier) => {
        const validUntil = new Date();
        const days = tier.validDays || 180;
        validUntil.setDate(validUntil.getDate() + days);

        return tx.priceTier.create({
          data: {
            listingId: listing.id,
            minQty: Math.max(1, Math.round(tier.minQty)),
            maxQty: Math.max(1, Math.round(tier.maxQty)),
            unitPrice: tier.unitPrice,
            validUntil,
          },
        });
      });

      await Promise.all(tierCreates);

      return { listing, targetProductId };
    });

    revalidatePath("/seller/dashboard");
    revalidatePath("/seller/listings");
    revalidatePath("/buyer");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/category/all");
    if (category?.slug) {
      revalidatePath(`/buyer/category/${category.slug}`);
    }
    if (result.targetProductId) {
      revalidatePath(`/buyer/product/${result.targetProductId}`);
    }
    revalidatePath("/", "layout");

    // If this seller was referred, check if their listing qualifies them
    try {
      await qualifyReferralIfApplicable(dbUser.id);
    } catch (err) {
      console.error("[createSellerListing:referral]", err);
    }

    return { success: true, listingId: result.listing.id };
  } catch (error) {
    console.error("Error creating listing:", error);
    return { error: "An unexpected error occurred while saving your listing." };
  }
}

export interface BatchListingItemInput {
  title: string;
  categoryId: string;
  description?: string;
  unit: ProductUnit;
  /** 0 or undefined means "Ask for price" — no numeric price published */
  unitPrice?: number;
  availableQty?: number;
  brand?: string;
  imageUrl?: string;
  existingProductId?: string;
  specs?: Record<string, string>;
  stockState?: StockState;
  vatMode?: "included" | "excluded" | "confirm";
}

export interface CreateBatchListingsInput {
  location: string;
  items: BatchListingItemInput[];
  /** Optional GPS pin for the seller's depot (captured via navigator.geolocation) */
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Creates multiple seller listings in a single atomic batch transaction.
 * Designed for rapid inventory entry (Item / Description / Unit / Rate / Available Quantity / Brand / Image).
 */
export async function createBatchSellerListingsAction(input: CreateBatchListingsInput) {
  try {
    const auth = await authorize(["SELLER", "ADMIN"]);
    if (!auth.ok) {
      return { error: auth.error };
    }
    const dbUser = auth.user;

    const clientId = await getClientIdentifier();
    const rl = await rateLimit(`listing:batch-create:${dbUser.id}`, { limit: 20, windowSeconds: 3600 });
    if (!rl.allowed) {
      return { error: rateLimitMessage(rl.retryAfterSeconds) };
    }

    if (!input.location || input.location.trim().length < 2) {
      return { error: "Please specify your yard or warehouse location." };
    }

    if (!input.items || input.items.length === 0) {
      return { error: "Please include at least one material item to list." };
    }

    if (input.items.length > 50) {
      return { error: "A maximum of 50 items can be listed in a single batch." };
    }

    // Fetch referenced categories to prevent category mismatches
    const catIds = Array.from(new Set(input.items.map((it) => it.categoryId)));
    const dbCats = await db.category.findMany({
      where: { id: { in: catIds } },
      select: { id: true, slug: true, name: true },
    });
    const catMap = new Map(dbCats.map((c) => [c.id, c]));

    // Validate each item
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const rowNum = i + 1;
      if (!item.title || item.title.trim().length < 2) {
        return { error: `Item #${rowNum}: Please provide a valid material name (at least 2 characters).` };
      }
      if (!item.categoryId) {
        return { error: `Item #${rowNum} ("${item.title}"): Please select a category.` };
      }
      if (!catMap.has(item.categoryId)) {
        return { error: `Item #${rowNum} ("${item.title}"): The selected category is invalid or inactive.` };
      }
      const matchedCat = catMap.get(item.categoryId);
      if (matchedCat) {
        const catSlug = matchedCat.slug.toLowerCase();
        const titleLower = item.title.toLowerCase();
        if (catSlug.includes("rebar") && (titleLower.includes("cement") || titleLower.includes("ሲሚንቶ"))) {
          return { error: `Item #${rowNum} ("${item.title}"): Cement products cannot be listed under the "${matchedCat.name}" category.` };
        }
        if (catSlug.includes("cement") && (titleLower.includes("rebar") || titleLower.includes("steel bar") || titleLower.includes("ብረት"))) {
          return { error: `Item #${rowNum} ("${item.title}"): Steel/rebar products cannot be listed under the "${matchedCat.name}" category.` };
        }
      }
      // unitPrice is optional — 0 or undefined means "Ask for price"
      if (item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice !== 0 && item.unitPrice < 0) {
        return { error: `Item #${rowNum} ("${item.title}"): Price cannot be negative.` };
      }
      if (item.availableQty !== undefined && item.availableQty !== null && item.availableQty < 0) {
        return { error: `Item #${rowNum} ("${item.title}"): Available quantity cannot be negative.` };
      }
    }

    const defaultValidUntil = new Date();
    defaultValidUntil.setMonth(defaultValidUntil.getMonth() + 6); // 6 months active validity

    const createdListingIds: string[] = [];

    // 0. Ensure SellerProfile and Wallet exist
    const existingProfile = await db.sellerProfile.findUnique({
      where: { userId: dbUser.id },
      select: { id: true },
    });
    if (!existingProfile) {
      await db.sellerProfile.create({
        data: {
          userId: dbUser.id,
          verificationStatus: "UNVERIFIED",
          sellerType: "RETAILER",
        },
      });
    }

    const existingWallet = await db.wallet.findUnique({
      where: { sellerId: dbUser.id },
      select: { id: true },
    });
    if (!existingWallet) {
      await db.wallet.create({
        data: {
          sellerId: dbUser.id,
          cashBalance: 0,
          creditBalance: 0,
        },
      });
    }

    // Process each item using atomic queries (safe for PgBouncer transaction pooling)
    for (const item of input.items) {
      let targetProductId = item.existingProductId;

      if (targetProductId) {
        const existingProd = await db.product.findUnique({
          where: { id: targetProductId },
          select: { title: true },
        });
        if (
          !existingProd ||
          existingProd.title.trim().toLowerCase() !== item.title.trim().toLowerCase()
        ) {
          targetProductId = undefined;
        }
      }

      if (!targetProductId) {
        const productSpecs: Record<string, string> = { ...(item.specs || {}) };
        if (item.brand?.trim()) {
          productSpecs.brand = item.brand.trim();
        }
        const product = await db.product.create({
          data: {
            categoryId: item.categoryId,
            title: item.title.trim(),
            unit: item.unit,
            imageUrl: item.imageUrl || null,
            specs: productSpecs,
          },
        });
        targetProductId = product.id;
      }

      const vatNote =
        item.vatMode === "included"
          ? "VAT: Included in price"
          : item.vatMode === "excluded"
          ? "VAT: Excluded (+15%)"
          : item.vatMode === "confirm"
          ? "VAT: Confirm with supplier"
          : null;
      const finalDescription = [item.description?.trim(), vatNote]
        .filter(Boolean)
        .join(" | ") || null;

      const roundedQty =
        item.availableQty !== undefined && item.availableQty !== null
          ? Math.max(0, Math.round(item.availableQty))
          : null;

      const listing = await db.listing.create({
        data: {
          sellerId: dbUser.id,
          productId: targetProductId,
          active: true,
          location: input.location.trim(),
          imageUrl: item.imageUrl || null,
          brand: item.brand?.trim() || null,
          description: finalDescription,
          availableQty: roundedQty,
          stockState: item.stockState || StockState.IN_STOCK,
        },
      });

      createdListingIds.push(listing.id);

      // Only create a price tier when the supplier entered a numeric price
      const hasPrice = item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice > 0;
      if (hasPrice) {
        await db.priceTier.create({
          data: {
            listingId: listing.id,
            minQty: 1,
            maxQty: roundedQty && roundedQty > 1 ? roundedQty : 999999,
            unitPrice: item.unitPrice!,
            validUntil: defaultValidUntil,
          },
        });
      }
    }

    // If the seller provided GPS coordinates for their depot, persist them on the SellerProfile
    if (input.latitude != null && input.longitude != null) {
      await db.sellerProfile.updateMany({
        where: { userId: dbUser.id },
        data: {
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });
    }

    revalidatePath("/seller/dashboard");
    revalidatePath("/seller/listings");
    revalidatePath("/buyer");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/category/all");
    revalidatePath("/", "layout");

    try {
      await qualifyReferralIfApplicable(dbUser.id);
    } catch (err) {
      console.error("[createBatchSellerListingsAction:referral]", err);
    }

    return {
      success: true,
      count: createdListingIds.length,
      listingIds: createdListingIds,
    };
  } catch (error) {
    console.error("Error creating batch listings:", error);
    const rawMsg = error instanceof Error ? error.message : "";
    let userMsg = "An unexpected error occurred while saving your batch listings.";
    if (rawMsg.includes("Unique constraint")) {
      userMsg = "A listing with these exact specifications already exists in your inventory.";
    } else if (rawMsg.includes("Foreign key") || rawMsg.includes("fkey")) {
      userMsg = "Unable to create listing because one of the selected categories or materials is unavailable.";
    } else if (rawMsg && !rawMsg.includes("PrismaClient") && !rawMsg.includes("prepared statement")) {
      userMsg = rawMsg;
    }
    return { error: userMsg };
  }
}

export async function toggleListingStatus(listingId: string, active: boolean) {
  try {
    const auth = await authorize(["SELLER", "ADMIN"]);
    if (!auth.ok) {
      return { error: auth.error };
    }
    const dbUser = auth.user;

    // Verify ownership
    const listing = await db.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return { error: "Listing not found." };
    }

    if (listing.sellerId !== dbUser.id && dbUser.role !== "ADMIN") {
      return { error: "You are not authorized to modify this listing." };
    }

    const updated = await db.listing.update({
      where: { id: listingId },
      data: { active },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    // If activated, trigger referral qualification if applicable
    if (active) {
      try {
        await qualifyReferralIfApplicable(listing.sellerId);
      } catch (err) {
        console.error("[toggleListingStatus:referral]", err);
      }
    }

    revalidatePath("/seller/dashboard");
    revalidatePath("/seller/listings");
    revalidatePath("/buyer");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/category/all");
    if (updated.product?.category?.slug) {
      revalidatePath(`/buyer/category/${updated.product.category.slug}`);
    }
    if (updated.productId) {
      revalidatePath(`/buyer/product/${updated.productId}`);
    }
    revalidatePath(`/buyer/catalog/${listingId}`);
    revalidatePath("/", "layout");


    return { success: true };
  } catch (error) {
    console.error("Error toggling listing status:", error);
    return { error: "Failed to update listing status." };
  }
}

/**
 * Confirms that a listing's materials and stock are still available.
 * Touches `updatedAt` to refresh freshness ranking, restores IN_STOCK state, and revalidates paths.
 */
export async function confirmListingAvailability(listingId: string) {
  try {
    const auth = await authorize(["SELLER", "ADMIN"]);
    if (!auth.ok) {
      return { error: auth.error };
    }
    const dbUser = auth.user;

    const listing = await db.listing.findUnique({
      where: { id: listingId },
      include: { product: { include: { category: true } } },
    });

    if (!listing) {
      return { error: "Listing not found." };
    }

    if (listing.sellerId !== dbUser.id && dbUser.role !== "ADMIN") {
      return { error: "You are not authorized to modify this listing." };
    }

    const updated = await db.listing.update({
      where: { id: listingId },
      data: {
        updatedAt: new Date(),
        stockState: StockState.IN_STOCK,
        active: true,
      },
    });

    revalidatePath("/seller/dashboard");
    revalidatePath("/seller/listings");
    revalidatePath(`/buyer/catalog/${listingId}`);
    if (listing.productId) {
      revalidatePath(`/buyer/product/${listing.productId}`);
    }

    return { success: true, updatedAt: updated.updatedAt.toISOString() };
  } catch (error) {
    console.error("Error confirming listing availability:", error);
    return { error: "Failed to confirm listing availability." };
  }
}

export interface UpdateListingInput {
  listingId: string;
  title?: string;
  location: string;
  imageUrl?: string;
  brand?: string;
  description?: string;
  availableQty?: number;
  priceTiers: CreatePriceTierInput[];
}

export async function updateSellerListing(input: UpdateListingInput) {
  try {
    const auth = await authorize(["SELLER", "ADMIN"]);
    if (!auth.ok) {
      return { error: auth.error };
    }
    const dbUser = auth.user;

    const listing = await db.listing.findUnique({
      where: { id: input.listingId },
      include: { product: { include: { category: true } } },
    });

    if (!listing) {
      return { error: "Listing not found." };
    }

    if (listing.sellerId !== dbUser.id && dbUser.role !== "ADMIN") {
      return { error: "You are not authorized to update this listing." };
    }

    if (!input.location || input.location.trim().length < 2) {
      return { error: "Please enter your warehouse/yard location." };
    }

    if (!input.priceTiers || input.priceTiers.length === 0) {
      return { error: "Please provide at least one volume pricing tier." };
    }

    // Validate tiers
    for (const tier of input.priceTiers) {
      if (tier.minQty <= 0 || tier.maxQty <= 0 || tier.unitPrice <= 0) {
        return { error: "Tier quantities and unit prices must be greater than zero." };
      }
      if (tier.minQty > tier.maxQty) {
        return { error: "Minimum quantity cannot exceed maximum quantity in any tier." };
      }
    }

    const sortedTiers = [...input.priceTiers].sort((a, b) => a.minQty - b.minQty);
    for (let i = 1; i < sortedTiers.length; i++) {
      if (sortedTiers[i].minQty <= sortedTiers[i - 1].maxQty) {
        return {
          error: `Price tier intervals overlap: [${sortedTiers[i - 1].minQty}–${sortedTiers[i - 1].maxQty}] and [${sortedTiers[i].minQty}–${sortedTiers[i].maxQty}]. Each tier must have distinct quantity ranges.`,
        };
      }
    }

    // Atomic update with catalog isolation
    await db.$transaction(async (tx) => {
      let targetProductId = listing.productId;

      // 1. Catalog Isolation: Never mutate shared Product record across sellers
      if (input.title && input.title.trim().length >= 3 && input.title.trim() !== listing.product.title) {
        // Count other active or existing listings referencing this product
        const otherListingsCount = await tx.listing.count({
          where: {
            productId: listing.productId,
            id: { not: input.listingId },
          },
        });

        if (otherListingsCount > 0) {
          // Shared product: Fork into a seller-specific Product record
          const forkedProduct = await tx.product.create({
            data: {
              categoryId: listing.product.categoryId,
              title: input.title.trim(),
              unit: listing.product.unit,
              imageUrl: input.imageUrl || listing.product.imageUrl,
              specs: listing.product.specs || {},
            },
          });
          targetProductId = forkedProduct.id;
        } else {
          // Isolated product: Safe to update in place
          await tx.product.update({
            where: { id: listing.productId },
            data: {
              title: input.title.trim(),
              imageUrl: input.imageUrl || listing.product.imageUrl,
            },
          });
        }
      }

      // 2. Update Listing
      await tx.listing.update({
        where: { id: input.listingId },
        data: {
          location: input.location.trim(),
          imageUrl: input.imageUrl !== undefined ? input.imageUrl : listing.imageUrl,
          brand: input.brand !== undefined ? (input.brand?.trim() || null) : listing.brand,
          description: input.description !== undefined ? (input.description?.trim() || null) : listing.description,
          availableQty: input.availableQty !== undefined ? (input.availableQty ?? null) : listing.availableQty,
          ...(targetProductId !== listing.productId ? { productId: targetProductId } : {}),
        },
      });

      // 3. Replace Price Tiers
      await tx.priceTier.deleteMany({
        where: { listingId: input.listingId },
      });

      for (const tier of sortedTiers) {
        const validUntil = new Date();
        const days = tier.validDays || 180;
        validUntil.setDate(validUntil.getDate() + days);

        await tx.priceTier.create({
          data: {
            listingId: input.listingId,
            minQty: tier.minQty,
            maxQty: tier.maxQty,
            unitPrice: tier.unitPrice,
            validUntil,
          },
        });
      }
    });

    revalidatePath("/seller/dashboard");
    revalidatePath("/seller/listings");
    revalidatePath("/buyer");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/category/all");
    if (listing.product?.category?.slug) {
      revalidatePath(`/buyer/category/${listing.product.category.slug}`);
    }
    if (listing.productId) {
      revalidatePath(`/buyer/product/${listing.productId}`);
    }
    revalidatePath(`/buyer/catalog/${input.listingId}`);
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error updating listing:", error);
    return { error: "An unexpected error occurred while updating your listing." };
  }
}

export async function deleteSellerListing(listingId: string) {
  try {
    const auth = await authorize(["SELLER", "ADMIN"]);
    if (!auth.ok) {
      return { error: auth.error };
    }
    const dbUser = auth.user;

    const listing = await db.listing.findUnique({
      where: { id: listingId },
      include: { product: { include: { category: true } } },
    });

    if (!listing) {
      return { error: "Listing not found." };
    }

    if (listing.sellerId !== dbUser.id && dbUser.role !== "ADMIN") {
      return { error: "You are not authorized to delete this listing." };
    }

    // Soft delete: sets isDeleted = true and active = false to prevent FK constraint crashes (P2003)
    await db.listing.update({
      where: { id: listingId },
      data: {
        isDeleted: true,
        active: false,
      },
    });

    revalidatePath("/seller/dashboard");
    revalidatePath("/seller/listings");
    revalidatePath("/buyer");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/category/all");
    if (listing.product?.category?.slug) {
      revalidatePath(`/buyer/category/${listing.product.category.slug}`);
    }
    if (listing.productId) {
      revalidatePath(`/buyer/product/${listing.productId}`);
    }
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error deleting listing:", error);
    return { error: "Failed to delete material listing." };
  }
}

/**
 * Admin / System Maintenance:
 * Automatically identifies and archives listings inactive for > 6 months
 * or whose price tiers have all expired > 6 months ago. Sets active = false.
 */
export async function archiveStaleListingsAction() {
  try {
    const auth = await authorize(["ADMIN"]);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Find active listings that have been stale > 6 months
    const staleListings = await db.listing.findMany({
      where: {
        active: true,
        OR: [
          // All price tiers expired before 6 months ago
          {
            priceTiers: {
              none: {
                validUntil: { gt: sixMonthsAgo },
              },
            },
          },
          // Updated more than 6 months ago with no currently valid price tier
          {
            updatedAt: { lt: sixMonthsAgo },
            priceTiers: {
              none: {
                validUntil: { gt: new Date() },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (staleListings.length === 0) {
      return {
        success: true,
        archivedCount: 0,
        message: "No stale listings older than 6 months found.",
      };
    }

    const ids = staleListings.map((l) => l.id);

    const updateRes = await db.listing.updateMany({
      where: { id: { in: ids } },
      data: { active: false },
    });

    revalidatePath("/seller/dashboard");
    revalidatePath("/seller/listings");
    revalidatePath("/buyer");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/category/all");
    revalidatePath("/", "layout");

    return {
      success: true,
      archivedCount: updateRes.count,
      message: `Archived ${updateRes.count} stale listings inactive for more than 6 months.`,
    };
  } catch (error) {
    console.error("Error archiving stale listings:", error);
    return {
      success: false,
      error: "An unexpected error occurred while archiving stale listings.",
    };
  }
}
