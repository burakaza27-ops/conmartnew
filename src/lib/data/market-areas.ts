// =============================================================================
// ECON — Canonical Ethiopian Market Areas & Commercial Locations Registry
// =============================================================================
// Implements the Yakob Dan Market Area Specification:
// 1. Structured hierarchy: Region -> City/Town -> Market Area / Neighborhood.
// 2. Administrative divisions are kept strictly separate from commercial market names.
// 3. Initial 25 Addis Ababa trading hubs + 6 surrounding towns + 22 regional cities.
// 4. Bilingual English & Amharic names with alternative spellings/aliases.
// 5. "Area not listed? Suggest an area" workflow support.
// =============================================================================

export interface MarketAreaItem {
  id: string;
  nameEn: string;
  nameAm: string;
  cityId: string;
  regionId: string;
  aliases: readonly string[];
  isBoundaryArea?: boolean;
  notes?: string;
  isActive: boolean;
}

export interface CityItem {
  id: string;
  nameEn: string;
  nameAm: string;
  regionId: string;
  aliases: readonly string[];
  isSurroundingTown?: boolean;
}

export interface RegionItem {
  id: string;
  nameEn: string;
  nameAm: string;
}

// -----------------------------------------------------------------------------
// 1. REGIONS
// -----------------------------------------------------------------------------

export const REGIONS: readonly RegionItem[] = [
  { id: "addis-ababa", nameEn: "Addis Ababa", nameAm: "አዲስ አበባ" },
  { id: "oromia-surrounding", nameEn: "Oromia Special Zone (Surrounding Addis)", nameAm: "የፊንፊኔ ዙሪያ ልዩ ዞን" },
  { id: "oromia", nameEn: "Oromia", nameAm: "ኦሮሚያ" },
  { id: "amhara", nameEn: "Amhara", nameAm: "አማራ" },
  { id: "sidama", nameEn: "Sidama", nameAm: "ሲዳማ" },
  { id: "tigray", nameEn: "Tigray", nameAm: "ትግራይ" },
  { id: "dire-dawa", nameEn: "Dire Dawa", nameAm: "ድሬዳዋ" },
  { id: "harari", nameEn: "Harari", nameAm: "ሐረሪ" },
  { id: "south-ethiopia", nameEn: "South Ethiopia", nameAm: "ደቡብ ኢትዮጵያ" },
  { id: "central-ethiopia", nameEn: "Central Ethiopia", nameAm: "ማዕከላዊ ኢትዮጵያ" },
  { id: "somali", nameEn: "Somali", nameAm: "ሶማሌ" },
  { id: "benishangul", nameEn: "Benishangul-Gumuz", nameAm: "ቤንሻንጉል ጉሙዝ" },
  { id: "afar", nameEn: "Afar", nameAm: "አፋር" },
  { id: "gambela", nameEn: "Gambela", nameAm: "ጋምቤላ" },
];

// -----------------------------------------------------------------------------
// 2. CITIES & TOWNS
// -----------------------------------------------------------------------------

