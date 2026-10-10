// =============================================================================
// ConMart — Default Material Categories (Official 20 Construction Categories)
// =============================================================================
// Inserted on catalog/listing/admin load to guarantee all 20 material categories
// are always available with authentic Ethiopian market imagery and specifications.
// =============================================================================

import { db } from "@/lib/db";

export const DEFAULT_CATEGORIES = [
  {
    name: "Cement",
    slug: "cement",
    iconName: "Container",
    imageUrl:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    description:
      "Dangote, Derba, Mugher & Messebo OPC 42.5R & PPC 32.5N bags & bulk supply.",
    unlockFee: 350,
    sortOrder: 1,
  },
  {
    name: "Rebar",
    slug: "steel",
    iconName: "Columns3",
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    description:
      "High-yield Grade 60 deformed rebar (Ø8mm - Ø32mm), wire mesh & structural steel.",
    unlockFee: 350,
    sortOrder: 2,
  },
  {
    name: "Aggregate & Sand",
    slug: "aggregates",
    iconName: "Mountain",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    description:
      "Awash River Sand (Ashewa) and Sululta basalt crushed stone (01, 02, Chika Dingay).",
    unlockFee: 300,
    sortOrder: 3,
  },
  {
    name: "Ready Made Concrete",
    slug: "ready-mix-concrete",
    iconName: "Truck",
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f8?auto=format&fit=crop&w=800&q=80",
    description:
      "Batching plant pumpable concrete (C25, C30, C35) delivered by transit mixer trucks.",
    unlockFee: 350,
    sortOrder: 4,
  },
  {
    name: "Metal Works",
    slug: "metal-works",
    iconName: "Layers",
    imageUrl:
      "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
    description:
      "RHS, SHS, hollow steel tubes, angle iron, U-channels, beams & fabrication steel.",
    unlockFee: 300,
    sortOrder: 5,
  },
  {
    name: "Aluminium Works",
    slug: "aluminium-works",
    iconName: "Frame",
    imageUrl:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    description:
      "Aluminium profiles for windows, doors, curtain walls, structural glazing & accessories.",
    unlockFee: 300,
    sortOrder: 6,
  },
  {
    name: "Glass",
    slug: "glass",
    iconName: "Sparkles",
    imageUrl:
      "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=800&q=80",
    description:
      "Architectural sheet glass, tempered safety glass, tinted, reflective & double glazing.",
    unlockFee: 250,
    sortOrder: 7,
  },
  {
    name: "Roofing",
    slug: "roofing",
    iconName: "Home",
    imageUrl:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    description:
      "Galvanized corrugated iron sheets (G28, G30), EGA profile sheets & ridge caps.",
    unlockFee: 250,
    sortOrder: 8,
  },
  {
    name: "Finishing Tiles",
    slug: "finishing-tiles",
    iconName: "LayoutGrid",
    imageUrl:
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
    description:
      "Porcelain floor tiles, ceramic wall tiles, Ethiopian granite, marble & tile adhesives.",
    unlockFee: 200,
    sortOrder: 9,
  },
  {
    name: "Paints & Gypsum Work",
    slug: "paints-gypsum",
    iconName: "Paintbrush",
    imageUrl:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    description:
      "Kadisco & Super Mega paints, quartz plaster, gypsum boards, framing studs & putty.",
    unlockFee: 200,
    sortOrder: 10,
  },
  {
    name: "Admixture & Chemicals",
    slug: "admixtures-chemicals",
    iconName: "FlaskConical",
    imageUrl:
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80",
    description:
      "Concrete superplasticizers, waterproofing compounds, curing agents, epoxy & grout.",
    unlockFee: 250,
    sortOrder: 11,
  },
  {
    name: "HCB",
    slug: "blocks",
    iconName: "Box",
    imageUrl:
      "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
    description:
      "Machine-vibrated hollow concrete blocks (HCB 10, 15, 20cm Class A/B) & solid blocks.",
    unlockFee: 200,
    sortOrder: 12,
  },
  {
    name: "Sanitary Materials",
    slug: "sanitary-materials",
    iconName: "Bath",
    imageUrl:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    description:
      "Ceramic water closets, wash basins, faucets, shower trays, mixers & bathroom fittings.",
    unlockFee: 250,
    sortOrder: 13,
  },
  {
    name: "Plumbing & Pipes",
    slug: "plumbing",
    iconName: "Pipette",
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
    description:
      "PPR hot & cold water pipes, PVC drainage pipes, HDPE rolls, brass valves & fittings.",
    unlockFee: 200,
    sortOrder: 14,
  },
  {
    name: "Electrical Materials",
    slug: "electrical",
    iconName: "Zap",
    imageUrl:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    description:
      "Pure copper cables, PVC conduits, circuit breakers, switches & heavy distribution panels.",
    unlockFee: 250,
    sortOrder: 15,
  },
  {
    name: "Hardware Tools & Consumables",
    slug: "hardware",
    iconName: "Wrench",
    imageUrl:
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
    description:
      "Power tools, angle grinders, welding electrodes, cutting discs, fasteners & PPE safety gear.",
    unlockFee: 150,
    sortOrder: 16,
  },
  {
    name: "HVAC & Mechanical",
    slug: "hvac-mechanical",
    iconName: "Wind",
    imageUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    description:
      "Commercial split AC units, ventilation ducts, industrial blowers, chillers & booster pumps.",
    unlockFee: 350,
    sortOrder: 17,
  },
  {
    name: "Infrastructure & Landscaping",
    slug: "infrastructure-landscaping",
    iconName: "Landmark",
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    description:
      "Cobblestones, precast kerbstones, stormwater culverts, road paving tiles & geotextiles.",
    unlockFee: 300,
    sortOrder: 18,
  },
  {
    name: "Other Materials",
    slug: "other-materials",
    iconName: "PackagePlus",
    imageUrl:
      "https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80",
    description:
      "Site supplies, scaffolding couplers, safety nets, temporary fencing & auxiliary items.",
    unlockFee: 200,
    sortOrder: 19,
  },
  {
    name: "Site Wastages (Reusable)",
    slug: "reusable-site-wastage",
    iconName: "Recycle",
    imageUrl:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    description:
      "Reusable formwork timber, rebar offcuts, scrap metal, surplus bricks & salvageable site materials.",
    unlockFee: 150,
    sortOrder: 20,
  },
] as const;

/**
 * Ensures the official 20 construction categories exist in the database.
 * Upserts all 20 categories so new categories are seamlessly added and existing
 * titles/sort orders are aligned without losing relation links.
 */
export async function ensureDefaultCategories(): Promise<void> {
  try {
    await Promise.all(
      DEFAULT_CATEGORIES.map((category) =>
        db.category.upsert({
          where: { slug: category.slug },
          update: {
            name: category.name,
            iconName: category.iconName,
            imageUrl: category.imageUrl,
            description: category.description,
            sortOrder: category.sortOrder,
            unlockFee: category.unlockFee,
            isActive: true,
          },
          create: {
            name: category.name,
            slug: category.slug,
            iconName: category.iconName,
            imageUrl: category.imageUrl,
            description: category.description,
            isActive: true,
            unlockFee: category.unlockFee,
            sortOrder: category.sortOrder,
          },
        })
      )
    );
  } catch (error) {
    console.error("Non-fatal: ensureDefaultCategories database sync failed:", error);
  }
}
