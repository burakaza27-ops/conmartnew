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

export interface SpecHintItem {
  label: string;
  labelAm: string;
  placeholder: string;
  options?: string[];
}

/** Per-category specification fields with standard dropdown options */
export const CATEGORY_SPEC_HINTS: Record<string, SpecHintItem[]> = {
  "cement": [
    {
      label: "Strength Class",
      labelAm: "የጥንካሬ ደረጃ",
      placeholder: "e.g. 42.5R, 32.5N",
      options: ["OPC 42.5R", "OPC 42.5N", "PPC 32.5R", "PPC 32.5N", "SRC 42.5"],
    },
    {
      label: "Bag Weight",
      labelAm: "የከረጢት ክብደት",
      placeholder: "e.g. 50 kg",
      options: ["50 kg", "Bulk / Silo", "1 Ton Jumbo"],
    },
  ],
  "steel": [
    {
      label: "Diameter",
      labelAm: "ዲያሜትር",
      placeholder: "e.g. 8mm - 20mm or Ø16mm",
      options: [
        "8mm - 20mm (Standard Assortment / የተሟላ ሳይዝ)",
        "6mm - 20mm (Full Depot Range)",
        "Ø8mm",
        "Ø10mm",
        "Ø12mm",
        "Ø14mm",
        "Ø16mm",
        "Ø20mm",
        "Ø6mm",
        "Ø24mm (Heavy Structural)",
        "Ø32mm (Foundation)",
      ],
    },
    {
      label: "Grade",
      labelAm: "ደረጃ",
      placeholder: "e.g. Grade 60 or Grade 75",
      options: ["Grade 60", "Grade 75", "Grade 40", "Commercial Quality"],
    },
  ],
  "roofing": [
    {
      label: "Gauge",
      labelAm: "ጌጅ",
      placeholder: "e.g. G28, G30",
      options: ["G28 (0.32mm Standard)", "G30 (0.25mm Commercial)", "G32 (0.20mm Light)", "G26 (0.40mm Heavy)", "G24 (0.50mm Industrial)"],
    },
    {
      label: "Length",
      labelAm: "ርዝመት",
      placeholder: "e.g. 3m",
      options: ["2.0m", "2.5m", "3.0m (Standard)", "4.0m", "6.0m"],
    },
    {
      label: "Width",
      labelAm: "ስፋት",
      placeholder: "e.g. 80cm",
      options: ["80cm (Standard Corrugated)", "90cm", "100cm"],
    },
  ],
  "finishing-tiles": [
    {
      label: "Tile Size",
      labelAm: "የግድግዳ/ወለል ሴራሚክ መጠን",
      placeholder: "e.g. 60×60 cm",
      options: ["60×60 cm", "30×60 cm", "40×40 cm", "30×30 cm", "80×80 cm", "120×60 cm"],
    },
    {
      label: "Coverage per Box",
      labelAm: "በሳጥን ስፋት",
      placeholder: "e.g. 1.44 m²",
      options: ["1.44 m²", "1.08 m²", "1.20 m²", "1.60 m²", "1.80 m²"],
    },
  ],
  "blocks": [
    {
      label: "Block Size",
      labelAm: "የብሎኬት መጠን",
      placeholder: "e.g. 20cm, 15cm, 10cm",
      options: ["10cm (Interior Partition)", "15cm (Standard Wall)", "20cm (Exterior / Structural)"],
    },
    {
      label: "Class",
      labelAm: "ክፍል",
      placeholder: "e.g. Class A, Class B",
      options: ["Class A", "Class B", "Class C"],
    },
  ],
  "plumbing": [
    {
      label: "Pipe Diameter",
      labelAm: "የቧንቧ ዲያሜትር",
      placeholder: "e.g. 20mm, 63mm",
      options: ["20mm (1/2\")", "25mm (3/4\")", "32mm (1\")", "40mm (1-1/4\")", "50mm (1-1/2\")", "63mm (2\")", "75mm (2-1/2\")", "90mm (3\")", "110mm (4\")"],
    },
    {
      label: "Material Type",
      labelAm: "ዓይነት",
      placeholder: "e.g. PPR, PVC, HDPE",
      options: ["PPR PN20 (Hot/Cold)", "PPR PN16 (Cold)", "PVC Waste (SDR 41)", "HDPE Pressure (PE100)"],
    },
    {
      label: "Length",
      labelAm: "ርዝመት",
      placeholder: "e.g. 4m",
      options: ["4m (Standard)", "6m", "50m Roll", "100m Roll"],
    },
  ],
  "electrical": [
    {
      label: "Cable Spec",
      labelAm: "የኬብል ዝርዝር",
      placeholder: "e.g. 2.5mm² copper",
      options: ["1.5mm² (Lighting)", "2.5mm² (Sockets)", "4.0mm² (Power/Cooker)", "6.0mm² (Sub-main)", "10.0mm² (Main)", "16.0mm² (Service)"],
    },
    {
      label: "Roll Length",
      labelAm: "የጥቅል ርዝመት",
      placeholder: "e.g. 100m",
      options: ["100m (Standard Roll)", "50m", "300m Drum"],
    },
  ],
  "paints": [
    {
      label: "Container Size",
      labelAm: "የመያዣ መጠን",
      placeholder: "e.g. 3.6L, 18L",
      options: ["3.6 Litre (Gallon)", "18 Litre (Bucket)", "200 Litre (Drum)", "1 Litre"],
    },
    {
      label: "Paint Type",
      labelAm: "ዓይነት",
      placeholder: "e.g. emulsion, enamel, primer",
      options: ["Vinyl Emulsion", "Acrylic Emulsion", "Gloss Enamel", "Waterproof Primer", "Undercoat"],
    },
  ],
};