export const CITIES: readonly CityItem[] = [
  // Capital
  { id: "addis-ababa", nameEn: "Addis Ababa", nameAm: "አዲስ አበባ", regionId: "addis-ababa", aliases: ["finfinne", "sheger"] },

  // Surrounding towns and localities (Oromia Special Zone)
  { id: "burayu", nameEn: "Burayu", nameAm: "ቡራዩ", regionId: "oromia-surrounding", isSurroundingTown: true, aliases: ["gefersa"] },
  { id: "sululta", nameEn: "Sululta", nameAm: "ሱሉልታ", regionId: "oromia-surrounding", isSurroundingTown: true, aliases: [] },
  { id: "legetafo", nameEn: "Legetafo", nameAm: "ለገጣፎ", regionId: "oromia-surrounding", isSurroundingTown: true, aliases: ["legedadi", "legetafo legedadi"] },
  { id: "gelan", nameEn: "Gelan", nameAm: "ገላን", regionId: "oromia-surrounding", isSurroundingTown: true, aliases: ["gelan dry port"] },
  { id: "sebeta", nameEn: "Sebeta", nameAm: "ሰበታ", regionId: "oromia-surrounding", isSurroundingTown: true, aliases: ["alemgena"] },
  { id: "furi", nameEn: "Furi", nameAm: "ፉሪ", regionId: "oromia-surrounding", isSurroundingTown: true, aliases: ["furi hana"] },
  { id: "dukem", nameEn: "Dukem", nameAm: "ዱከም", regionId: "oromia-surrounding", isSurroundingTown: true, aliases: ["eastern industrial park"] },

  // Other major cities & towns
  { id: "adama", nameEn: "Adama (Nazret)", nameAm: "አዳማ (ናዝሬት)", regionId: "oromia", aliases: ["nazret", "nazareth"] },
  { id: "bishoftu", nameEn: "Bishoftu (Debre Zeit)", nameAm: "ቢሾፍቱ (ደብረ ዘይት)", regionId: "oromia", aliases: ["debre zeit", "debrezeit"] },
  { id: "mojo", nameEn: "Mojo", nameAm: "ሞጆ", regionId: "oromia", aliases: ["modjo", "mojo dry port"] },
  { id: "jimma", nameEn: "Jimma", nameAm: "ጅማ", regionId: "oromia", aliases: [] },
  { id: "nekemte", nameEn: "Nekemte", nameAm: "ነቀምቴ", regionId: "oromia", aliases: ["naqamte"] },
  { id: "asella", nameEn: "Asella", nameAm: "አሰላ", regionId: "oromia", aliases: ["asela"] },
  { id: "shashamane", nameEn: "Shashamane", nameAm: "ሻሸመኔ", regionId: "oromia", aliases: ["shashemene"] },

  { id: "bahir-dar", nameEn: "Bahir Dar", nameAm: "ባሕር ዳር", regionId: "amhara", aliases: ["bahirdar"] },
  { id: "gondar", nameEn: "Gondar", nameAm: "ጎንደር", regionId: "amhara", aliases: ["gonder"] },
  { id: "dessie", nameEn: "Dessie", nameAm: "ደሴ", regionId: "amhara", aliases: ["desie", "kombolcha"] },
  { id: "debre-birhan", nameEn: "Debre Birhan", nameAm: "ደብረ ብርሃን", regionId: "amhara", aliases: ["debre berhan"] },
  { id: "debre-markos", nameEn: "Debre Markos", nameAm: "ደብረ ማርቆስ", regionId: "amhara", aliases: [] },

  { id: "hawassa", nameEn: "Hawassa", nameAm: "ሀዋሳ", regionId: "sidama", aliases: ["awassa", "hawasa"] },
  { id: "dilla", nameEn: "Dilla", nameAm: "ዲላ", regionId: "south-ethiopia", aliases: [] },
  { id: "arba-minch", nameEn: "Arba Minch", nameAm: "አርባ ምንጭ", regionId: "south-ethiopia", aliases: ["arbaminch"] },
  { id: "sodo", nameEn: "Wolaita Sodo", nameAm: "ወላይታ ሶዶ", regionId: "south-ethiopia", aliases: ["sodo"] },
  { id: "hosaena", nameEn: "Hosaena", nameAm: "ሆሳዕና", regionId: "central-ethiopia", aliases: ["hosanna"] },

  { id: "mekelle", nameEn: "Mekelle", nameAm: "መቐለ", regionId: "tigray", aliases: ["mekele"] },
  { id: "dire-dawa", nameEn: "Dire Dawa", nameAm: "ድሬዳዋ", regionId: "dire-dawa", aliases: ["diredawa"] },
  { id: "harar", nameEn: "Harar", nameAm: "ሐረር", regionId: "harari", aliases: [] },
  { id: "jigjiga", nameEn: "Jigjiga", nameAm: "ጅግጅጋ", regionId: "somali", aliases: ["jijiga"] },
];

