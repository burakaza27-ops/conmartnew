// =============================================================================
// Econ — Material Catalog Configuration
// =============================================================================
// Category-specific unit mappings, specification fields, and material templates.
// Used by the seller listing forms to provide guided, category-aware entry.
// =============================================================================

import type { ProductUnit } from "@prisma/client";

// ---------------------------------------------------------------------------
// 1. BUYER-FRIENDLY UNIT LABELS
// ---------------------------------------------------------------------------

/** Human-readable unit labels for display (English + Amharic) */
export const UNIT_LABELS: Record<string, { en: string; am: string }> = {
  BAG:       { en: "Bag",              am: "ከረጢት" },
  QUINTAL:   { en: "Quintal — 100 kg", am: "ኩንታል — 100 ኪ.ግ" },
  TON:       { en: "Tonne — 1,000 kg", am: "ቶን — 1,000 ኪ.ግ" },
  PIECE:     { en: "Piece",            am: "ቁጥር" },
  M3:        { en: "Cubic metre (m³)", am: "ኩቢክ ሜትር (m³)" },
  KG:        { en: "Kilogram (kg)",    am: "ኪሎ ግራም (ኪ.ግ)" },
  METRE:     { en: "Metre (m)",        am: "ሜትር (ሜ)" },
  SQM:       { en: "Square metre (m²)",am: "ስኩዌር ሜትር (m²)" },
  LITRE:     { en: "Litre (L)",        am: "ሊትር (ሊ)" },
  SHEET:     { en: "Sheet",            am: "ሉህ / ቆርቆሮ" },
  ROLL:      { en: "Roll",             am: "ጥቅል" },
  BOX:       { en: "Box",              am: "ሳጥን" },
  BUNDLE:    { en: "Bundle",           am: "ፈረም / ጥቅል" },
  PAIR:      { en: "Pair",             am: "ጥንድ" },
  BUCKET:    { en: "Bucket / Pail",    am: "ባልዲ" },
  DRUM:      { en: "Drum",             am: "ደረም" },
  TRUCKLOAD: { en: "Truckload",        am: "የጭነት መኪና" },
};

export function getUnitLabel(unit: string, locale: "en" | "am"): string {
  return UNIT_LABELS[unit]?.[locale] ?? unit;
}

// ---------------------------------------------------------------------------
// 2. CATEGORY → SUITABLE UNITS MAPPING
// ---------------------------------------------------------------------------

/**
 * Maps category slugs to the ProductUnit values appropriate for that material.
 * Prevents nonsensical unit selections (e.g. "Truckload" for Tiles).
 */
export const CATEGORY_UNIT_MAP: Record<string, string[]> = {
  "cement":                 ["BAG", "KG", "QUINTAL", "TON"],
  "steel":                  ["PIECE", "KG", "QUINTAL", "TON", "BUNDLE"],
  "aggregates":             ["M3", "TON", "TRUCKLOAD"],
  "ready-mix-concrete":     ["M3"],
  "metal-works":            ["PIECE", "KG", "TON", "METRE", "BUNDLE"],
  "aluminium-works":        ["PIECE", "METRE", "SQM", "KG"],
  "glass":                  ["PIECE", "SQM"],
  "roofing":                ["SHEET", "SQM", "PIECE"],
  "finishing-tiles":        ["BOX", "SQM", "PIECE"],
  "paints":                 ["LITRE", "BUCKET", "DRUM"],
  "admixtures-chemicals":   ["LITRE", "KG", "DRUM", "BUCKET"],
  "blocks":                 ["PIECE"],
  "sanitary-materials":     ["PIECE", "BOX"],
  "plumbing":               ["PIECE", "METRE", "BUNDLE"],
  "electrical":             ["METRE", "ROLL", "PIECE", "BOX"],
  "hardware":               ["PIECE", "BOX", "KG", "PAIR", "BUNDLE"],
  "hvac-mechanical":        ["PIECE"],
  "infrastructure-landscaping": ["PIECE", "SQM", "M3", "TON", "TRUCKLOAD"],
  "other-materials":        ["PIECE", "KG", "METRE", "SQM", "M3", "BAG", "BOX", "BUNDLE", "ROLL", "SHEET", "LITRE", "BUCKET", "DRUM", "TRUCKLOAD", "QUINTAL", "TON", "PAIR"],
  "reusable-site-wastage":  ["PIECE", "KG", "BUNDLE", "TRUCKLOAD", "M3"],
};

