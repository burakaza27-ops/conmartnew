"use server";

// =============================================================================
// Econ — Site Wastage (Reusable) Server Actions
// =============================================================================
// 1. Unregistered guest photo submission (no login required)
// 2. Admin review and moderation queue (Approve / Reject)
// 3. Public approved listings query
// =============================================================================

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ethiopianPhoneSchema } from "@/lib/validations";
import { requireRole } from "@/lib/auth/session";
import {
  fetchPendingSiteWastages,
  fetchAllSiteWastages,
  fetchApprovedSiteWastages,
  ensureSiteWastagesTable,
  type SiteWastageItem,
} from "@/lib/data/wastage";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const submitGuestWastageSchema = z.object({
  imageUrl: z.string().min(1, "Please provide or snap a photo of the material"),
  imageUrls: z.array(z.string()).optional(),
  title: z
    .string()
    .trim()
    .min(3, "Material title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1, "Unit of measure is required"),
  askingPrice: z.coerce.number().min(0, "Price cannot be negative").default(0),
  isNegotiable: z.boolean().default(true),
  location: z
    .string()
    .trim()
    .min(2, "Please select the sub-city or project location (e.g. Jemo, Tulu Dimtu, Urael)"),
  contactName: z
    .string()
    .trim()
    .min(2, "Contact or foreman name is required")
    .max(100),
  contactPhone: ethiopianPhoneSchema,
  description: z.string().trim().max(1000).optional(),
});

export type SubmitGuestWastageInput = z.infer<typeof submitGuestWastageSchema>;

/**
 * Public Server Action: Anyone can post a site wastage item for sale
 * without needing an account or login. The submission is marked PENDING
 * and requires admin review before appearing in the buyer catalog.
 */
export async function submitGuestWastageAction(
  rawInput: SubmitGuestWastageInput
): Promise<ActionResponse<{ id: string; referenceCode: string }>> {
  try {
    await ensureSiteWastagesTable();
    const validated = submitGuestWastageSchema.parse(rawInput);
    const id = `wastage_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const allImages = validated.imageUrls && validated.imageUrls.length > 0
      ? validated.imageUrls
      : [validated.imageUrl];
    const storedImageUrl = allImages.length > 1 ? JSON.stringify(allImages) : validated.imageUrl;

    await db.$executeRaw`
      INSERT INTO site_wastages (
        id,
        title,
        description,
        image_url,
        quantity,
        unit,
        asking_price,
        is_negotiable,
        location,
        contact_name,
        contact_phone,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${validated.title},
        ${validated.description || null},
        ${storedImageUrl},
        ${validated.quantity},
        ${validated.unit},
        ${validated.askingPrice},
        ${validated.isNegotiable},
        ${validated.location},
        ${validated.contactName},
        ${validated.contactPhone},
        'PENDING',
        NOW(),
        NOW()
      );
    `;

    revalidatePath("/admin/command-center");
    revalidatePath("/buyer/category/reusable-site-wastage");

    return {
      success: true,
      data: {
        id,
        referenceCode: `WST-${id.slice(-5).toUpperCase()}`,
      },
    };
  } catch (error) {
    console.error("submitGuestWastageAction error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation failed." };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit site wastage post.",
    };
  }
}

/**
 * Admin Server Action: Retrieve all pending site wastages.
 */
export async function getPendingWastagesAction(): Promise<ActionResponse<SiteWastageItem[]>> {
  try {
    await requireRole(["ADMIN"], "/admin/command-center");
    const items = await fetchPendingSiteWastages();
    return { success: true, data: items };
  } catch (error) {
    console.error("getPendingWastagesAction error:", error);
    return { success: false, error: "Failed to fetch pending site wastages." };
  }
}

/**
 * Admin Server Action: Retrieve all site wastages (all statuses).
 */
export async function getAllWastagesAction(): Promise<ActionResponse<SiteWastageItem[]>> {
  try {
    await requireRole(["ADMIN"], "/admin/command-center");
    const items = await fetchAllSiteWastages();
    return { success: true, data: items };
  } catch (error) {
    console.error("getAllWastagesAction error:", error);
    return { success: false, error: "Failed to fetch site wastages." };
  }
}

/**
 * Admin Server Action: Approve or Reject a site wastage post.
 * Once approved, it becomes immediately visible on the buyer's page.
 */
export async function moderateWastageAction(input: {
  wastageId: string;
  status: "APPROVED" | "REJECTED";
  moderationNotes?: string;
}): Promise<ActionResponse<SiteWastageItem>> {
  try {
    const admin = await requireRole(["ADMIN"], "/admin/command-center");
    await ensureSiteWastagesTable();

    await db.$executeRaw`
      UPDATE site_wastages
      SET 
        status = ${input.status},
        moderated_by = ${admin.id},
        moderation_notes = ${input.moderationNotes || null},
        updated_at = NOW()
      WHERE id = ${input.wastageId};
    `;

    revalidatePath("/admin/command-center");
    revalidatePath("/buyer/category/reusable-site-wastage");
    revalidatePath("/buyer/category/all");

    return { success: true };
  } catch (error) {
    console.error("moderateWastageAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to moderate site wastage.",
    };
  }
}
