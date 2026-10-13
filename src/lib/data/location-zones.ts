// =============================================================================
// Econ — Standard Logistics & Transport Zones (Addis Ababa & Regional Hubs)
// =============================================================================
// Single source of truth for supplier and material locations.
// Mandatory at the Zone / Sub-City level so contractors can accurately
// calculate: Total Cost = Material Unit Price + Truck Transport Logistics.
// Exact street landmarks are optional; general transport zones are mandatory.
// =============================================================================

export interface LocationZone {
  id: string;
  name: string;
  subCity: string;
  region: "Addis Ababa" | "Greater Addis" | "Regional";
  popularDepots?: string;
}

export const STANDARD_LOCATION_ZONES: readonly LocationZone[] = [
  // Key heavy material depots & hubs
  { id: "kaliti", name: "Kaliti / Akaki Logistics Corridor", subCity: "Akaki Kaliti", region: "Addis Ababa", popularDepots: "Steel yards, cement depots, heavy machinery" },
  { id: "jemo", name: "Jemo (Jemo 1, 2, 3)", subCity: "Nifas Silk-Lafto", region: "Addis Ababa", popularDepots: "Rebar fabrication, timber yards, blocks" },
  { id: "tulu-dimtu", name: "Tulu Dimtu / Koye Feche", subCity: "Akaki Kaliti", region: "Addis Ababa", popularDepots: "Condominium expansion sites, quarry aggregate depots" },
  { id: "urael", name: "Urael / Bambis / Atlas", subCity: "Bole / Kirkos", region: "Addis Ababa", popularDepots: "Central commercial sites, finishing materials" },
  { id: "merkato", name: "Merkato (Military Tera, Sebategna)", subCity: "Addis Ketema", region: "Addis Ababa", popularDepots: "Sanitary, hardware, pipes, roofing sheets" },
  { id: "bole-bulbula", name: "Bole Bulbula / Rwanda", subCity: "Bole", region: "Addis Ababa", popularDepots: "Finishing tiles, paint, electricals" },
  { id: "gerji", name: "Gerji / Imperial / Jackros", subCity: "Bole", region: "Addis Ababa", popularDepots: "Commercial depots, aluminum & glass works" },
  { id: "cmc-ayat", name: "CMC / Ayat / Summit", subCity: "Yeka", region: "Addis Ababa", popularDepots: "Residential development corridor, blocks, sand" },
  { id: "megenagna", name: "Megenagna / Gurd Shola", subCity: "Yeka", region: "Addis Ababa", popularDepots: "Eastern corridor hub, transit depots" },
  { id: "kazanchis-mexico", name: "Kirkos / Kazanchis / Mexico", subCity: "Kirkos", region: "Addis Ababa", popularDepots: "Central high-rise sites, MEP suppliers" },
  { id: "gotera-saris", name: "Gotera / Saris / Kera", subCity: "Kirkos / Nifas Silk", region: "Addis Ababa", popularDepots: "Steel rolling depots, warehouse yards" },
  { id: "arada-piassa", name: "Arada / Piassa / 4 Kilo", subCity: "Arada", region: "Addis Ababa", popularDepots: "Urban renewal projects, historic district" },
  { id: "kolfe-asko", name: "Kolfe / Asko / Winget", subCity: "Kolfe Keranio", region: "Addis Ababa", popularDepots: "Western exit corridor, stone & timber" },
  { id: "gulele-shiromeda", name: "Gulele / Shiromeda / Entoto", subCity: "Gulele", region: "Addis Ababa", popularDepots: "Timber poles, stone works" },
  { id: "lemi-kura", name: "Lemi Kura / Wosen", subCity: "Lemi Kura", region: "Addis Ababa", popularDepots: "East expansion zone, HCB production yards" },

  // Greater Addis Industrial & Manufacturing Belts
  { id: "sebeta", name: "Sebeta Industrial Area", subCity: "Greater Addis", region: "Greater Addis", popularDepots: "Steel manufacturing, PVC & HDPE pipe plants" },
  { id: "gelan", name: "Gelan Logistics & Dry Port Zone", subCity: "Greater Addis", region: "Greater Addis", popularDepots: "Major freight terminal, rebar mills, cement" },
  { id: "dukem", name: "Dukem (Eastern Industrial Park)", subCity: "Greater Addis", region: "Greater Addis", popularDepots: "Ceramic tile factories, gypsum boards, steel" },
  { id: "burayu", name: "Burayu / Gefersa", subCity: "Greater Addis", region: "Greater Addis", popularDepots: "Crushed stone aggregate quarries" },
  { id: "legetafo", name: "Legetafo / Legedadi", subCity: "Greater Addis", region: "Greater Addis", popularDepots: "Sand dispatch yards, hollow blocks" },
  { id: "sululta", name: "Sululta Industrial Hub", subCity: "Greater Addis", region: "Greater Addis", popularDepots: "Quarries, concrete batching plants" },

  // Regional Industrial Hubs
  { id: "adama", name: "Adama (Nazret)", subCity: "Oromia", region: "Regional", popularDepots: "Steel rolling mills, express route logistics" },
  { id: "bishoftu", name: "Bishoftu (Debre Zeit)", subCity: "Oromia", region: "Regional", popularDepots: "Agro-industrial, cement distribution" },
  { id: "hawassa", name: "Hawassa Industrial Hub", subCity: "Sidama", region: "Regional", popularDepots: "Southern construction hub" },
  { id: "bahir-dar", name: "Bahir Dar Industrial Hub", subCity: "Amhara", region: "Regional", popularDepots: "Northern regional depot" },
  { id: "dire-dawa", name: "Dire Dawa Free Trade Zone", subCity: "Dire Dawa", region: "Regional", popularDepots: "National cement factory, port corridor" },
] as const;

/**
 * Returns formatted location string e.g. "Addis Ababa, Jemo"
 */
export function formatLocationZone(zoneId: string, customLandmark?: string): string {
  const zone = STANDARD_LOCATION_ZONES.find((z) => z.id === zoneId);
  const base = zone ? `${zone.region}, ${zone.name}` : zoneId;
  if (customLandmark && customLandmark.trim()) {
    return `${base} (${customLandmark.trim()})`;
  }
  return base;
}
