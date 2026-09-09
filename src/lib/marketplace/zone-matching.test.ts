import { describe, expect, it } from "vitest";

import {
  COVERAGE_AREAS,
  coverageAreaBySlug,
  isCatchAllCoverage,
  NATIONWIDE_FALLBACK_SLUG,
  registrationLabel,
} from "@/lib/marketplace/coverage-areas";
import {
  matchZone,
  normalizeLocation,
  resolveCoverageZone,
  type ZoneCandidate,
} from "@/lib/marketplace/zone-matching";

const zones: ZoneCandidate[] = COVERAGE_AREAS.map((area) => ({
  id: `zone-${area.slug}`,
  name: area.name,
  slug: area.slug,
  aliases: area.aliases,
  priority: area.priority,
}));

describe("coverage catalog", () => {
  it("has unique slugs and enough areas for national agent signup", () => {
    const slugs = COVERAGE_AREAS.map((area) => area.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(COVERAGE_AREAS.length).toBeGreaterThanOrEqual(40);
    const fallback = coverageAreaBySlug(NATIONWIDE_FALLBACK_SLUG);
    expect(fallback?.priority).toBe(0);
    expect(isCatchAllCoverage(fallback!)).toBe(true);
    expect(registrationLabel(fallback!)).toContain("Ethiopia");
    expect(isCatchAllCoverage({ priority: 2 })).toBe(false);
    expect(registrationLabel({ name: "Bole", priority: 2 })).toBe("Bole");
  });
});

describe("matchZone", () => {
  it("routes a Koye Feche depot to Koye Feche, not Lemi Kura or city-wide Addis", () => {
    const match = matchZone("Koye Feche condominium site, Lemi Kura", zones);
    expect(match?.zoneId).toBe("zone-koye-feche");
  });

  it("matches Merkato even when the string also says Addis Ababa", () => {
    const match = matchZone("Addis Ababa, Merkato Yard", zones);
    expect(match?.zoneId).toBe("zone-merkato");
  });

  it("matches Kaliti / Akaki aliases", () => {
    expect(matchZone("Addis Ababa, Kaliti Steel Depot", zones)?.zoneId).toBe(
      "zone-kaliti"
    );
    expect(matchZone("Akaki Metal yard", zones)?.zoneId).toBe("zone-kaliti");
  });

  it("falls back to the city-wide zone when no neighbourhood is named", () => {
    expect(matchZone("Addis Ababa", zones)?.zoneId).toBe("zone-addis-ababa");
  });

  it("returns null when nothing matches", () => {
    expect(matchZone("Unknown hamlet", zones)).toBeNull();
  });

  it("prefers a bounding-box hit when coordinates are supplied", () => {
    const boxed: ZoneCandidate[] = [
      ...zones,
      {
        id: "zone-boxed-kaliti",
        name: "Kaliti box",
        slug: "boxed-kaliti",
        aliases: [],
        priority: 2,
        minLat: 8.9,
        minLng: 38.7,
        maxLat: 9.0,
        maxLng: 38.85,
      },
    ];
    const match = matchZone("unlabelled pin", boxed, { lat: 8.95, lng: 38.76 });
    expect(match?.zoneId).toBe("zone-boxed-kaliti");
  });

  it("normalizes punctuation and case", () => {
    expect(normalizeLocation("  Koye-Feche,  Site! ")).toBe("koye feche site");
  });

  it.each([
    ["Adama (Nazret) Logistics Hub", "zone-adama"],
    ["Bahir Dar, Industrial Zone", "zone-bahir-dar"],
    ["Sululta, Oromia Quarry Site", "zone-sululta"],
    ["Dire Dawa, Block Factory Depot", "zone-dire-dawa"],
    ["Hawassa, SNNPR Warehouse", "zone-hawassa"],
    ["Bole Medhanialem depot", "zone-bole"],
    ["Yeka CMC warehouse", "zone-yeka"],
    ["Jimma timber yard", "zone-jimma"],
  ])("routes %s to %s", (location, zoneId) => {
    expect(matchZone(location, zones)?.zoneId).toBe(zoneId);
  });
});

describe("resolveCoverageZone", () => {
  it("never drops an unmapped depot when the nationwide fallback exists", () => {
    const match = resolveCoverageZone("Unknown hamlet outside any alias", zones);
    expect(match?.zoneId).toBe(`zone-${NATIONWIDE_FALLBACK_SLUG}`);
  });

  it("still prefers a named city over the nationwide fallback", () => {
    expect(resolveCoverageZone("Mekelle steel depot", zones)?.zoneId).toBe(
      "zone-mekelle"
    );
  });
});
