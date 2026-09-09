// =============================================================================
// ConMart — Location → Zone Matching
// =============================================================================
// Listings store a free-text depot address ("Addis Ababa, Merkato Yard").
// Agents register against a Zone. Routing picks the most specific alias hit
// so "Koye Feche, Lemi Kura" lands on Koye Feche rather than a city-wide
// Addis Ababa catch-all.
// =============================================================================

export interface ZoneCandidate {
  id: string;
  name: string;
  slug: string;
  aliases: readonly string[];
  /** Higher beats a longer but coarser alias (city-wide catch-alls should be 0). */
  priority?: number;
  minLat?: number | null;
  minLng?: number | null;
  maxLat?: number | null;
  maxLng?: number | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ZoneMatch {
  zoneId: string;
  score: number;
  matchedAlias: string;
}

const PUNCTUATION = /[^a-z0-9\u1200-\u137F\s]/g;

export function normalizeLocation(value: string): string {
  return value
    .toLowerCase()
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pointInBox(zone: ZoneCandidate, point: GeoPoint): boolean {
  if (
    zone.minLat == null ||
    zone.minLng == null ||
    zone.maxLat == null ||
    zone.maxLng == null
  ) {
    return false;
  }

  return (
    point.lat >= Number(zone.minLat) &&
    point.lat <= Number(zone.maxLat) &&
    point.lng >= Number(zone.minLng) &&
    point.lng <= Number(zone.maxLng)
  );
}

function aliasTokens(zone: ZoneCandidate): string[] {
  const raw = [zone.name, zone.slug.replace(/-/g, " "), ...zone.aliases];
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const item of raw) {
    const normalized = normalizeLocation(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    tokens.push(normalized);
  }

  return tokens.sort((a, b) => b.length - a.length);
}

/**
 * Returns the best zone for a listing location, or null if nothing matches.
 *
 * Scoring: longest alias that appears as a whole-phrase substring of the
 * location wins. A geofence hit, when coordinates are supplied, beats an
 * equally long alias. City-wide aliases are intentionally short so a
 * neighbourhood name outranks them.
 */
export function matchZone(
  location: string,
  zones: readonly ZoneCandidate[],
  point?: GeoPoint | null
): ZoneMatch | null {
  const haystack = normalizeLocation(location);
  if (!haystack && !point) {
    return null;
  }

  let best: ZoneMatch | null = null;

  for (const zone of zones) {
    if (point && pointInBox(zone, point)) {
      const geoScore = 10_000;
      if (!best || geoScore > best.score) {
        best = { zoneId: zone.id, score: geoScore, matchedAlias: zone.name };
      }
      continue;
    }

    if (!haystack) continue;

    for (const alias of aliasTokens(zone)) {
      if (!containsPhrase(haystack, alias)) continue;

      const score = (zone.priority ?? 1) * 1_000 + alias.length;
      if (!best || score > best.score) {
        best = { zoneId: zone.id, score, matchedAlias: alias };
      }
      break;
    }
  }

  return best;
}

/**
 * Production routing: a named neighbourhood or city when possible, otherwise
 * the nationwide catch-all so a free-supplier deal never dies for lack of a
 * mapped depot string.
 */
export function resolveCoverageZone(
  location: string,
  zones: readonly ZoneCandidate[],
  point?: GeoPoint | null
): ZoneMatch | null {
  const match = matchZone(location, zones, point);
  if (match) return match;

  const ethiopia = zones.find((zone) => zone.slug === "ethiopia");
  if (ethiopia) {
    return { zoneId: ethiopia.id, score: 0, matchedAlias: ethiopia.name };
  }

  const catchAll = zones
    .filter((zone) => (zone.priority ?? 1) === 0)
    .sort((a, b) => a.slug.localeCompare(b.slug))[0];

  if (catchAll) {
    return { zoneId: catchAll.id, score: 0, matchedAlias: catchAll.name };
  }

  return zones[0]
    ? { zoneId: zones[0].id, score: 0, matchedAlias: zones[0].name }
    : null;
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (haystack === needle) return true;
  return ` ${haystack} `.includes(` ${needle} `);
}
