// =============================================================================
// ConMart — Database Seed Script (Ethiopian Market)
// =============================================================================
// Seeds the database with realistic Ethiopian construction market data:
// - Product categories with local relevance & high-res curated imagery
// - Ethiopian cement brands (Dangote, Derba, Mugher, Messebo, National)
// - Ethiopian steel suppliers (Zuquala, Akaki, EISE)
// - Ethiopian cities and locations
// - Prices in ETB (Ethiopian Birr)
// - Authentic product specifications & photos
//
// Usage: npx prisma db seed
// =============================================================================

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import {
  PrismaClient,
  UserRole,
  ProductUnit,
  EnquiryStatus,
  DeliveryPreference,
  OutcomeType,
  DisputeClaimType,
  DisputeStatus,
  PaymentMethod,
  WalletTxStatus,
  SellerVerificationStatus,
  SellerType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { COVERAGE_AREAS } from "../src/lib/marketplace/coverage-areas";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and point it at " +
      "the database you want to seed.\n\n" +
      "This script writes demo suppliers, listings, and wallet balances — never " +
      "run it against production."
  );
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log("🌱 Seeding ConMart database with rich Ethiopian market visuals...");

  // ===========================================================================
  // CATEGORIES (with curated high-definition construction imagery)
  // ===========================================================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "cement" },
      update: {
        name: "Cement",
        iconName: "Container",
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
        description: "Dangote, Derba, Mugher & Messebo OPC 42.5R & PPC 32.5N bags & bulk supply.",
        isActive: true,
        unlockFee: 350.0,
        sortOrder: 1,
      },
      create: {
        name: "Cement",
        slug: "cement",
        iconName: "Container",
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
        description: "Dangote, Derba, Mugher & Messebo OPC 42.5R & PPC 32.5N bags & bulk supply.",
        isActive: true,
        unlockFee: 350.0,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "steel" },
      update: {
        name: "Steel & Rebar",
        iconName: "Columns3",
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        description: "High-yield Grade 60 deformed rebar (Ø10mm - Ø32mm), wire mesh & structural steel.",
        isActive: true,
        unlockFee: 350.0,
        sortOrder: 2,
      },
      create: {
        name: "Steel & Rebar",
        slug: "steel",
        iconName: "Columns3",
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        description: "High-yield Grade 60 deformed rebar (Ø10mm - Ø32mm), wire mesh & structural steel.",
        isActive: true,
        unlockFee: 350.0,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "aggregates" },
      update: {
        name: "Aggregates & Sand",
        iconName: "Mountain",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        description: "Awash River Sand (Ashewa) and Sululta basalt crushed stone (01, 02, Chika Dingay).",
        isActive: true,
        unlockFee: 300.0,
        sortOrder: 3,
      },
      create: {
        name: "Aggregates & Sand",
        slug: "aggregates",
        iconName: "Mountain",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        description: "Awash River Sand (Ashewa) and Sululta basalt crushed stone (01, 02, Chika Dingay).",
        isActive: true,
        unlockFee: 300.0,
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "blocks" },
      update: {
        name: "Hollow Blocks & Bricks",
        iconName: "LayoutGrid",
        imageUrl: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
        description: "Machine-vibrated hollow concrete blocks (HCB 10, 15, 20cm Class A/B) & red bricks.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 4,
      },
      create: {
        name: "Hollow Blocks & Bricks",
        slug: "blocks",
        iconName: "LayoutGrid",
        imageUrl: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
        description: "Machine-vibrated hollow concrete blocks (HCB 10, 15, 20cm Class A/B) & red bricks.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: "roofing" },
      update: {
        name: "Roofing & Iron Sheets",
        iconName: "Home",
        imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        description: "Galvanized corrugated iron sheets (G28, G30), EGA profile sheets & ridge caps.",
        isActive: true,
        unlockFee: 250.0,
        sortOrder: 5,
      },
      create: {
        name: "Roofing & Iron Sheets",
        slug: "roofing",
        iconName: "Home",
        imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        description: "Galvanized corrugated iron sheets (G28, G30), EGA profile sheets & ridge caps.",
        isActive: true,
        unlockFee: 250.0,
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: "plumbing" },
      update: {
        name: "Plumbing & Pipes",
        iconName: "Pipette",
        imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
        description: "PPR hot & cold water pipes, PVC drainage pipes, HDPE rolls & brass valves.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 6,
      },
      create: {
        name: "Plumbing & Pipes",
        slug: "plumbing",
        iconName: "Pipette",
        imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
        description: "PPR hot & cold water pipes, PVC drainage pipes, HDPE rolls & brass valves.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 6,
      },
    }),
    prisma.category.upsert({
      where: { slug: "timber" },
      update: {
        name: "Timber & Formwork",
        iconName: "TreePine",
        imageUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80",
        description: "Eucalyptus scaffolding poles, Zigba/Tid formwork lumber & marine plywood.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 7,
      },
      create: {
        name: "Timber & Formwork",
        slug: "timber",
        iconName: "TreePine",
        imageUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80",
        description: "Eucalyptus scaffolding poles, Zigba/Tid formwork lumber & marine plywood.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 7,
      },
    }),
    prisma.category.upsert({
      where: { slug: "electrical" },
      update: {
        name: "Electrical & Wiring",
        iconName: "Zap",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        description: "Pure copper cables, PVC conduits, circuit breakers & heavy distribution panels.",
        isActive: true,
        unlockFee: 250.0,
        sortOrder: 8,
      },
      create: {
        name: "Electrical & Wiring",
        slug: "electrical",
        iconName: "Zap",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        description: "Pure copper cables, PVC conduits, circuit breakers & heavy distribution panels.",
        isActive: true,
        unlockFee: 250.0,
        sortOrder: 8,
      },
    }),
    prisma.category.upsert({
      where: { slug: "finishes" },
      update: {
        name: "Finishes, Tiles & Paint",
        iconName: "Paintbrush",
        imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        description: "Porcelain tiles, Ethiopian granite, Kadisco & Super Mega paints and quartz plaster.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 9,
      },
      create: {
        name: "Finishes, Tiles & Paint",
        slug: "finishes",
        iconName: "Paintbrush",
        imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        description: "Porcelain tiles, Ethiopian granite, Kadisco & Super Mega paints and quartz plaster.",
        isActive: true,
        unlockFee: 200.0,
        sortOrder: 9,
      },
    }),
    prisma.category.upsert({
      where: { slug: "hardware" },
      update: {
        name: "Hardware, Tools & Consumables",
        iconName: "Wrench",
        imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
        description: "Fasteners, power tools, safety equipment, welding consumables and locksets.",
        isActive: true,
        unlockFee: 150.0,
        sortOrder: 10,
      },
      create: {
        name: "Hardware, Tools & Consumables",
        slug: "hardware",
        iconName: "Wrench",
        imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
        description: "Fasteners, power tools, safety equipment, welding consumables and locksets.",
        isActive: true,
        unlockFee: 150.0,
        sortOrder: 10,
      },
    }),
    prisma.category.upsert({
      where: { slug: "hvac-mechanical" },
      update: {
        name: "HVAC & Mechanical",
        iconName: "Wind",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        description: "Split AC units, commercial ventilation ducting, extractors and pumps.",
        isActive: true,
        unlockFee: 350.0,
        sortOrder: 11,
      },
      create: {
        name: "HVAC & Mechanical",
        slug: "hvac-mechanical",
        iconName: "Wind",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        description: "Split AC units, commercial ventilation ducting, extractors and pumps.",
        isActive: true,
        unlockFee: 350.0,
        sortOrder: 11,
      },
    }),
    prisma.category.upsert({
      where: { slug: "infrastructure-external" },
      update: {
        name: "Infrastructure & Landscaping",
        iconName: "Landmark",
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
        description: "Cobblestone, precast kerbstones, culverts, geotextile and security fencing.",
        isActive: true,
        unlockFee: 300.0,
        sortOrder: 12,
      },
      create: {
        name: "Infrastructure & Landscaping",
        slug: "infrastructure-external",
        iconName: "Landmark",
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
        description: "Cobblestone, precast kerbstones, culverts, geotextile and security fencing.",
        isActive: true,
        unlockFee: 300.0,
        sortOrder: 12,
      },
    }),
  ]);

  console.log(`✅ Seeded ${categories.length} categories with images and descriptions`);

  // ===========================================================================
  // PRODUCTS (Ethiopian brands and standards)
  // ===========================================================================
  const products = await Promise.all([
    // --- Cement ---
    prisma.product.upsert({
      where: { id: "prod-dangote-opc" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-dangote-opc",
        categoryId: categories[0].id,
        title: "Dangote Cement OPC 42.5R",
        unit: ProductUnit.QUINTAL,
        imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
        specs: {
          brand: "Dangote",
          grade: "42.5R",
          weight: "50kg/bag (2 bags = 1 quintal)",
          type: "OPC (Ordinary Portland Cement)",
          standard: "ES 1177-1 / EN 197-1",
          origin: "Mugher, Oromia, Ethiopia",
        },
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-derba-ppc" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-derba-ppc",
        categoryId: categories[0].id,
        title: "Derba Cement PPC 32.5N",
        unit: ProductUnit.QUINTAL,
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        specs: {
          brand: "Derba",
          grade: "32.5N",
          weight: "50kg/bag (2 bags = 1 quintal)",
          type: "PPC (Portland Pozzolana)",
          standard: "ES 1177-1",
          origin: "Derba, Oromia, Ethiopia",
        },
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-mugher-opc" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-mugher-opc",
        categoryId: categories[0].id,
        title: "Mugher Cement OPC 42.5N",
        unit: ProductUnit.QUINTAL,
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
        specs: {
          brand: "Mugher",
          grade: "42.5N",
          weight: "50kg/bag",
          type: "OPC (Ordinary Portland)",
          standard: "ES 1177-1",
          origin: "Mugher, Oromia, Ethiopia",
        },
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-messebo-ppc" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-messebo-ppc",
        categoryId: categories[0].id,
        title: "Messebo Cement PPC 32.5R",
        unit: ProductUnit.QUINTAL,
        imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
        specs: {
          brand: "Messebo",
          grade: "32.5R",
          weight: "50kg/bag",
          type: "PPC (Portland Pozzolana)",
          standard: "ES 1177-1",
          origin: "Mekelle, Tigray, Ethiopia",
        },
      },
    }),

    // --- Steel & Rebar ---
    prisma.product.upsert({
      where: { id: "prod-zuquala-rebar-12" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-zuquala-rebar-12",
        categoryId: categories[1].id,
        title: "Zuquala Steel Rebar Ø12mm (Grade 60)",
        unit: ProductUnit.QUINTAL,
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        specs: {
          brand: "Zuquala Steel",
          diameter: "12mm",
          length: "12 meters",
          grade: "ASTM A615 Grade 60",
          type: "High-yield Deformed Bar",
          origin: "Dukem, Ethiopia",
        },
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-akaki-rebar-16" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-akaki-rebar-16",
        categoryId: categories[1].id,
        title: "Akaki Metal Rebar Ø16mm (Grade 60)",
        unit: ProductUnit.QUINTAL,
        imageUrl: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=80",
        specs: {
          brand: "Akaki Metal Products",
          diameter: "16mm",
          length: "12 meters",
          grade: "ASTM A615 Grade 60",
          type: "High-yield Deformed Bar",
          origin: "Akaki Kaliti, Addis Ababa",
        },
      },
    }),

    // --- Aggregates ---
    prisma.product.upsert({
      where: { id: "prod-crushed-stone-02" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-crushed-stone-02",
        categoryId: categories[2].id,
        title: "Crushed Basalt Stone 02 (Chika Dingay)",
        unit: ProductUnit.M3,
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        specs: {
          size: "20-25mm",
          type: "Dense Basalt Crushed Aggregate",
          use: "Structural concrete mixing, slabs, columns",
          source: "Sululta Quarry, Oromia",
        },
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-river-sand" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-river-sand",
        categoryId: categories[2].id,
        title: "Washed River Sand (Ashewa)",
        unit: ProductUnit.M3,
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
        specs: {
          type: "Natural River Sand",
          grade: "Plastering, Masonry & Concrete",
          fineness: "Medium-Coarse washed",
          source: "Awash River Basin",
        },
      },
    }),

    // --- Hollow Blocks ---
    prisma.product.upsert({
      where: { id: "prod-hcb-15" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-hcb-15",
        categoryId: categories[3].id,
        title: "Hollow Concrete Block (HCB) 15cm",
        unit: ProductUnit.PIECE,
        imageUrl: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
        specs: {
          dimensions: "40cm × 20cm × 15cm",
          type: "Vibrated Hollow Block",
          strength: "Class B (5.0 MPa)",
          standard: "ES 596 Ethiopian Standard",
        },
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-hcb-20" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-hcb-20",
        categoryId: categories[3].id,
        title: "Hollow Concrete Block (HCB) 20cm (Class A)",
        unit: ProductUnit.PIECE,
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80",
        specs: {
          dimensions: "40cm × 20cm × 20cm",
          type: "Heavy Load-Bearing Block",
          strength: "Class A (7.0 MPa)",
          standard: "ES 596 Ethiopian Standard",
        },
      },
    }),

    // --- Roofing ---
    prisma.product.upsert({
      where: { id: "prod-egi-corrugated" },
      update: {
        imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      },
      create: {
        id: "prod-egi-corrugated",
        categoryId: categories[4].id,
        title: "EGI Corrugated Iron Sheet G28 (3m)",
        unit: ProductUnit.PIECE,
        imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        specs: {
          gauge: "G28 (0.35mm)",
          length: "3.0 meters",
          width: "0.85 meters",
          material: "Hot-Dipped Galvanized Steel",
          type: "Standard Corrugated Profile",
        },
      },
    }),
  ]);

  console.log(`✅ Seeded ${products.length} products with technical specifications and photos`);

  // ===========================================================================
  // DEMO USERS (Ethiopian context)
  // ===========================================================================
  await prisma.user.upsert({
    where: { id: "user-admin-001" },
    update: {},
    create: {
      id: "user-admin-001",
      authId: "auth-admin-placeholder",
      role: UserRole.ADMIN,
      name: "ConMart Operations",
      phone: "+251 91 100 0000",
      companyName: "ConMart Ethiopia",
    },
  });

  const seller1 = await prisma.user.upsert({
    where: { id: "user-seller-001" },
    update: {},
    create: {
      id: "user-seller-001",
      authId: "auth-seller-001-placeholder",
      role: UserRole.SELLER,
      name: "Abebe Kebede",
      phone: "+251 91 234 5678",
      companyName: "Abebe Building Materials PLC",
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { id: "user-seller-002" },
    update: {},
    create: {
      id: "user-seller-002",
      authId: "auth-seller-002-placeholder",
      role: UserRole.SELLER,
      name: "Tigist Haile",
      phone: "+251 92 345 6789",
      companyName: "Tigist Construction Supplies",
    },
  });

  const buyerUser = await prisma.user.upsert({
    where: { id: "user-buyer-001" },
    update: {},
    create: {
      id: "user-buyer-001",
      authId: "auth-buyer-placeholder",
      role: UserRole.BUYER,
      name: "Solomon Tesfaye",
      phone: "+251 91 876 5432",
      companyName: "Solomon General Contractor",
    },
  });

  const seller3 = await prisma.user.upsert({
    where: { id: "user-seller-003" },
    update: {},
    create: {
      id: "user-seller-003",
      authId: "auth-seller-003-placeholder",
      role: UserRole.SELLER,
      name: "Dawit Wolde",
      phone: "+251 93 456 7890",
      companyName: "Bole Construction Materials Import PLC",
    },
  });

  const fieldAgentUser = await prisma.user.upsert({
    where: { id: "user-agent-001" },
    update: {},
    create: {
      id: "user-agent-001",
      authId: "auth-agent-placeholder",
      role: UserRole.FIELD_AGENT,
      name: "Kassahun Bekele",
      phone: "+251 94 111 2233",
      companyName: "ConMart Field Operations",
    },
  });

  console.log(
    `✅ Seeded demo users: Admin, Seller1(${seller1.companyName}), Seller2(${seller2.companyName}), Seller3(${seller3.companyName}), Buyer(${buyerUser.companyName}), Agent(${fieldAgentUser.name})`
  );

  // ===========================================================================
  // LISTINGS & PRICE TIERS (Ethiopian prices in ETB)
  // ===========================================================================
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  // --- Listing 1: Dangote Cement (Addis Ababa) ---
  const listing1 = await prisma.listing.upsert({
    where: { id: "listing-dangote-addis" },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-dangote-addis",
      sellerId: seller1.id,
      productId: products[0].id,
      active: true,
      location: "Addis Ababa, Merkato Yard",
      imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
    },
  });

  await Promise.all([
    prisma.priceTier.upsert({
      where: { id: "tier-dangote-1" },
      update: { unitPrice: 580.0 },
      create: {
        id: "tier-dangote-1",
        listingId: listing1.id,
        minQty: 10,
        maxQty: 99,
        unitPrice: 580.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-dangote-2" },
      update: { unitPrice: 550.0 },
      create: {
        id: "tier-dangote-2",
        listingId: listing1.id,
        minQty: 100,
        maxQty: 499,
        unitPrice: 550.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-dangote-3" },
      update: { unitPrice: 520.0 },
      create: {
        id: "tier-dangote-3",
        listingId: listing1.id,
        minQty: 500,
        maxQty: 5000,
        unitPrice: 520.0,
        validUntil: sixMonthsFromNow,
      },
    }),
  ]);

  // --- Listing 2: Derba Cement (Adama) ---
  const listing2 = await prisma.listing.upsert({
    where: { id: "listing-derba-adama" },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-derba-adama",
      sellerId: seller1.id,
      productId: products[1].id,
      active: true,
      location: "Adama (Nazret) Logistics Hub",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    },
  });

  await Promise.all([
    prisma.priceTier.upsert({
      where: { id: "tier-derba-1" },
      update: { unitPrice: 520.0 },
      create: {
        id: "tier-derba-1",
        listingId: listing2.id,
        minQty: 10,
        maxQty: 99,
        unitPrice: 520.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-derba-2" },
      update: { unitPrice: 490.0 },
      create: {
        id: "tier-derba-2",
        listingId: listing2.id,
        minQty: 100,
        maxQty: 999,
        unitPrice: 490.0,
        validUntil: sixMonthsFromNow,
      },
    }),
  ]);

  // --- Listing 3: Mugher Cement (Bahir Dar) ---
  const listing3 = await prisma.listing.upsert({
    where: { id: "listing-mugher-bahirdar" },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-mugher-bahirdar",
      sellerId: seller2.id,
      productId: products[2].id,
      active: true,
      location: "Bahir Dar, Industrial Zone",
      imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    },
  });

  await Promise.all([
    prisma.priceTier.upsert({
      where: { id: "tier-mugher-1" },
      update: { unitPrice: 560.0 },
      create: {
        id: "tier-mugher-1",
        listingId: listing3.id,
        minQty: 20,
        maxQty: 199,
        unitPrice: 560.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-mugher-2" },
      update: { unitPrice: 530.0 },
      create: {
        id: "tier-mugher-2",
        listingId: listing3.id,
        minQty: 200,
        maxQty: 2000,
        unitPrice: 530.0,
        validUntil: sixMonthsFromNow,
      },
    }),
  ]);

  // --- Listing 4: Zuquala Rebar (Addis Ababa) ---
  const listing4 = await prisma.listing.upsert({
    where: { id: "listing-zuquala-rebar" },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-zuquala-rebar",
      sellerId: seller1.id,
      productId: products[4].id,
      active: true,
      location: "Addis Ababa, Kaliti Steel Depot",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    },
  });

  await Promise.all([
    prisma.priceTier.upsert({
      where: { id: "tier-zuquala-1" },
      update: { unitPrice: 8500.0 },
      create: {
        id: "tier-zuquala-1",
        listingId: listing4.id,
        minQty: 5,
        maxQty: 49,
        unitPrice: 8500.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-zuquala-2" },
      update: { unitPrice: 7800.0 },
      create: {
        id: "tier-zuquala-2",
        listingId: listing4.id,
        minQty: 50,
        maxQty: 500,
        unitPrice: 7800.0,
        validUntil: sixMonthsFromNow,
      },
    }),
  ]);

  // --- Listing 5: Crushed Stone (Sululta) ---
  const listing5 = await prisma.listing.upsert({
    where: { id: "listing-crushed-stone" },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-crushed-stone",
      sellerId: seller2.id,
      productId: products[6].id,
      active: true,
      location: "Sululta, Oromia Quarry Site",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    },
  });

  await Promise.all([
    prisma.priceTier.upsert({
      where: { id: "tier-stone-1" },
      update: { unitPrice: 850.0 },
      create: {
        id: "tier-stone-1",
        listingId: listing5.id,
        minQty: 5,
        maxQty: 29,
        unitPrice: 850.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-stone-2" },
      update: { unitPrice: 750.0 },
      create: {
        id: "tier-stone-2",
        listingId: listing5.id,
        minQty: 30,
        maxQty: 200,
        unitPrice: 750.0,
        validUntil: sixMonthsFromNow,
      },
    }),
  ]);

  // --- Listing 6: HCB 20cm (Dire Dawa) ---
  const listing6 = await prisma.listing.upsert({
    where: { id: "listing-hcb-diredawa" },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-hcb-diredawa",
      sellerId: seller2.id,
      productId: products[9].id,
      active: true,
      location: "Dire Dawa, Block Factory Depot",
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80",
    },
  });

  await Promise.all([
    prisma.priceTier.upsert({
      where: { id: "tier-hcb-1" },
      update: { unitPrice: 22.0 },
      create: {
        id: "tier-hcb-1",
        listingId: listing6.id,
        minQty: 100,
        maxQty: 999,
        unitPrice: 22.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-hcb-2" },
      update: { unitPrice: 18.0 },
      create: {
        id: "tier-hcb-2",
        listingId: listing6.id,
        minQty: 1000,
        maxQty: 10000,
        unitPrice: 18.0,
        validUntil: sixMonthsFromNow,
      },
    }),
  ]);

  // --- Listing 7: EGI Iron Sheet (Hawassa) ---
  const listing7 = await prisma.listing.upsert({
    where: { id: "listing-egi-hawassa" },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-egi-hawassa",
      sellerId: seller1.id,
      productId: products[10].id,
      active: true,
      location: "Hawassa, SNNPR Warehouse",
      imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    },
  });

  await Promise.all([
    prisma.priceTier.upsert({
      where: { id: "tier-egi-1" },
      update: { unitPrice: 680.0 },
      create: {
        id: "tier-egi-1",
        listingId: listing7.id,
        minQty: 10,
        maxQty: 99,
        unitPrice: 680.0,
        validUntil: sixMonthsFromNow,
      },
    }),
    prisma.priceTier.upsert({
      where: { id: "tier-egi-2" },
      update: { unitPrice: 620.0 },
      create: {
        id: "tier-egi-2",
        listingId: listing7.id,
        minQty: 100,
        maxQty: 1000,
        unitPrice: 620.0,
        validUntil: sixMonthsFromNow,
      },
    }),
  ]);

  console.log("✅ Seeded 7 listings with price tiers and high-res imagery across Ethiopia");

  // ===========================================================================
  // SELLER PROFILES & PREPAID WALLETS
  // ===========================================================================
  await Promise.all([
    prisma.sellerProfile.upsert({
      where: { userId: seller1.id },
      update: {
        verificationStatus: "VERIFIED",
        sellerType: "WHOLESALER",
        tinNumber: "0012345678",
        licenseNumber: "AA/B/1234/2016",
        vatRegistered: true,
        vatNumber: "VAT-ET-987654",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: null,
      },
      create: {
        userId: seller1.id,
        verificationStatus: "VERIFIED",
        sellerType: "WHOLESALER",
        tinNumber: "0012345678",
        licenseNumber: "AA/B/1234/2016",
        vatRegistered: true,
        vatNumber: "VAT-ET-987654",
        subscriptionStatus: "ACTIVE",
      },
    }),
    prisma.sellerProfile.upsert({
      where: { userId: seller2.id },
      update: {
        verificationStatus: "VERIFIED",
        sellerType: "RETAILER",
        tinNumber: "0087654321",
        licenseNumber: "AA/B/5678/2016",
        vatRegistered: false,
        subscriptionStatus: "FREE",
      },
      create: {
        userId: seller2.id,
        verificationStatus: "VERIFIED",
        sellerType: "RETAILER",
        tinNumber: "0087654321",
        licenseNumber: "AA/B/5678/2016",
        vatRegistered: false,
        subscriptionStatus: "FREE",
      },
    }),
    prisma.sellerProfile.upsert({
      where: { userId: seller3.id },
      update: {
        verificationStatus: SellerVerificationStatus.PENDING,
        sellerType: SellerType.IMPORTER,
        tinNumber: "0055443322",
        licenseNumber: "AA/C/9900/2016",
        vatRegistered: true,
        vatNumber: "VAT-ET-554433",
      },
      create: {
        userId: seller3.id,
        verificationStatus: SellerVerificationStatus.PENDING,
        sellerType: SellerType.IMPORTER,
        tinNumber: "0055443322",
        licenseNumber: "AA/C/9900/2016",
        vatRegistered: true,
        vatNumber: "VAT-ET-554433",
      },
    }),
    prisma.wallet.upsert({
      where: { sellerId: seller1.id },
      update: {
        cashBalance: 5000.0,
        creditBalance: 500.0,
      },
      create: {
        sellerId: seller1.id,
        cashBalance: 5000.0,
        creditBalance: 500.0,
      },
    }),
    prisma.wallet.upsert({
      where: { sellerId: seller2.id },
      update: {
        cashBalance: 2500.0,
        creditBalance: 250.0,
      },
      create: {
        sellerId: seller2.id,
        cashBalance: 2500.0,
        creditBalance: 250.0,
      },
    }),
    prisma.wallet.upsert({
      where: { sellerId: seller3.id },
      update: {
        cashBalance: 0.0,
        creditBalance: 0.0,
      },
      create: {
        sellerId: seller3.id,
        cashBalance: 0.0,
        creditBalance: 0.0,
      },
    }),
  ]);

  const seller2Wallet = await prisma.wallet.findUnique({
    where: { sellerId: seller2.id },
  });

  if (seller2Wallet) {
    await prisma.topUpRequest.upsert({
      where: { id: "topup-seed-01" },
      update: {},
      create: {
        id: "topup-seed-01",
        sellerId: seller2.id,
        walletId: seller2Wallet.id,
        amount: 4500.0,
        paymentMethod: PaymentMethod.TELEBIRR,
        referenceCode: "TB-2026-98124",
        slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
        status: WalletTxStatus.PENDING,
      },
    });
  }

  // ===========================================================================
  // DEMO ENQUIRIES, UNLOCK RECORDS & DISPUTES
  // ===========================================================================
  // 1. Active Unlocked Enquiry (Pending Deal Settlement)
  const activeEnquiry = await prisma.enquiry.upsert({
    where: { id: "enquiry-seed-active-01" },
    update: {},
    create: {
      id: "enquiry-seed-active-01",
      referenceCode: "ENQ-ACT-9810",
      buyerId: buyerUser.id,
      sellerId: seller1.id,
      listingId: listing1.id,
      qty: 150,
      unit: ProductUnit.QUINTAL,
      deliveryPreference: DeliveryPreference.SELLER_DELIVERED,
      deliveryAddress: "Yeka Sub-City, Woreda 04, Megenagna Site",
      accessConstraints: "Standard 40ft trailer access allowed after 8:00 PM",
      status: EnquiryStatus.ACCEPTED,
    },
  });

  await prisma.unlockRecord.upsert({
    where: { enquiryId: activeEnquiry.id },
    update: {},
    create: {
      enquiryId: activeEnquiry.id,
      sellerId: seller1.id,
      buyerId: buyerUser.id,
      feeAmount: 350.0,
      paidFromCredit: 0.0,
      paidFromCash: 350.0,
      sellerReportedOutcome: OutcomeType.PENDING,
      buyerOutcomeResponse: OutcomeType.PENDING,
    },
  });

  // 2. Disputed Enquiry with Open Mediation Case
  const disputedEnquiry = await prisma.enquiry.upsert({
    where: { id: "enquiry-seed-dispute-01" },
    update: {},
    create: {
      id: "enquiry-seed-dispute-01",
      referenceCode: "ENQ-DSP-4421",
      buyerId: buyerUser.id,
      sellerId: seller1.id,
      listingId: listing1.id,
      qty: 200,
      unit: ProductUnit.QUINTAL,
      deliveryPreference: DeliveryPreference.SELLER_DELIVERED,
      deliveryAddress: "Bole Bulbula Site B, Addis Ababa",
      accessConstraints: "Sino-truck access available",
      status: EnquiryStatus.DISPUTED,
    },
  });

  const disputedUnlock = await prisma.unlockRecord.upsert({
    where: { enquiryId: disputedEnquiry.id },
    update: {},
    create: {
      enquiryId: disputedEnquiry.id,
      sellerId: seller1.id,
      buyerId: buyerUser.id,
      feeAmount: 350.0,
      paidFromCash: 350.0,
      paidFromCredit: 0.0,
      sellerReportedOutcome: OutcomeType.FAILURE,
      buyerOutcomeResponse: OutcomeType.FAILURE,
    },
  });

  await prisma.disputeCase.upsert({
    where: { id: "dispute-seed-01" },
    update: {},
    create: {
      id: "dispute-seed-01",
      enquiryId: disputedEnquiry.id,
      unlockRecordId: disputedUnlock.id,
      raisedBy: UserRole.BUYER,
      claimType: DisputeClaimType.SHORTAGE,
      description:
        "Delivered 180 bags instead of 200 bags of Dangote Cement OPC 42.5R to Bole Bulbula site. Driver had no delivery receipt for the remaining 20 bags.",
      evidenceUrls: [
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
      ],
      status: DisputeStatus.OPEN,
    },
  });

  console.log("✅ Seeded Seller Profiles, Wallets, Pending Top-Up, and Live Dispute Mediation Cases");

  // ===========================================================================
  // ZONES, AGENT REGISTRATION, KOYE FECHE LISTING (free-supplier routing)
  // ===========================================================================
  const seededZones = await Promise.all(
    COVERAGE_AREAS.map((area) =>
      prisma.zone.upsert({
        where: { slug: area.slug },
        update: {
          name: area.name,
          aliases: [...area.aliases],
          region: area.region,
          priority: area.priority,
          sortOrder: area.sortOrder,
          districtId: area.districtId,
        },
        create: {
          id: `zone-${area.slug}`,
          name: area.name,
          slug: area.slug,
          aliases: [...area.aliases],
          region: area.region,
          priority: area.priority,
          sortOrder: area.sortOrder,
          districtId: area.districtId,
        },
      })
    )
  );
  const zoneKoye = seededZones.find((zone) => zone.slug === "koye-feche");
  if (!zoneKoye) {
    throw new Error("Coverage catalog is missing koye-feche");
  }

  await prisma.agentProfile.upsert({
    where: { userId: fieldAgentUser.id },
    update: { zoneId: zoneKoye.id, isActive: true },
    create: {
      userId: fieldAgentUser.id,
      zoneId: zoneKoye.id,
      isActive: true,
    },
  });

  await prisma.listing.upsert({
    where: { id: "listing-hcb-koye" },
    update: {
      location: "Koye Feche, Lemi Kura",
      imageUrl: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      id: "listing-hcb-koye",
      sellerId: seller2.id,
      productId: products[8].id,
      active: true,
      location: "Koye Feche, Lemi Kura",
      imageUrl: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
    },
  });

  await prisma.priceTier.upsert({
    where: { id: "tier-hcb-koye-1" },
    update: { unitPrice: 20.0 },
    create: {
      id: "tier-hcb-koye-1",
      listingId: "listing-hcb-koye",
      minQty: 100,
      maxQty: 5000,
      unitPrice: 20.0,
      validUntil: sixMonthsFromNow,
    },
  });

  console.log(
    `✅ Seeded ${COVERAGE_AREAS.length} coverage areas across Ethiopia, agent ${fieldAgentUser.name} on Koye Feche, and a free-tier listing there`
  );
  console.log("🎉 Database seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
