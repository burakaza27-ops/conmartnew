// =============================================================================
// ConMart — Canonical Coverage Areas
// =============================================================================
// Single source of truth for agent signup and depot routing. Seed, registration,
// and the matcher all read this list so a missing seed cannot leave agents with
// three neighbourhoods and nowhere to register.
//
// priority 2 = neighbourhood / depot (beats the surrounding sub-city)
// priority 1 = city or sub-city
// priority 0 = catch-all (last resort only)
// =============================================================================

export type CoverageRegion =
  | "Addis Ababa"
  | "Greater Addis"
  | "Oromia"
  | "Amhara"
  | "Sidama"
  | "Tigray"
  | "Dire Dawa"
  | "Harari"
  | "Somali"
  | "Afar"
  | "South Ethiopia"
  | "Central Ethiopia"
  | "Gambela"
  | "Benishangul-Gumuz"
  | "Ethiopia";

export interface CoverageAreaDefinition {
  slug: string;
  name: string;
  region: CoverageRegion;
  aliases: readonly string[];
  /** Higher wins when two aliases hit the same address. */
  priority: 0 | 1 | 2;
  sortOrder: number;
  districtId: string;
}

function area(
  slug: string,
  name: string,
  region: CoverageRegion,
  aliases: readonly string[],
  priority: 0 | 1 | 2,
  sortOrder: number,
  districtId = slug
): CoverageAreaDefinition {
  return { slug, name, region, aliases, priority, sortOrder, districtId };
}

