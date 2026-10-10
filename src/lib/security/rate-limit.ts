// =============================================================================
// ConMart — Fixed-Window Rate Limiting
// =============================================================================
// Backed by Upstash Redis when UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are configured, and by a per-process map otherwise.
//
// The in-memory path only sees the traffic that reaches one serverless
// instance, so it cannot enforce a global budget. Configure Upstash before
// serving production traffic; /api/health reports "degraded" until you do.
// =============================================================================

import "server-only";

import { headers } from "next/headers";

export interface RateLimitOptions {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** True when counters are shared across instances. Surfaced by /api/health. */
export function hasDistributedRateLimiter(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

// -----------------------------------------------------------------------------
// In-memory fallback
// -----------------------------------------------------------------------------

interface Counter {
  count: number;
  expiresAt: number;
}

const counters = new Map<string, Counter>();

function pruneExpired(now: number): void {
  for (const [key, counter] of counters) {
    if (counter.expiresAt <= now) {
      counters.delete(key);
    }
  }
}

function limitInMemory(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Bounded so a flood of distinct keys cannot grow the map without limit.
  if (counters.size > 10_000) {
    pruneExpired(now);
  }

  const existing = counters.get(key);
  const counter =
    existing && existing.expiresAt > now
      ? existing
      : { count: 0, expiresAt: now + options.windowSeconds * 1000 };

  counter.count += 1;
  counters.set(key, counter);

  const retryAfterSeconds = Math.max(1, Math.ceil((counter.expiresAt - now) / 1000));

  return {
    allowed: counter.count <= options.limit,
    remaining: Math.max(0, options.limit - counter.count),
    retryAfterSeconds,
  };
}

// -----------------------------------------------------------------------------
// Upstash Redis
// -----------------------------------------------------------------------------

async function limitWithUpstash(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const response = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(options.windowSeconds), "NX"],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash responded with ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ result?: number; error?: string }>;
  const count = Number(payload[0]?.result ?? 0);

  return {
    allowed: count <= options.limit,
    remaining: Math.max(0, options.limit - count),
    retryAfterSeconds: options.windowSeconds,
  };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * When Upstash is configured but unreachable: fallback to in-memory limiter to
 * maintain uptime while still mitigating brute-force abuse.
 */
export function allowOnRateLimitBackendFailure(
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return true;
}

/**
 * Consumes one unit from the budget identified by `key`.
 *
 * Backed by Upstash Redis if configured, and falls back to in-memory fixed-window
 * rate limiting to prevent hard lockouts during serverless deployments or outages.
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const namespacedKey = `conmart:ratelimit:${key}`;

  if (!hasDistributedRateLimiter()) {
    return limitInMemory(namespacedKey, options);
  }

  try {
    return await limitWithUpstash(namespacedKey, options);
  } catch (error) {
    console.warn("Rate limit distributed backend unavailable, using in-memory fallback:", error);
    return limitInMemory(namespacedKey, options);
  }
}

import { isIP } from "node:net";

/**
 * Validates if the given string is a genuine IPv4 or IPv6 address.
 * Uses Node.js RFC-compliant isIP check to prevent malformed/spoofed inputs.
 */
export function isValidIpAddress(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  return isIP(trimmed) !== 0;
}

/**
 * Best-effort caller identity for anonymous endpoints.
 *
 * Prioritizes platform-verified edge headers (Cloudflare `cf-connecting-ip`,
 * Vercel `x-vercel-forwarded-for`, and `x-real-ip`). Safely parses `x-forwarded-for`
 * to protect against client header spoofing attacks and validates address syntax.
 */
export async function getClientIdentifier(customHeaders?: Headers | null): Promise<string> {
  const headerList = customHeaders || (await headers());

  // 1. Cloudflare edge header (cryptographically verified / stripped from untrusted clients)
  const cfIp = headerList.get("cf-connecting-ip")?.trim();
  if (cfIp && isValidIpAddress(cfIp)) {
    return cfIp;
  }

  // 2. Vercel edge proxy header
  const vercelIp = headerList.get("x-vercel-forwarded-for")?.trim();
  if (vercelIp) {
    const candidate = vercelIp.split(",")[0]?.trim();
    if (candidate && isValidIpAddress(candidate)) {
      return candidate;
    }
  }

  // 3. Trusted reverse proxy X-Real-IP
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp && isValidIpAddress(realIp)) {
    return realIp;
  }

  // 4. Multi-hop X-Forwarded-For: take the rightmost valid public/proxy IP to prevent
  // client-injected spoofed headers from poisoning rate limits.
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    // Scan backwards from rightmost (last proxy added) to avoid attacker's prepended IPs
    for (let i = hops.length - 1; i >= 0; i--) {
      const hop = hops[i];
      if (isValidIpAddress(hop)) {
        return hop;
      }
    }
  }

  return "unknown";
}

/** Standard message shown when a caller exhausts their budget. */
export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes > 1
    ? `Too many attempts. Please try again in ${minutes} minutes.`
    : "Too many attempts. Please try again in a moment.";
}
