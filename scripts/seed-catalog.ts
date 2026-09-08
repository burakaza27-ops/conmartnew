import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_CATEGORIES = [
  { name: "Cement", slug: "cement", iconName: "Container", imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80", description: "Dangote, Derba, Mugher & Messebo OPC 42.5R & PPC 32.5N bags & bulk supply.", unlockFee: 350, sortOrder: 1 },
  { name: "Steel & Rebar", slug: "steel", iconName: "Columns3", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80", description: "High-yield Grade 60 deformed rebar (Ø10mm - Ø32mm), wire mesh & structural steel.", unlockFee: 350, sortOrder: 2 },
  { name: "Aggregates & Sand", slug: "aggregates", iconName: "Mountain", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", description: "Awash River Sand (Ashewa) and Sululta basalt crushed stone (01, 02, Chika Dingay).", unlockFee: 300, sortOrder: 3 },
  { name: "Hollow Blocks & Bricks", slug: "blocks", iconName: "LayoutGrid", imageUrl: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80", description: "Machine-vibrated hollow concrete blocks (HCB 10, 15, 20cm Class A/B) & red bricks.", unlockFee: 200, sortOrder: 4 },
  { name: "Roofing & Iron Sheets", slug: "roofing", iconName: "Home", imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80", description: "Galvanized corrugated iron sheets (G28, G30), EGA profile sheets & ridge caps.", unlockFee: 250, sortOrder: 5 },
  { name: "Plumbing & Pipes", slug: "plumbing", iconName: "Pipette", imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80", description: "PPR hot & cold water pipes, PVC drainage pipes, HDPE rolls & brass valves.", unlockFee: 200, sortOrder: 6 },
  { name: "Timber & Formwork", slug: "timber", iconName: "TreePine", imageUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80", description: "Eucalyptus scaffolding poles, Zigba/Tid formwork lumber & marine plywood.", unlockFee: 200, sortOrder: 7 },
  { name: "Electrical & Wiring", slug: "electrical", iconName: "Zap", imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80", description: "Pure copper cables, PVC conduits, circuit breakers & heavy distribution panels.", unlockFee: 250, sortOrder: 8 },
  { name: "Finishes, Tiles & Paint", slug: "finishes", iconName: "Paintbrush", imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80", description: "Porcelain tiles, Ethiopian granite, Kadisco & Super Mega paints and quartz plaster.", unlockFee: 200, sortOrder: 9 },
  { name: "Hardware, Tools & Consumables", slug: "hardware", iconName: "Wrench", imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80", description: "Fasteners, power tools, safety equipment, welding consumables and locksets.", unlockFee: 150, sortOrder: 10 },
  { name: "HVAC & Mechanical", slug: "hvac-mechanical", iconName: "Wind", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", description: "Split AC units, commercial ventilation ducting, extractors and pumps.", unlockFee: 350, sortOrder: 11 },
  { name: "Infrastructure & Landscaping", slug: "infrastructure-external", iconName: "Landmark", imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80", description: "Cobblestone, precast kerbstones, culverts, geotextile and security fencing.", unlockFee: 300, sortOrder: 12 },
];

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

async function main(): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        iconName: category.iconName,
        imageUrl: category.imageUrl,
        description: category.description,
        isActive: true,
        unlockFee: category.unlockFee,
        sortOrder: category.sortOrder,
      },
      create: {
        ...category,
        isActive: true,
      },
    });
  }
  const count = await prisma.category.count();
  console.log(`Catalog ready: ${count} categories`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
