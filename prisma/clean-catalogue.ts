// =============================================================================
// ECON — Material Catalogue Normalization & Cleanup Script
// =============================================================================
// Addresses Yakob Dan review items for curated Product catalogue:
// 1. Standardizes titles to [Brand] [Material] [Key Spec]
// 2. Normalizes Dangote & cement brands with bag weight in specs, not titles
// 3. Updates Stone 02 with Ethiopian local trade name "Chika Dingay"
// 4. Splits roofing sheets into separate gauge and length specifications
// =============================================================================

import { PrismaClient, ProductUnit } from "@prisma/client";

const prisma = new PrismaClient();

interface CleanProductDefinition {
  id: string;
  categorySlug: string;
  title: string;
  unit: ProductUnit;
  specs: Record<string, string>;
  imageUrl?: string;
}

const CLEAN_PRODUCTS: CleanProductDefinition[] = [
  // --- Cement ---
  {
    id: "prod-dangote-opc",
    categorySlug: "cement",
    title: "Dangote Cement OPC 42.5R",
    unit: ProductUnit.BAG,
    specs: {
      brand: "Dangote",
      grade: "42.5R",
      packageSize: "50 kg",
      type: "OPC (Ordinary Portland Cement)",
      standard: "ES 1177-1 / EN 197-1",
      origin: "Mugher, Oromia, Ethiopia",
    },
  },
  {
    id: "prod-derba-ppc",
    categorySlug: "cement",
    title: "Derba Cement PPC 32.5N",
    unit: ProductUnit.BAG,
    specs: {
      brand: "Derba",
      grade: "32.5N",
      packageSize: "50 kg",
      type: "PPC (Pozzolanic Portland Cement)",
      standard: "ES 1177-1",
      origin: "Derba, Oromia, Ethiopia",
    },
  },
  {
    id: "prod-mugher-opc",
    categorySlug: "cement",
    title: "Mugher Cement OPC 42.5R",
    unit: ProductUnit.BAG,
    specs: {
      brand: "Mugher",
      grade: "42.5R",
      packageSize: "50 kg",
      type: "OPC",
      origin: "Mugher, Ethiopia",
    },
  },
  {
    id: "prod-messebo-opc",
    categorySlug: "cement",
    title: "Messebo Cement OPC 42.5R",
    unit: ProductUnit.BAG,
    specs: {
      brand: "Messebo",
      grade: "42.5R",
      packageSize: "50 kg",
      type: "OPC",
      origin: "Mekelle, Ethiopia",
    },
  },

  // --- Steel / Rebar ---
  {
    id: "prod-rebar-16mm",
    categorySlug: "steel",
    title: "Akaki Rebar Ø16mm — Grade 60",
    unit: ProductUnit.PIECE,
    specs: {
      brand: "Akaki Steel",
      diameter: "Ø16mm",
      grade: "Grade 60 (420 MPa)",
      barLength: "12 metres",
      standard: "ASTM A615 / ES ISO 6935-2",
    },
  },
  {
    id: "prod-rebar-12mm",
    categorySlug: "steel",
    title: "Abyssinia Rebar Ø12mm — Grade 60",
    unit: ProductUnit.PIECE,
    specs: {
      brand: "Abyssinia Steel",
      diameter: "Ø12mm",
      grade: "Grade 60 (420 MPa)",
      barLength: "12 metres",
      standard: "ASTM A615",
    },
  },
  {
    id: "prod-rebar-10mm",
    categorySlug: "steel",
    title: "CBE Rebar Ø10mm — Grade 60",
    unit: ProductUnit.PIECE,
    specs: {
      brand: "CBE Rebar",
      diameter: "Ø10mm",
      grade: "Grade 60",
      barLength: "12 metres",
    },
  },
  {
    id: "prod-rebar-8mm",
    categorySlug: "steel",
    title: "Zuqualla Rebar Ø8mm — Grade 40",
    unit: ProductUnit.PIECE,
    specs: {
      brand: "Zuqualla Steel",
      diameter: "Ø8mm",
      grade: "Grade 40",
      barLength: "12 metres",
    },
  },

  // --- Sand & Aggregates ---
  {
    id: "prod-stone-02",
    categorySlug: "aggregates",
    title: "Crushed Basalt Stone 02 (Chika Dingay)",
    unit: ProductUnit.M3,
    specs: {
      localName: "Chika Dingay",
      aggregateSize: "02 (10–20 mm)",
      rockType: "Crushed Basalt",
      quarryOrigin: "Gelan / Akaki Quarry Basin",
      bulkDensity: "1,450–1,550 kg/m³",
    },
  },
  {
    id: "prod-stone-01",
    categorySlug: "aggregates",
    title: "Crushed Basalt Stone 01 (Fine Gravel)",
    unit: ProductUnit.M3,
    specs: {
      aggregateSize: "01 (5–10 mm)",
      rockType: "Crushed Basalt",
      quarryOrigin: "Gelan / Akaki Quarry Basin",
    },
  },
  {
    id: "prod-river-sand",
    categorySlug: "aggregates",
    title: "Wolenchiti Washed River Sand",
    unit: ProductUnit.M3,
    specs: {
      sandType: "Coarse Washed River Sand",
      source: "Wolenchiti / Awash River Basin",
      siltContent: "< 3.5%",
    },
  },

  // --- Roofing ---
  {
    id: "prod-roofing-g28",
    categorySlug: "roofing",
    title: "EGI Corrugated Iron Sheet — G28 (0.35mm)",
    unit: ProductUnit.PIECE,
    specs: {
      gauge: "G28 (0.35mm)",
      length: "3.0 metres",
      width: "800 mm",
      coating: "Zinc Galvanized (Z120)",
      profile: "Standard Corrugated (Sinusoidal)",
    },
  },
  {
    id: "prod-roofing-g30",
    categorySlug: "roofing",
    title: "EGI Corrugated Iron Sheet — G30 (0.30mm)",
    unit: ProductUnit.PIECE,
    specs: {
      gauge: "G30 (0.30mm)",
      length: "3.0 metres",
      width: "800 mm",
      coating: "Zinc Galvanized",
    },
  },

  // --- HCB / Blocks ---
  {
    id: "prod-hcb-20",
    categorySlug: "blocks",
    title: "HCB Hollow Concrete Block — 20cm (Class A)",
    unit: ProductUnit.PIECE,
    specs: {
      dimensions: "40 × 20 × 20 cm",
      blockClass: "Class A (Load Bearing)",
      compressiveStrength: "≥ 5.5 MPa",
      mixRatio: "1:3:6 Cement-Sand-Pumice",
    },
  },
  {
    id: "prod-hcb-15",
    categorySlug: "blocks",
    title: "HCB Hollow Concrete Block — 15cm (Class B)",
    unit: ProductUnit.PIECE,
    specs: {
      dimensions: "40 × 15 × 20 cm",
      blockClass: "Class B (Partition / Non-Load)",
      compressiveStrength: "≥ 3.5 MPa",
    },
  },
  {
    id: "prod-hcb-10",
    categorySlug: "blocks",
    title: "HCB Hollow Concrete Block — 10cm (Partition)",
    unit: ProductUnit.PIECE,
    specs: {
      dimensions: "40 × 10 × 20 cm",
      blockClass: "Partition Wall",
      compressiveStrength: "≥ 2.5 MPa",
    },
  },
];

export async function cleanCatalogue() {
  console.log("=== ECON Catalogue Cleanup & Standardization ===");

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  let updatedCount = 0;
  for (const item of CLEAN_PRODUCTS) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`Category slug "${item.categorySlug}" not found, skipping ${item.title}`);
      continue;
    }

    await prisma.product.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        unit: item.unit,
        specs: item.specs,
        categoryId,
        ...(item.imageUrl && { imageUrl: item.imageUrl }),
      },
      create: {
        id: item.id,
        categoryId,
        title: item.title,
        unit: item.unit,
        specs: item.specs,
        imageUrl: item.imageUrl || null,
      },
    });

    updatedCount++;
    console.log(`✓ Normalized: [${item.categorySlug}] ${item.title}`);
  }

  console.log(`\nCatalogue cleanup complete. ${updatedCount} curated products normalized.\n`);
}

// Allow direct CLI invocation
if (require.main === module) {
  cleanCatalogue()
    .catch((e) => {
      console.error("Catalogue cleanup failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