// -----------------------------------------------------------------------------
// 3. MARKET AREAS (Commercial Neighborhoods)
// -----------------------------------------------------------------------------

export const MARKET_AREAS: MarketAreaItem[] = [
  // --- 1. Initial Addis Ababa Market Areas (25 areas) ---
  {
    id: "merkato",
    nameEn: "Merkato",
    nameAm: "መርካቶ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["mercato", "merqato", "military tera", "sebategna", "bomb tera"],
    isActive: true,
    notes: "Central wholesale trading hub — hardware, sanitary, steel, roofing",
  },
  {
    id: "jemo",
    nameEn: "Jemo",
    nameAm: "ጀሞ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["jemo 1", "jemo 2", "jemo 3", "jemo michael"],
    isActive: true,
    notes: "Major southwest construction materials corridor — rebar, timber, blocks",
  },
  {
    id: "kality",
    nameEn: "Kality",
    nameAm: "ቃሊቲ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["kaliti", "akaki kaliti", "akaki kality", "kality customs"],
    isActive: true,
    notes: "Heavy industrial logistics hub — steel rolling, cement warehousing, transport depots",
  },
  {
    id: "ayat",
    nameEn: "Ayat",
    nameAm: "አያት",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["ayat zone", "ayat real estate", "ayat adebabay"],
    isActive: true,
    notes: "East expansion residential hub — blocks, aggregates, cement",
  },
  {
    id: "summit",
    nameEn: "Summit",
    nameAm: "ሰሚት",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["summit condominium", "summit beverly", "summit 72"],
    isActive: true,
    notes: "Eastern high-density residential development yards",
  },
  {
    id: "megenagna",
    nameEn: "Megenagna",
    nameAm: "መገናኛ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["megenaña", "megenagna adebabay", "zefmesh"],
    isActive: true,
    notes: "Central eastern transport junction and finishing materials stores",
  },
  {
    id: "urael",
    nameEn: "Urael",
    nameAm: "ኡራኤል",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["urael church", "bambis", "atlas", "olympia"],
    isActive: true,
    notes: "Central commercial corridor — finishing tiles, MEP, sanitary ware",
  },
  {
    id: "mexico",
    nameEn: "Mexico",
    nameAm: "ሜክሲኮ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["mexico square", "kirkos", "kera", "goma kuteba"],
    isActive: true,
    notes: "Commercial building district — tools, safety gear, electricals",
  },
  {
    id: "piyassa",
    nameEn: "Piyassa",
    nameAm: "ፒያሳ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["piassa", "piazza", "arada", "de Gaulle"],
    isActive: true,
    notes: "Historic renewal zone — architectural fixtures, glass, paint",
  },
  {
    id: "ayertena",
    nameEn: "Ayertena",
    nameAm: "አየር ጤና",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["ayer tena", "ayertena adebabay"],
    isActive: true,
    notes: "West gate construction dispatch and retail depots",
  },
  {
    id: "betel",
    nameEn: "Betel",
    nameAm: "ቤቴል",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["bethel", "betel hospital", "kolfe betel"],
    isActive: true,
    notes: "Western residential growth yards — stone, gravel, masonry",
  },
  {
    id: "alem-bank",
    nameEn: "Alem Bank",
    nameAm: "ዓለም ባንክ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["alembank", "alem bank round"],
    isActive: true,
    notes: "West exit transit corridor for aggregates and heavy supply",
  },
  {
    id: "tulu-dimtu",
    nameEn: "Tulu Dimtu",
    nameAm: "ቱሉ ዲምቱ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["tulu dimtu expressway", "tulu dimtu interchange"],
    isActive: true,
    notes: "Expressway junction & southern megaproject yards",
  },
  {
    id: "koye-feche",
    nameEn: "Koye Feche",
    nameAm: "ኮዬ ፈጬ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["koyefeche", "koye feche condominium", "koye"],
    isBoundaryArea: true,
    isActive: true,
    notes: "Administrative boundary between Addis Ababa and Oromia Special Zone. Major mega-housing and blocks hub",
  },
  {
    id: "ashewa-meda",
    nameEn: "Ashewa Meda",
    nameAm: "አሸዋ ሜዳ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["ashewa meda sand", "burayu border"],
    isBoundaryArea: true,
    isActive: true,
    notes: "Administrative boundary along western Burayu corridor. Primary river sand & basalt aggregate transit market",
  },
  {
    id: "addisu-gebeya",
    nameEn: "Addisu Gebeya",
    nameAm: "አዲሱ ገበያ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["addisu gebeya round", "gulele gebeya"],
    isActive: true,
    notes: "North Addis hub — eucalyptus poles, masonry stone, roofing",
  },
  {
    id: "saris",
    nameEn: "Saris",
    nameAm: "ሳሪስ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["saris abo", "saris doro manekia", "gotera"],
    isActive: true,
    notes: "Industrial warehouse corridor — steel fabrication, pipes",
  },
  {
    id: "bole",
    nameEn: "Bole",
    nameAm: "ቦሌ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["bole medhanialem", "bole airport", "rwanda", "brass"],
    isActive: true,
    notes: "High-end commercial & finishing materials showrooms",
  },
  {
    id: "gerji",
    nameEn: "Gerji",
    nameAm: "ገርጂ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["gerji imperial", "gerji jackros", "gerji mebrat hail"],
    isActive: true,
    notes: "Aluminum, glass, finishing ceramics, and contractor depot yards",
  },
  {
    id: "gurd-shola",
    nameEn: "Gurd Shola",
    nameAm: "ጉርድ ሾላ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["gurdshola", "athletics federation"],
    isActive: true,
    notes: "Eastern warehouse district — cement distribution, gypsum, boards",
  },
  {
    id: "cmc",
    nameEn: "CMC",
    nameAm: "ሲኤምሲ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["cmc michael", "cmc round", "sunshine cmc"],
    isActive: true,
    notes: "Residential expansion spine — premium finishing materials",
  },
  {
    id: "kotebe",
    nameEn: "Kotebe",
    nameAm: "ኮተቤ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["kotebe 02", "karalo", "hana mariam"],
    isActive: true,
    notes: "Metalworks, HCB yards, stone depots",
  },
  {
    id: "shola",
    nameEn: "Shola",
    nameAm: "ሾላ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["shola gebeya", "shola market"],
    isActive: true,
    notes: "Active local market — timber, doors, ironmongery",
  },
  {
    id: "tor-hailoch",
    nameEn: "Tor Hailoch",
    nameAm: "ጦር ኃይሎች",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["torhayloch", "total torhailoch"],
    isActive: true,
    notes: "Western distribution point for building hardware & electricals",
  },
  {
    id: "lideta",
    nameEn: "Lideta",
    nameAm: "ልደታ",
    cityId: "addis-ababa",
    regionId: "addis-ababa",
    aliases: ["lideta condonimium", "balcha", "abinet"],
    isActive: true,
    notes: "Central urban renewal corridor — tile & sanitary retail cluster",
  },

  // --- 2. Surrounding Towns & Localities ---
  {
    id: "burayu-center",
    nameEn: "Burayu Center",
    nameAm: "ቡራዩ መሃል",
    cityId: "burayu",
    regionId: "oromia-surrounding",
    aliases: ["burayu", "gefersa quarry"],
    isActive: true,
    notes: "Basalt quarries, stone crushers, sand delivery staging",
  },
  {
    id: "sululta-hub",
    nameEn: "Sululta Industrial Hub",
    nameAm: "ሱሉልታ ኢንዱስትሪ",
    cityId: "sululta",
    regionId: "oromia-surrounding",
    aliases: ["sululta", "sululta quarry"],
    isActive: true,
    notes: "Quarries, concrete batching plants, precast yards",
  },
  {
    id: "legetafo-center",
    nameEn: "Legetafo Center",
    nameAm: "ለገጣፎ መሃል",
    cityId: "legetafo",
    regionId: "oromia-surrounding",
    aliases: ["legetafo", "legedadi sand yard"],
    isActive: true,
    notes: "Sand dispatch yards, HCB block production",
  },
  {
    id: "gelan-dry-port",
    nameEn: "Gelan Logistics Zone",
    nameAm: "ገላን ሎጂስቲክስ ዞን",
    cityId: "gelan",
    regionId: "oromia-surrounding",
    aliases: ["gelan", "gelan dry port", "gelan terminal"],
    isActive: true,
    notes: "Heavy freight terminal, steel rolling mills, major cement depot",
  },
  {
    id: "sebeta-industrial",
    nameEn: "Sebeta Industrial Area",
    nameAm: "ሰበታ ኢንዱስትሪ",
    cityId: "sebeta",
    regionId: "oromia-surrounding",
    aliases: ["sebeta", "alemgena industrial"],
    isActive: true,
    notes: "Steel mills, PVC/HDPE pipe factories, wire and nails",
  },
  {
    id: "furi-station",
    nameEn: "Furi Railway / Depot Area",
    nameAm: "ፉሪ ባቡር ጣቢያ አካባቢ",
    cityId: "furi",
    regionId: "oromia-surrounding",
    aliases: ["furi", "furi hana"],
    isActive: true,
    notes: "Railway freight offloading and bulk aggregates",
  },
  {
    id: "dukem-park",
    nameEn: "Dukem Eastern Industrial Park",
    nameAm: "ዱከም ምስራቅ ኢንዱስትሪ ፓርክ",
    cityId: "dukem",
    regionId: "oromia-surrounding",
    aliases: ["dukem", "eastern industrial park"],
    isActive: true,
    notes: "Ceramic tile manufacturers, gypsum board factories",
  },

  // --- 3. Major Regional Cities & Towns (Representative central areas) ---
  {
    id: "adama-mebrathail",
    nameEn: "Adama Mebrat Hail",
    nameAm: "አዳማ መብራት ኃይል",
    cityId: "adama",
    regionId: "oromia",
    aliases: ["adama", "nazret", "adama posta"],
    isActive: true,
    notes: "Oromia transit corridor — steel and cement wholesale",
  },
  {
    id: "bishoftu-center",
    nameEn: "Bishoftu Town Center",
    nameAm: "ቢሾፍቱ መሃል",
    cityId: "bishoftu",
    regionId: "oromia",
    aliases: ["bishoftu", "debre zeit"],
    isActive: true,
    notes: "Agro-industrial & building material distribution",
  },
  {
    id: "mojo-dry-port",
    nameEn: "Mojo Dry Port Corridor",
    nameAm: "ሞጆ ደረቅ ወደብ",
    cityId: "mojo",
    regionId: "oromia",
    aliases: ["mojo", "modjo"],
    isActive: true,
    notes: "National container freight terminal for imported steel & tiles",
  },
  {
    id: "hawassa-piazza",
    nameEn: "Hawassa Piazza & Industrial Park",
    nameAm: "ሀዋሳ ፒያሳ እና ፓርክ",
    cityId: "hawassa",
    regionId: "sidama",
    aliases: ["hawassa", "awassa", "hawassa menhariya"],
    isActive: true,
    notes: "Southern region major construction hub",
  },
  {
    id: "bahir-dar-kebele-4",
    nameEn: "Bahir Dar Commercial Center",
    nameAm: "ባሕር ዳር የንግድ ማዕከል",
    cityId: "bahir-dar",
    regionId: "amhara",
    aliases: ["bahir dar", "bahirdar"],
    isActive: true,
    notes: "Northern region hub — timber, cement, rebar",
  },
  {
    id: "dire-dawa-taiwan",
    nameEn: "Dire Dawa Taiwan Market",
    nameAm: "ድሬዳዋ ታይዋን ገበያ",
    cityId: "dire-dawa",
    regionId: "dire-dawa",
    aliases: ["dire dawa", "diredawa"],
    isActive: true,
    notes: "Eastern trade gateway & national cement distribution",
  },
  {
    id: "mekelle-central",
    nameEn: "Mekelle City Center",
    nameAm: "መቐለ ከተማ ማዕከል",
    cityId: "mekelle",
    regionId: "tigray",
    aliases: ["mekelle", "mekele"],
    isActive: true,
    notes: "Messebo cement distribution and regional steel yards",
  },
  {
    id: "jimma-center",
    nameEn: "Jimma Center",
    nameAm: "ጅማ መሃል",
    cityId: "jimma",
    regionId: "oromia",
    aliases: ["jimma"],
    isActive: true,
    notes: "Southwest construction materials gateway",
  },
  {
    id: "gondar-arada",
    nameEn: "Gondar Arada",
    nameAm: "ጎንደር አራዳ",
    cityId: "gondar",
    regionId: "amhara",
    aliases: ["gondar", "gonder"],
    isActive: true,
    notes: "Northwestern construction trade center",
  },
  {
    id: "debre-birhan-park",
    nameEn: "Debre Birhan Industrial Zone",
    nameAm: "ደብረ ብርሃን ኢንዱስትሪ ዞን",
    cityId: "debre-birhan",
    regionId: "amhara",
    aliases: ["debre birhan"],
    isActive: true,
    notes: "Manufacturing expansion corridor",
  },
  {
    id: "shashamane-center",
    nameEn: "Shashamane Hub",
    nameAm: "ሻሸመኔ መሃል",
    cityId: "shashamane",
    regionId: "oromia",
    aliases: ["shashamane"],
    isActive: true,
    notes: "Crossroads wholesale transit depot",
  },
  {
    id: "harar-center",
    nameEn: "Harar Jugol & Gate",
    nameAm: "ሐረር ጁጎል",
    cityId: "harar",
    regionId: "harari",
    aliases: ["harar"],
    isActive: true,
    notes: "Historic eastern trade center",
  },
  {
    id: "jigjiga-center",
    nameEn: "Jigjiga Center",
    nameAm: "ጅግጅጋ መሃል",
    cityId: "jigjiga",
    regionId: "somali",
    aliases: ["jigjiga", "jijiga"],
    isActive: true,
    notes: "Somali regional trading center",
  },
];

