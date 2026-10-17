// =============================================================================
// Econ — Site Wastage (Reusable) Data Models & Fetchers
// =============================================================================
// Handles community / site foreman guest submissions of leftover or scrap
// materials (formwork timber, rebar offcuts, salvageable blocks, scrap metal).
// Unregistered users post with a photo, admin moderates, and approved items
// display on the buyer's Site Wastages catalog.
// =============================================================================

import { db } from "@/lib/db";

export type WastageStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SiteWastageItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  images: string[];
  quantity: number;
  unit: string;
  askingPrice: number;
  isNegotiable: boolean;
  location: string;
  contactName: string;
  contactPhone: string;
  status: WastageStatus;
  moderatedBy: string | null;
  moderationNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RawWastageRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  quantity: string | number;
  unit: string;
  asking_price: string | number;
  is_negotiable: boolean;
  location: string;
  contact_name: string;
  contact_phone: string;
  status: string;
  moderated_by: string | null;
  moderation_notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function parseImages(imageUrlStr: string): { primary: string; all: string[] } {
  if (!imageUrlStr) return { primary: "", all: [] };
  if (imageUrlStr.startsWith("[")) {
    try {
      const parsed = JSON.parse(imageUrlStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { primary: String(parsed[0]), all: parsed.map(String) };
      }
    } catch {
      // fallback
    }
  }
  const split = imageUrlStr.split(",").map((s) => s.trim()).filter(Boolean);
  return { primary: split[0] || imageUrlStr, all: split.length > 0 ? split : [imageUrlStr] };
}

function mapRow(row: RawWastageRow): SiteWastageItem {
  const { primary, all } = parseImages(row.image_url);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: primary,
    images: all,
    quantity: Number(row.quantity),
    unit: row.unit,
    askingPrice: Number(row.asking_price),
    isNegotiable: Boolean(row.is_negotiable),
    location: row.location,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    status: row.status as WastageStatus,
    moderatedBy: row.moderated_by,
    moderationNotes: row.moderation_notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

let hasEnsuredTable = false;

/**
 * Self-healing bootstrap: Ensures the site_wastages table and its performance indexes
 * exist in PostgreSQL even before or without manual migrations.
 */
export async function ensureSiteWastagesTable(): Promise<void> {
  if (hasEnsuredTable) return;
  try {
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS site_wastages (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        quantity NUMERIC(12, 2) NOT NULL,
        unit VARCHAR(32) NOT NULL,
        asking_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        is_negotiable BOOLEAN NOT NULL DEFAULT true,
        location VARCHAR(255) NOT NULL,
        contact_name VARCHAR(100) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        moderated_by VARCHAR(64),
        moderation_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await db.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_site_wastages_status ON site_wastages(status, created_at DESC);
    `;
    hasEnsuredTable = true;
  } catch (err) {
    console.error("Failed to ensure site_wastages table exists:", err);
  }
}

/**
 * Fetches all approved site wastages for the public buyer catalog.
 */
export async function fetchApprovedSiteWastages(): Promise<SiteWastageItem[]> {
  try {
    await ensureSiteWastagesTable();
    const rows = await db.$queryRaw<RawWastageRow[]>`
      SELECT * FROM site_wastages
      WHERE status = 'APPROVED'
      ORDER BY created_at DESC;
    `;
    return rows.map(mapRow);
  } catch (error) {
    console.error("fetchApprovedSiteWastages error:", error);
    return [];
  }
}

/**
 * Fetches pending site wastages awaiting admin moderation.
 */
export async function fetchPendingSiteWastages(): Promise<SiteWastageItem[]> {
  try {
    await ensureSiteWastagesTable();
    const rows = await db.$queryRaw<RawWastageRow[]>`
      SELECT * FROM site_wastages
      WHERE status = 'PENDING'
      ORDER BY created_at DESC;
    `;
    return rows.map(mapRow);
  } catch (error) {
    console.error("fetchPendingSiteWastages error:", error);
    return [];
  }
}

/**
 * Fetches all site wastages (admin view).
 */
export async function fetchAllSiteWastages(): Promise<SiteWastageItem[]> {
  try {
    await ensureSiteWastagesTable();
    const rows = await db.$queryRaw<RawWastageRow[]>`
      SELECT * FROM site_wastages
      ORDER BY created_at DESC;
    `;
    return rows.map(mapRow);
  } catch (error) {
    console.error("fetchAllSiteWastages error:", error);
    return [];
  }
}
