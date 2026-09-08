"use server";

// =============================================================================
// ConMart — Listing Server Actions
// =============================================================================
// Handles:
// 1. Creation of new products and seller listings with volume price tiers & images
// 2. Status toggling (active/inactive)
// 3. Deletion of listings
// =============================================================================

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProductUnit } from "@prisma/client";

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

      // 2. Create the Listing
      const listing = await tx.listing.create({
        data: {
          sellerId: dbUser.id,
          productId: targetProductId,
          active: true,
          location: input.location.trim(),
          imageUrl: input.imageUrl || null,
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
            minQty: tier.minQty,
            maxQty: tier.maxQty,
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

    return { success: true, listingId: result.listing.id };
  } catch (error) {
    console.error("Error creating listing:", error);
    return { error: "An unexpected error occurred while saving your listing." };
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

export interface UpdateListingInput {
  listingId: string;
  title?: string;
  location: string;
  imageUrl?: string;
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

    // Atomic update
    await db.$transaction(async (tx) => {
      // 1. Update Product title if provided
      if (input.title && input.title.trim().length >= 3) {
        await tx.product.update({
          where: { id: listing.productId },
          data: {
            title: input.title.trim(),
            imageUrl: input.imageUrl || listing.product.imageUrl,
          },
        });
      }

      // 2. Update Listing
      await tx.listing.update({
        where: { id: input.listingId },
        data: {
          location: input.location.trim(),
          imageUrl: input.imageUrl !== undefined ? input.imageUrl : listing.imageUrl,
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

    await db.listing.delete({
      where: { id: listingId },
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
