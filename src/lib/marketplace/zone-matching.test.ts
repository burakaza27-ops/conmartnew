import { describe, expect, it } from "vitest";

import { matchZone, normalizeLocation } from "@/lib/marketplace/zone-matching";

const zones = [
  {
    id: "zone-addis",
    name: "Addis Ababa",
    slug: "addis-ababa",
    aliases: ["addis", "addis ababa"],
    priority: 0,
  },
  {
    id: "zone-koye",
    name: "Koye Feche",
    slug: "koye-feche",
    aliases: ["koye feche", "koyefeche", "koye", "lemi kura"],
  },
  {
    id: "zone-merkato",
    name: "Merkato",
    slug: "merkato",
    aliases: ["merkato", "addis ketema"],
  },
  {
    id: "zone-kaliti",
    name: "Kaliti",
    slug: "kaliti",
    aliases: ["kaliti", "kality", "akaki"],
    minLat: 8.9,
    minLng: 38.7,
    maxLat: 9.0,
    maxLng: 38.85,
  },
];

describe("matchZone", () => {
  it("routes a Koye Feche depot to the Koye Feche agents, not city-wide Addis", () => {
    const match = matchZone("Koye Feche condominium site, Lemi Kura", zones);
    expect(match?.zoneId).toBe("zone-koye");
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
    expect(matchZone("Addis Ababa", zones)?.zoneId).toBe("zone-addis");
  });

  it("returns null when nothing matches", () => {
    expect(matchZone("Unknown hamlet", zones)).toBeNull();
  });

  it("prefers a bounding-box hit when coordinates are supplied", () => {
    const match = matchZone("unlabelled pin", zones, { lat: 8.95, lng: 38.76 });
    expect(match?.zoneId).toBe("zone-kaliti");
  });

  it("normalizes punctuation and case", () => {
    expect(normalizeLocation("  Koye-Feche,  Site! ")).toBe("koye feche site");
  });
});