// -----------------------------------------------------------------------------
// DYNAMIC SUGGESTED AREAS (In-memory registry with admin-approval status)
// -----------------------------------------------------------------------------

export interface SuggestedMarketArea {
  id: string;
  nameEn: string;
  nameAm?: string;
  cityId: string;
  suggestedByUserId?: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export const SUGGESTED_AREAS: SuggestedMarketArea[] = [];

// -----------------------------------------------------------------------------
// HELPER QUERY FUNCTIONS
// -----------------------------------------------------------------------------

export function getMarketAreasForCity(cityId: string): MarketAreaItem[] {
  return MARKET_AREAS.filter((a) => a.cityId === cityId && a.isActive);
}

export function getCitiesForRegion(regionId: string): CityItem[] {
  return CITIES.filter((c) => c.regionId === regionId);
}

export function getMarketAreaById(id: string): MarketAreaItem | undefined {
  return MARKET_AREAS.find((a) => a.id === id);
}

export function getCityById(id: string): CityItem | undefined {
  return CITIES.find((c) => c.id === id);
}

/**
 * Searches across English and Amharic names, aliases, and alternative spellings.
 */
export function searchMarketAreas(
  query: string,
  filterCityId?: string
): MarketAreaItem[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) {
    return filterCityId ? getMarketAreasForCity(filterCityId) : MARKET_AREAS;
  }

