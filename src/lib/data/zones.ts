// =============================================================================
// ConMart — Zone Data (Server-Side)
// =============================================================================

import "server-only";

import { db } from "@/lib/db";

export interface RegistrationZoneOption {
  id: string;
  name: string;
}

/** Active zones shown on the agent registration form. */
export async function fetchRegistrationZones(): Promise<RegistrationZoneOption[]> {
  return db.zone.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
