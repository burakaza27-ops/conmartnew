// =============================================================================
// ConMart — Admin Category & Fee Management Server Actions
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ensureDefaultCategories } from "@/lib/data/default-categories";

export async function getAdminCategoriesAction() {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  await ensureDefaultCategories();

  const categories = await db.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return {
    success: true,
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      unlockFee: Number(c.unlockFee),
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
    })),
  };
}

export async function updateCategoryFeeAction({
  categoryId,
  unlockFee,
}: {
  categoryId: string;
  unlockFee: number;
}) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  if (!Number.isFinite(unlockFee) || unlockFee < 0 || unlockFee > 100_000) {
    return {
      success: false,
      error: "Unlock fee must be between ETB 0.00 and ETB 100,000.00.",
    };
  }

  await db.category.update({
    where: { id: categoryId },
    data: { unlockFee: new Prisma.Decimal(unlockFee) },
  });

  revalidatePath("/admin/command-center");
  revalidatePath("/buyer");
  revalidatePath("/seller/enquiries");

  return { success: true };
}

export async function toggleCategoryActiveAction({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  await db.category.update({
    where: { id: categoryId },
    data: { isActive },
  });

  revalidatePath("/admin/command-center");
  revalidatePath("/buyer");

  return { success: true };
}
