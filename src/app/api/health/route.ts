// =============================================================================
// ECON — Health Check
// =============================================================================
// Reports whether the process can actually serve traffic correctly, not merely
// whether it is running. A load balancer or uptime monitor should treat a 503
// here as "do not send traffic".
//
// Deliberately unauthenticated, and deliberately vague: it reports which
// subsystem is unhealthy but never the reason, so it cannot be used to
// enumerate configuration.
// =============================================================================

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { hasDistributedRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

type Status = "ok" | "degraded" | "down";

export async function GET() {
  const checks: Record<string, Status> = {};

  // A trivial round-trip confirms the pooler is reachable and credentials are
  // still valid, which is the failure that takes the whole app down.
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    console.error("Health check: database unreachable", error);
    checks.database = "down";
  }

  // Without a shared counter store, rate limits are per-instance and cannot
  // enforce a global budget. The app still serves, so this is degraded.
  checks.rateLimiter =
    hasDistributedRateLimiter() || process.env.NODE_ENV !== "production"
      ? "ok"
      : "degraded";

  const isDown = Object.values(checks).includes("down");
  const isDegraded = Object.values(checks).includes("degraded");

  return NextResponse.json(
    {
      status: isDown ? "down" : isDegraded ? "degraded" : "ok",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: isDown ? 503 : 200,
      headers: { "cache-control": "no-store" },
    }
  );
}
