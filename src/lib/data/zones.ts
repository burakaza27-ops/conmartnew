// =============================================================================
// ConMart — Zone Data (Server-Side)
// =============================================================================
// Registration reads zones from the database. If production was deployed
// before the coverage catalog was seeded, the first register page view
// upserts the catalog so agents are never stuck with an empty dropdown.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import { COVERAGE_AREAS } from "@/lib/marketplace/coverage-areas";

export interface RegistrationZoneOption {
  id: string;
  name: string;
  region: string;
  slug: string;
  priority: number;
  sortOrder: number;
}

export async function ensureCoverageAreas(): Promise<void> {
  const existing = await db.zone.count();
  if (existing >= COVERAGE_AREAS.length) {
    return;
  }

  await Promise.all(
    COVERAGE_AREAS.map((area) =>
      db.zone.upsert({
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
}

/** Active zones shown on the agent registration form. */
export async function fetchRegistrationZones(): Promise<RegistrationZoneOption[]> {
  await ensureCoverageAreas();

  return db.zone.findMany({
    select: {
      id: true,
      name: true,
      region: true,
      slug: true,
      priority: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
