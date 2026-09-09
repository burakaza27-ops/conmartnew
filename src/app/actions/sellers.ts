"use server";

// =============================================================================
// ConMart — Seller Compliance & Verification Server Actions
// =============================================================================
// Enables platform operations staff to:
// 1. Audit seller business licenses, TIN certificates, and validity periods
// 2. Grant verified status, yard inspection badges, or suspend violators
// 3. Monitor seller deal completion and failure metrics
// =============================================================================

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { SellerVerificationStatus, SellerType } from "@prisma/client";

export async function getAdminSellersAction() {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

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
      listingCount: s._count.sellerListings,
      enquiryCount: s._count.sellerEnquiries,
      cashBalance: Number(s.wallet?.cashBalance ?? 0),
      creditBalance: Number(s.wallet?.creditBalance ?? 0),
      subscriptionStatus: s.sellerProfile?.subscriptionStatus ?? "FREE",
      subscriptionExpiresAt: s.sellerProfile?.subscriptionExpiresAt
        ? s.sellerProfile.subscriptionExpiresAt.toISOString()
        : null,
    })),
  };
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

  await db.sellerProfile.update({
    where: { id: sellerProfileId },
    data: {
      verificationStatus: status,
      ...(sellerType ? { sellerType } : {}),
    },
  });

  revalidatePath("/admin/command-center");
  revalidatePath("/seller/dashboard");
  revalidatePath("/buyer", "layout");
  revalidatePath("/buyer/catalog");
  revalidatePath("/buyer/category/all");

  return { success: true };
}