  return MARKET_AREAS.filter((area) => {
    if (filterCityId && area.cityId !== filterCityId) return false;
    const matchEn = area.nameEn.toLowerCase().includes(cleanQ);
    const matchAm = area.nameAm.includes(cleanQ);
    const matchAlias = area.aliases.some((al) => al.toLowerCase().includes(cleanQ));
    return matchEn || matchAm || matchAlias;
  });
}

/**
 * Formats a structured location string for storage in Listing.location:
 * "${cityName}, ${marketAreaName}${landmark ? ` (${landmark})` : ''}"
 *
 * This ensures 100% backward compatibility with existing code and queries,
 * while allowing instant extraction of the pure market area!
 */
export function formatStoredLocation(params: {
  cityId: string;
  marketAreaId: string;
  customMarketAreaName?: string;
  landmark?: string;
  branchName?: string;
}): string {
  const city = getCityById(params.cityId);
  const cityName = city ? city.nameEn : params.cityId;

  const area = getMarketAreaById(params.marketAreaId);
  const marketAreaName = area
    ? area.nameEn
    : params.customMarketAreaName?.trim() || params.marketAreaId;

  const base = `${cityName}, ${marketAreaName}`;
  const landmarkPart = params.landmark?.trim() ? ` (${params.landmark.trim()})` : "";
  const full = `${base}${landmarkPart}`;

  if (params.branchName?.trim()) {
    return `${params.branchName.trim()} — ${full}`;
  }
  return full;
}

