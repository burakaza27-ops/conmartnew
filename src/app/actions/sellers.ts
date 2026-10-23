"use server";

// =============================================================================
// ECON — Seller Compliance & Verification Server Actions
// =============================================================================
// Enables platform operations staff to:
// 1. Audit seller business licenses, TIN certificates, and validity periods
// 2. Grant verified status, yard inspection badges, or suspend violators
// 3. Monitor seller deal completion and failure metrics
// =============================================================================

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { resolveSubscription } from "@/lib/marketplace/subscription";
import { SellerVerificationStatus, SellerType } from "@prisma/client";

export async function getAdminSellersAction() {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const sellers = await db.user.findMany({
      where: { role: "SELLER" },
      include: {
        sellerProfile: true,
        wallet: {
          select: {
            cashBalance: true,
            creditBalance: true,
          },
        },
        _count: {
          select: {
            sellerListings: true,
            sellerEnquiries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: sellers.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        companyName: s.companyName,
        createdAt: s.createdAt.toISOString(),
        profileId: s.sellerProfile?.id || null,
        sellerType: s.sellerProfile?.sellerType || "RETAILER",
        verificationStatus: s.sellerProfile?.verificationStatus || "UNVERIFIED",
        licenseNumber: s.sellerProfile?.licenseNumber || null,
        tinNumber: s.sellerProfile?.tinNumber || null,
        vatNumber: s.sellerProfile?.vatNumber || null,
        vatRegistered: s.sellerProfile?.vatRegistered ?? false,
        licenseExpiry: s.sellerProfile?.licenseExpiry ? s.sellerProfile.licenseExpiry.toISOString() : null,
        tinExpiry: s.sellerProfile?.tinExpiry ? s.sellerProfile.tinExpiry.toISOString() : null,
        completedDealsCount: s.sellerProfile?.completedDealsCount || 0,
        failedDealsCount: s.sellerProfile?.failedDealsCount || 0,
        responseTimeAvgMinutes: s.sellerProfile?.responseTimeAvgMinutes || 60,
        listingCount: s._count?.sellerListings || 0,
        enquiryCount: s._count?.sellerEnquiries || 0,
        cashBalance: Number(s.wallet?.cashBalance ?? 0),
        creditBalance: Number(s.wallet?.creditBalance ?? 0),
        subscriptionStatus: resolveSubscription(s.sellerProfile),
        subscriptionTier: s.sellerProfile?.subscriptionTier ?? "BASIC",
        reverificationNeeded: s.sellerProfile?.reverificationNeeded ?? false,
        lastVerifiedAt: s.sellerProfile?.lastVerifiedAt ? s.sellerProfile.lastVerifiedAt.toISOString() : null,
        storedSubscriptionStatus: s.sellerProfile?.subscriptionStatus ?? "FREE",
        subscriptionExpiresAt: s.sellerProfile?.subscriptionExpiresAt
          ? s.sellerProfile.subscriptionExpiresAt.toISOString()
          : null,
      })),
    };
  } catch (error) {
    console.error("[getAdminSellersAction] error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load supplier list.",
      data: [],
    };
  }
}

export async function updateSellerVerificationAction({
  sellerProfileId,
  status,
  sellerType,
}: {
  sellerProfileId: string;
  status: SellerVerificationStatus;
  sellerType?: SellerType;
}) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    // 1. Locate seller profile by ID or by userId
    let profile = await db.sellerProfile.findUnique({
      where: { id: sellerProfileId },
    });

    if (!profile) {
      profile = await db.sellerProfile.findUnique({
        where: { userId: sellerProfileId },
      });
    }

    if (!profile) {
      // Find user by id or authId
      let user = await db.user.findUnique({
        where: { id: sellerProfileId },
        select: { id: true, role: true },
      });

      if (!user) {
        user = await db.user.findUnique({
          where: { authId: sellerProfileId },
          select: { id: true, role: true },
        });
      }

      if (user) {
        // Ensure user has SELLER role if admin is verifying them as a supplier
        if (user.role !== "SELLER" && user.role !== "ADMIN") {
          await db.user.update({
            where: { id: user.id },
            data: { role: "SELLER" },
          });
        }

        profile = await db.sellerProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            verificationStatus: status,
            sellerType: sellerType || "RETAILER",
            ...(status === "VERIFIED" ? { lastVerifiedAt: new Date(), reverificationNeeded: false } : {}),
          },
          update: {
            verificationStatus: status,
            ...(sellerType ? { sellerType } : {}),
            ...(status === "VERIFIED" ? { lastVerifiedAt: new Date(), reverificationNeeded: false } : {}),
          },
        });
      } else {
        return { success: false, error: "Supplier account not found in database." };
      }
    } else {
      await db.sellerProfile.update({
        where: { id: profile.id },
        data: {
          verificationStatus: status,
          ...(sellerType ? { sellerType } : {}),
          ...(status === "VERIFIED" ? { lastVerifiedAt: new Date(), reverificationNeeded: false } : {}),
        },
      });
    }

    // Safe revalidation: only revalidate the routes we actually changed.
    // Do NOT revalidate heavy buyer routes here — they use static generation
    // and revalidating them during an admin action causes Vercel Function timeouts.
    try {
      revalidatePath("/admin/command-center");
      revalidatePath("/seller/dashboard");
    } catch (revalErr) {
      console.warn("[updateSellerVerificationAction] revalidatePath warning:", revalErr);
    }

    return { success: true };
  } catch (error) {
    console.error("[updateSellerVerificationAction] error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update supplier verification status.",
    };
  }
}

export async function toggleSellerReverificationAction(sellerProfileId: string, needed: boolean) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    let profile = await db.sellerProfile.findUnique({
      where: { id: sellerProfileId },
    });

    if (!profile) {
      profile = await db.sellerProfile.findUnique({
        where: { userId: sellerProfileId },
      });
    }

    if (!profile) {
      let user = await db.user.findUnique({
        where: { id: sellerProfileId },
        select: { id: true },
      });
      if (!user) {
        user = await db.user.findUnique({
          where: { authId: sellerProfileId },
          select: { id: true },
        });
      }
      if (user) {
        profile = await db.sellerProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            reverificationNeeded: needed,
            ...(!needed ? { lastVerifiedAt: new Date() } : {}),
          },
          update: {
            reverificationNeeded: needed,
            ...(!needed ? { lastVerifiedAt: new Date() } : {}),
          },
        });
        return { success: true };
      }
      return { success: false, error: "Supplier profile not found." };
    }

    await db.sellerProfile.update({
      where: { id: profile.id },
      data: {
        reverificationNeeded: needed,
        ...(!needed ? { lastVerifiedAt: new Date() } : {}),
      },
    });

    try {
      revalidatePath("/admin/command-center");
    } catch (revalErr) {
      console.warn("[toggleSellerReverificationAction] revalidatePath warning:", revalErr);
    }

    return { success: true };
  } catch (error) {
    console.error("[toggleSellerReverificationAction] error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle re-verification status.",
    };
  }
}
