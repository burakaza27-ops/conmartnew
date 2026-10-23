// =============================================================================
// ECON — Admin Seller Verification API Route
// =============================================================================
// Replaces the server action for seller verification to avoid:
// 1. Vercel serverless timeout issues with server actions cold-starting
// 2. CSP/network ERR_NAME_NOT_RESOLVED from server action POST paths
// 3. Connection pool exhaustion from concurrent verification requests
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { SellerVerificationStatus, SellerType } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // 1. Authenticate & authorize
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  let body: {
    sellerProfileId?: string;
    status?: SellerVerificationStatus;
    sellerType?: SellerType;
    action?: "verify" | "reverify-toggle";
    reverificationNeeded?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { sellerProfileId, status, sellerType, action, reverificationNeeded } = body;

  if (!sellerProfileId) {
    return NextResponse.json({ success: false, error: "sellerProfileId is required." }, { status: 400 });
  }

  try {
    if (action === "reverify-toggle") {
      // Toggle reverification flag
      const needed = Boolean(reverificationNeeded);
      let profile = await db.sellerProfile.findUnique({ where: { id: sellerProfileId } });
      if (!profile) {
        profile = await db.sellerProfile.findUnique({ where: { userId: sellerProfileId } });
      }
      if (!profile) {
        const user = await db.user.findFirst({
          where: { OR: [{ id: sellerProfileId }, { authId: sellerProfileId }] },
          select: { id: true },
        });
        if (user) {
          await db.sellerProfile.upsert({
            where: { userId: user.id },
            create: { userId: user.id, reverificationNeeded: needed, ...(!needed ? { lastVerifiedAt: new Date() } : {}) },
            update: { reverificationNeeded: needed, ...(!needed ? { lastVerifiedAt: new Date() } : {}) },
          });
        } else {
          return NextResponse.json({ success: false, error: "Supplier profile not found." }, { status: 404 });
        }
      } else {
        await db.sellerProfile.update({
          where: { id: profile.id },
          data: { reverificationNeeded: needed, ...(!needed ? { lastVerifiedAt: new Date() } : {}) },
        });
      }
      try { revalidatePath("/admin/command-center"); } catch { /* ok */ }
      return NextResponse.json({ success: true });
    }

    // Default: update verification status
    if (!status) {
      return NextResponse.json({ success: false, error: "status is required." }, { status: 400 });
    }

    // Locate profile by profile ID → userId → user.id / user.authId
    let profile = await db.sellerProfile.findUnique({ where: { id: sellerProfileId } });
    if (!profile) {
      profile = await db.sellerProfile.findUnique({ where: { userId: sellerProfileId } });
    }

    if (!profile) {
      const user = await db.user.findFirst({
        where: { OR: [{ id: sellerProfileId }, { authId: sellerProfileId }] },
        select: { id: true, role: true },
      });
      if (!user) {
        return NextResponse.json({ success: false, error: "Supplier account not found in database." }, { status: 404 });
      }
      // Ensure SELLER role
      if (user.role !== "SELLER" && user.role !== "ADMIN") {
        await db.user.update({ where: { id: user.id }, data: { role: "SELLER" } });
      }
      await db.sellerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          verificationStatus: status,
          sellerType: sellerType ?? "RETAILER",
          ...(status === "VERIFIED" ? { lastVerifiedAt: new Date(), reverificationNeeded: false } : {}),
        },
        update: {
          verificationStatus: status,
          ...(sellerType ? { sellerType } : {}),
          ...(status === "VERIFIED" ? { lastVerifiedAt: new Date(), reverificationNeeded: false } : {}),
        },
      });
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

    try {
      revalidatePath("/admin/command-center");
      revalidatePath("/seller/dashboard");
    } catch { /* ok */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/sellers/verify] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update supplier verification status." },
      { status: 500 }
    );
  }
}