export const COVERAGE_AREAS: readonly CoverageAreaDefinition[] = [
  // --- Addis Ababa neighbourhoods (more specific than the city catch-all) ---
  area("koye-feche", "Koye Feche", "Addis Ababa", ["koye feche", "koyefeche", "koye"], 2, 10, "lemi-kura"),
  area("merkato", "Merkato", "Addis Ababa", ["merkato", "merqato", "gullit"], 2, 20, "addis-ketema"),
  area("kaliti", "Akaki Kaliti", "Addis Ababa", ["kaliti", "kality", "akaki", "akaki kaliti", "akaki kality"], 2, 30, "akaki-kaliti"),
  area("bole", "Bole", "Addis Ababa", ["bole", "bole airport", "bole medhanialem", "gerji", "rwanda", "atlas"], 2, 40, "bole"),
  area("kirkos", "Kirkos", "Addis Ababa", ["kirkos", "kazanchis", "mexico", "meskel square"], 1, 50, "kirkos"),
  area("yeka", "Yeka", "Addis Ababa", ["yeka", "cmc", "ayat", "megenagna", "gurd shola", "summit"], 1, 60, "yeka"),
  area("arada", "Arada", "Addis Ababa", ["arada", "piassa", "piazza", "4 kilo", "6 kilo", "sidist kilo"], 1, 70, "arada"),
  area("addis-ketema", "Addis Ketema", "Addis Ababa", ["addis ketema"], 1, 80, "addis-ketema"),
  area("lideta", "Lideta", "Addis Ababa", ["lideta", "mexico square"], 1, 90, "lideta"),
  area("gulele", "Gulele", "Addis Ababa", ["gulele", "shiromeda", "entoto"], 1, 100, "gulele"),
  area("kolfe-keranio", "Kolfe Keranio", "Addis Ababa", ["kolfe", "kolfe keranio", "asko", "ayertena"], 1, 110, "kolfe-keranio"),
  area("nifas-silk-lafto", "Nifas Silk-Lafto", "Addis Ababa", ["nifas silk", "lafto", "jemo", "mekato"], 1, 120, "nifas-silk-lafto"),
  area("lemi-kura", "Lemi Kura", "Addis Ababa", ["lemi kura", "lemikura"], 1, 130, "lemi-kura"),

  // --- Greater Addis / Sheger ---
  area("sululta", "Sululta", "Greater Addis", ["sululta"], 1, 200),
  area("burayu", "Burayu", "Greater Addis", ["burayu", "burayu town"], 1, 210),
  area("sebeta", "Sebeta", "Greater Addis", ["sebeta", "sebeta hawas"], 1, 220),
  area("gelan", "Gelan", "Greater Addis", ["gelan", "gelan town"], 1, 230),
  area("dukem", "Dukem", "Greater Addis", ["dukem"], 1, 240),
  area("legetafo", "Legetafo", "Greater Addis", ["legetafo", "legetafo legedadi"], 1, 250),
  area("sendafa", "Sendafa", "Greater Addis", ["sendafa"], 1, 260),
  area("holeta", "Holeta", "Greater Addis", ["holeta", "holleta"], 1, 270),

  // --- Regional cities ---
  area("adama", "Adama", "Oromia", ["adama", "nazret", "nazareth"], 1, 300),
  area("bishoftu", "Bishoftu", "Oromia", ["bishoftu", "debre zeit", "debrezeit"], 1, 310),
  area("jimma", "Jimma", "Oromia", ["jimma", "jima"], 1, 320),
  area("shashemene", "Shashemene", "Oromia", ["shashemene", "shashamane"], 1, 330),
  area("asela", "Asela", "Oromia", ["asela", "assela"], 1, 340),
  area("nekemte", "Nekemte", "Oromia", ["nekemte", "leqemt"], 1, 350),
  area("ambo", "Ambo", "Oromia", ["ambo"], 1, 360),
  area("hawassa", "Hawassa", "Sidama", ["hawassa", "awassa", "awasa"], 1, 400),
  area("dilla", "Dilla", "South Ethiopia", ["dilla"], 1, 410),
  area("arba-minch", "Arba Minch", "South Ethiopia", ["arba minch", "arbaminch"], 1, 420),
  area("wolaita-sodo", "Wolaita Sodo", "South Ethiopia", ["wolaita sodo", "sodo", "wolayta sodo"], 1, 430),
  area("hosanna", "Hosanna", "Central Ethiopia", ["hosanna", "hossana", "hossanna"], 1, 440),
  area("bahir-dar", "Bahir Dar", "Amhara", ["bahir dar", "bahirdar", "bahir dar industrial"], 1, 500),
  area("gondar", "Gondar", "Amhara", ["gondar", "gonder"], 1, 510),
  area("dessie", "Dessie", "Amhara", ["dessie", "desie"], 1, 520),
  area("kombolcha", "Kombolcha", "Amhara", ["kombolcha"], 1, 530),
  area("debre-birhan", "Debre Birhan", "Amhara", ["debre birhan", "debre berhan", "debrebirhan"], 1, 540),
  area("debre-markos", "Debre Markos", "Amhara", ["debre markos", "debremarkos"], 1, 550),
  area("woldia", "Woldia", "Amhara", ["woldia", "woldiya"], 1, 560),
  area("mekelle", "Mekelle", "Tigray", ["mekelle", "mekele", "mek'ele"], 1, 600),
  area("dire-dawa", "Dire Dawa", "Dire Dawa", ["dire dawa", "diredawa"], 1, 700),
  area("harar", "Harar", "Harari", ["harar", "harer"], 1, 710),
  area("jijiga", "Jijiga", "Somali", ["jijiga", "jigjiga"], 1, 720),
  area("semera", "Semera", "Afar", ["semera", "samara"], 1, 730),
  area("gambela", "Gambela", "Gambela", ["gambela", "gambella"], 1, 740),
  area("asosa", "Asosa", "Benishangul-Gumuz", ["asosa", "assosa"], 1, 750),

  // --- Catch-alls: never outrank a named neighbourhood or city ---
  area("addis-ababa", "Addis Ababa (city-wide)", "Addis Ababa", ["addis ababa"], 0, 900, "addis-ababa"),
  area("ethiopia", "Ethiopia (nationwide fallback)", "Ethiopia", ["ethiopia"], 0, 999, "ethiopia"),
];

export const COVERAGE_AREA_SLUGS = COVERAGE_AREAS.map((area) => area.slug);

export const NATIONWIDE_FALLBACK_SLUG = "ethiopia";

export function coverageAreaBySlug(
  slug: string
): CoverageAreaDefinition | undefined {
  return COVERAGE_AREAS.find((area) => area.slug === slug);
}

export function isCatchAllCoverage(area: Pick<CoverageAreaDefinition, "priority">): boolean {
  return area.priority === 0;
}

export function registrationLabel(area: Pick<CoverageAreaDefinition, "name" | "priority">): string {
  return isCatchAllCoverage(area) ? `${area.name}` : area.name;
}