/**
 * Extracts clean, recognizable market area name(s) for the buyer-facing card.
 * (e.g. "Main Yard — Addis Ababa, Jemo (Near total)" -> "Jemo")
 * (e.g. "Addis Ababa, Merkato" -> "Merkato")
 */
export function extractMarketAreaFromLocation(locationString: string): string {
  if (!locationString || !locationString.trim()) {
    return "Addis Ababa";
  }

  // Strip branch prefix: "Branch 1 — Addis Ababa, Jemo" -> "Addis Ababa, Jemo"
  let clean = locationString;
  if (clean.includes("—")) {
    const parts = clean.split("—");
    clean = parts[parts.length - 1].trim();
  }

  // Strip landmark parentheses: "Addis Ababa, Jemo (Near Total)" -> "Addis Ababa, Jemo"
  clean = clean.replace(/\(.*?\)/g, "").trim();

  // If formatted as "City, Area": check exact match on the area part first
  if (clean.includes(",")) {
    const parts = clean.split(",");
    const areaCandidate = parts[parts.length - 1].trim();
    const exactMatch = MARKET_AREAS.find(
      (a) =>
        a.nameEn.toLowerCase() === areaCandidate.toLowerCase() ||
        (a.nameAm && a.nameAm === areaCandidate)
    );
    if (exactMatch) {
      return exactMatch.nameEn;
    }
  }

  // Check official English and Amharic names sorted by length descending
  const cleanLower = clean.toLowerCase();
  const sortedByLength = [...MARKET_AREAS].sort(
    (a, b) => b.nameEn.length - a.nameEn.length
  );

  for (const area of sortedByLength) {
    if (cleanLower.includes(area.nameEn.toLowerCase())) {
      return area.nameEn;
    }
    if (area.nameAm && clean.includes(area.nameAm)) {
      return area.nameEn;
    }
  }

  // Check aliases sorted by length
  for (const area of sortedByLength) {
    for (const alias of area.aliases) {
      if (cleanLower.includes(alias.toLowerCase())) {
        return area.nameEn;
      }
    }
  }

  // If contains a comma "City, Area": return Area
  if (clean.includes(",")) {
    const parts = clean.split(",");
    const areaPart = parts[parts.length - 1].trim();
    if (areaPart.length > 1) {
      return areaPart;
    }
  }

  return clean;
}
