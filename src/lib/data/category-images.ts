// =============================================================================
// ConMart — Curated Category Image Map
// =============================================================================
// Every category slug maps to a focused, highly relevant Unsplash photo.
// These are used as fallbacks when a product or listing has no uploaded image.
// All photos are construction-specific — no generic/random shots.
// =============================================================================

/** Specific, relevant image per category slug */
export const CATEGORY_IMAGES: Record<string, string> = {
  // Cement bags on a pallet at a warehouse — instantly recognizable
  cement:
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",

  // Bundle of deformed rebar / reinforcement steel bars
  steel:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",

  // River sand & crushed stone aggregate pile at a depot
  aggregates:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",

  // Stack of concrete hollow blocks / HCB at a yard
  blocks:
    "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",

  // Corrugated galvanized iron (EGA) sheets stacked at a depot
  roofing:
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",

  // PPR / PVC pipes in a plumbing supply store
  plumbing:
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",

  // Timber / formwork lumber planks stacked at a yard
  timber:
    "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80",

  // Electrical copper cables & wiring bundles
  electrical:
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",

  // Porcelain floor tiles & paint tins — finishes & decorative
  finishing:
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  finishes:
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",

  // Construction hardware tools on a workbench
  hardware:
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",

  // HVAC outdoor condensing unit / AC installation
  "hvac-mechanical":
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",

  // Paved road / cobblestone infrastructure & landscaping
  "infrastructure-external":
    "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",

  // Safety gear (hard hat, gloves, reflective vest)
  "safety-gear":
    "https://images.unsplash.com/photo-1530099486328-e021101a494a?auto=format&fit=crop&w=800&q=80",
};

function normalizeCategorySlug(input?: string | null): string {
  if (!input) return "";
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (CATEGORY_IMAGES[cleaned]) return cleaned;
  if (cleaned.includes("cement")) return "cement";
  if (cleaned.includes("steel") || cleaned.includes("rebar")) return "steel";
  if (cleaned.includes("aggregate") || cleaned.includes("sand") || cleaned.includes("stone")) return "aggregates";
  if (cleaned.includes("block") || cleaned.includes("hcb")) return "blocks";
  if (cleaned.includes("roof") || cleaned.includes("corrugat") || cleaned.includes("ega")) return "roofing";
  if (cleaned.includes("plumb") || cleaned.includes("pipe")) return "plumbing";
  if (cleaned.includes("timber") || cleaned.includes("wood") || cleaned.includes("formwork")) return "timber";
  if (cleaned.includes("electr") || cleaned.includes("cable") || cleaned.includes("wire")) return "electrical";
  if (cleaned.includes("finish") || cleaned.includes("tile") || cleaned.includes("paint")) return "finishing";
  if (cleaned.includes("hardware") || cleaned.includes("tool") || cleaned.includes("fastener")) return "hardware";
  if (cleaned.includes("hvac") || cleaned.includes("vent") || cleaned.includes("air-con")) return "hvac-mechanical";
  if (cleaned.includes("infra") || cleaned.includes("road") || cleaned.includes("paving")) return "infrastructure-external";
  if (cleaned.includes("safe") || cleaned.includes("ppe")) return "safety-gear";

  return cleaned;
}

/**
 * Returns a relevant image URL for the given category slug or category name.
 * Falls back to a generic construction site photo if the slug is unknown.
 */
export function getCategoryImage(slugOrName: string, size: 600 | 800 | 1200 = 800): string {
  const normalized = normalizeCategorySlug(slugOrName);
  const base = CATEGORY_IMAGES[normalized] ?? CONSTRUCTION_FALLBACK;
  return base.replace("w=800", `w=${size}`);
}

/**
 * Generic fallback for construction materials that have no specific image.
 * Shows construction workers at a site — clearly industry-relevant.
 */
export const CONSTRUCTION_FALLBACK =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80";

/**
 * Returns a relevant fallback for a specific product based on its category slug or name.
 * Used when a product/listing has no uploaded image.
 */
export function getProductFallback(categorySlugOrName?: string | null): string {
  const normalized = normalizeCategorySlug(categorySlugOrName);
  if (normalized && CATEGORY_IMAGES[normalized]) {
    return CATEGORY_IMAGES[normalized];
  }
  return CONSTRUCTION_FALLBACK;
}
