import { describe, expect, it } from "vitest";
import {
  REGIONS,
  CITIES,
  MARKET_AREAS,
  getMarketAreasForCity,
  getCitiesForRegion,
  getMarketAreaById,
  getCityById,
  searchMarketAreas,
  formatStoredLocation,
  extractMarketAreaFromLocation,
} from "./market-areas";

describe("Ethiopian Market Areas Specification", () => {
  const EXPECTED_25_ADDIS_AREAS = [
    "Merkato",
    "Jemo",
    "Kality",
    "Ayat",
    "Summit",
    "Megenagna",
    "Urael",
    "Mexico",
    "Piyassa",
    "Ayertena",
    "Betel",
    "Alem Bank",
    "Tulu Dimtu",
    "Koye Feche",
    "Ashewa Meda",
    "Addisu Gebeya",
    "Saris",
    "Bole",
    "Gerji",
    "Gurd Shola",
    "CMC",
    "Kotebe",
    "Shola",
    "Tor Hailoch",
    "Lideta",
  ];

  it("contains all 25 required initial Addis Ababa market areas", () => {
    const addisAreas = getMarketAreasForCity("addis-ababa");
    expect(addisAreas.length).toBe(25);

    const areaNamesEn = addisAreas.map((a) => a.nameEn);
    for (const expected of EXPECTED_25_ADDIS_AREAS) {
      expect(areaNamesEn).toContain(expected);
    }
  });

  it("designates Koye Feche and Ashewa Meda as boundary areas", () => {
    const koye = getMarketAreaById("koye-feche");
    expect(koye).toBeDefined();
    expect(koye?.isBoundaryArea).toBe(true);
    expect(koye?.notes).toContain("boundary");

    const ashewa = getMarketAreaById("ashewa-meda");
    expect(ashewa).toBeDefined();
    expect(ashewa?.isBoundaryArea).toBe(true);
    expect(ashewa?.notes).toContain("boundary");
  });

  it("contains all surrounding towns in the Oromia Special Zone", () => {
    const surrounding = CITIES.filter((c) => c.isSurroundingTown);
    const names = surrounding.map((c) => c.nameEn);

    expect(names).toContain("Burayu");
    expect(names).toContain("Sululta");
    expect(names).toContain("Legetafo");
    expect(names).toContain("Gelan");
    expect(names).toContain("Sebeta");
    expect(names).toContain("Furi");
    expect(names).toContain("Dukem");
  });

  it("contains major regional cities and towns", () => {
    const allCityNames = CITIES.map((c) => c.nameEn.toLowerCase());
    const expectedCities = [
      "bahir dar",
      "hawassa",
      "mekelle",
      "dessie",
      "jimma",
      "arba minch",
      "adama (nazret)",
      "bishoftu (debre zeit)",
      "mojo",
      "dire dawa",
      "harar",
      "gondar",
      "debre birhan",
      "debre markos",
      "shashamane",
      "hosaena",
      "wolaita sodo",
      "dilla",
      "nekemte",
      "asella",
      "jigjiga",
    ];

    for (const city of expectedCities) {
      expect(allCityNames).toContain(city);
    }
  });

  it("provides bilingual English and Amharic names for all regions", () => {
    expect(REGIONS.length).toBeGreaterThanOrEqual(14);
    for (const region of REGIONS) {
      expect(region.nameEn).toBeTruthy();
      expect(region.nameAm).toBeTruthy();
    }
  });

  it("searches market areas across English, Amharic, and aliases", () => {
    // English search
    const jemoResults = searchMarketAreas("jemo");
    expect(jemoResults.some((a) => a.id === "jemo")).toBe(true);

    // Amharic search
    const merkatoAmharic = searchMarketAreas("መርካቶ");
    expect(merkatoAmharic.some((a) => a.id === "merkato")).toBe(true);

    // Alias search ("piassa" -> Piyassa)
    const piassaAlias = searchMarketAreas("piassa");
    expect(piassaAlias.some((a) => a.id === "piyassa")).toBe(true);

    // Scoped search by city
    const scopedAddis = searchMarketAreas("bole", "addis-ababa");
    expect(scopedAddis.every((a) => a.cityId === "addis-ababa")).toBe(true);
  });

  it("formats structured locations with optional landmarks and branches", () => {
    // Basic city + area
    const loc1 = formatStoredLocation({
      cityId: "addis-ababa",
      marketAreaId: "jemo",
    });
    expect(loc1).toBe("Addis Ababa, Jemo");

    // With landmark
    const loc2 = formatStoredLocation({
      cityId: "addis-ababa",
      marketAreaId: "jemo",
      landmark: "Near Total Station",
    });
    expect(loc2).toBe("Addis Ababa, Jemo (Near Total Station)");

    // With branch name prefix
    const loc3 = formatStoredLocation({
      cityId: "addis-ababa",
      marketAreaId: "merkato",
      branchName: "Main Depot",
    });
    expect(loc3).toBe("Main Depot — Addis Ababa, Merkato");

    // With custom suggested area
    const loc4 = formatStoredLocation({
      cityId: "addis-ababa",
      marketAreaId: "custom-id",
      customMarketAreaName: "Summit 72",
      landmark: "Gate 2",
    });
    expect(loc4).toBe("Addis Ababa, Summit 72 (Gate 2)");
  });

  it("extracts clean market area from both structured and legacy location strings", () => {
    expect(extractMarketAreaFromLocation("Addis Ababa, Jemo")).toBe("Jemo");
    expect(extractMarketAreaFromLocation("Main Yard — Addis Ababa, Merkato (Near Bomb Tera)")).toBe("Merkato");
    expect(extractMarketAreaFromLocation("Branch 1 — Addis Ababa, Kality Industrial Zone")).toBe("Kality");
    expect(extractMarketAreaFromLocation("Addis Ababa, Koye Feche")).toBe("Koye Feche");
    expect(extractMarketAreaFromLocation("Addis Ababa, Ashewa Meda")).toBe("Ashewa Meda");
    expect(extractMarketAreaFromLocation("Burayu, Burayu Center")).toBe("Burayu Center");
    expect(extractMarketAreaFromLocation("Hawassa, Hawassa Piazza & Industrial Park")).toBe("Hawassa Piazza & Industrial Park");
    expect(extractMarketAreaFromLocation("")).toBe("Addis Ababa");
  });
});