/** All available units as a fallback when category isn't matched */
export const ALL_UNITS: string[] = Object.keys(UNIT_LABELS);

/** Get suitable units for a category slug */
export function getUnitsForCategory(categorySlug: string): string[] {
  return CATEGORY_UNIT_MAP[categorySlug] || ALL_UNITS;
}

// ---------------------------------------------------------------------------
// 3. AVAILABILITY STATUS LABELS
// ---------------------------------------------------------------------------

export const STOCK_STATE_LABELS: Record<string, { en: string; am: string }> = {
  IN_STOCK:     { en: "In Stock",           am: "አለ (ክምችት)" },
  LIMITED:      { en: "Limited Stock",       am: "ውስን ክምችት" },
  ON_ORDER:     { en: "Available on Order",  am: "በትዕዛዝ ይገኛል" },
  OUT_OF_STOCK: { en: "Out of Stock",        am: "አልቋል" },
};

export function getStockStateLabel(state: string, locale: "en" | "am"): string {
  return STOCK_STATE_LABELS[state]?.[locale] ?? state;
}

// ---------------------------------------------------------------------------
// 4. PRICE MODE
// ---------------------------------------------------------------------------

export type PriceMode = "enter" | "ask";

// ---------------------------------------------------------------------------
// 5. CATEGORY-AWARE SPEC FIELDS (for future structured entry)
// ---------------------------------------------------------------------------

/** Per-category specification fields that should be captured */
export const CATEGORY_SPEC_HINTS: Record<string, { label: string; labelAm: string; placeholder: string }[]> = {
  "cement": [
    { label: "Strength Class", labelAm: "የጥንካሬ ደረጃ", placeholder: "e.g. 42.5R, 32.5N" },
    { label: "Bag Weight", labelAm: "የከረጢት ክብደት", placeholder: "e.g. 50 kg" },
  ],
  "steel": [
    { label: "Diameter", labelAm: "ዲያሜትር", placeholder: "e.g. Ø16mm" },
    { label: "Grade", labelAm: "ደረጃ", placeholder: "e.g. Grade 60" },
    { label: "Bar Length", labelAm: "የብረት ርዝመት", placeholder: "e.g. 12m" },
  ],
  "roofing": [
    { label: "Gauge", labelAm: "ጌጅ", placeholder: "e.g. G28, G30" },
    { label: "Length", labelAm: "ርዝመት", placeholder: "e.g. 3m" },
    { label: "Width", labelAm: "ስፋት", placeholder: "e.g. 80cm" },
  ],
  "finishing-tiles": [
    { label: "Tile Size", labelAm: "የግድግዳ/ወለል ሴራሚክ መጠን", placeholder: "e.g. 60×60 cm" },
    { label: "Coverage per Box", labelAm: "በሳጥን ስፋት", placeholder: "e.g. 1.44 m²" },
  ],
  "blocks": [
    { label: "Block Size", labelAm: "የብሎኬት መጠን", placeholder: "e.g. 20cm, 15cm, 10cm" },
    { label: "Class", labelAm: "ክፍል", placeholder: "e.g. Class A, Class B" },
  ],
  "plumbing": [
    { label: "Pipe Diameter", labelAm: "የቧንቧ ዲያሜትር", placeholder: "e.g. 20mm, 63mm" },
    { label: "Material Type", labelAm: "ዓይነት", placeholder: "e.g. PPR, PVC, HDPE" },
    { label: "Length", labelAm: "ርዝመት", placeholder: "e.g. 4m" },
  ],
  "electrical": [
    { label: "Cable Spec", labelAm: "የኬብል ዝርዝር", placeholder: "e.g. 2.5mm² copper" },
    { label: "Roll Length", labelAm: "የጥቅል ርዝመት", placeholder: "e.g. 100m" },
  ],
  "paints": [
    { label: "Container Size", labelAm: "የመያዣ መጠን", placeholder: "e.g. 3.6L, 18L" },
    { label: "Paint Type", labelAm: "ዓይነት", placeholder: "e.g. emulsion, enamel, primer" },
  ],
};
