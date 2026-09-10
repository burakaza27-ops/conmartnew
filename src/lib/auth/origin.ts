// =============================================================================
// ConMart — Public origin for email links
// =============================================================================
// Password-reset emails must bounce the contractor back to *this* deployment,
// not a hardcoded production host. The request Host header is the source of
// truth; NEXT_PUBLIC_SITE_URL is the fallback when headers are missing.
// =============================================================================

import "server-only";

import { headers } from "next/headers";

/**
 * Absolute origin used in `resetPasswordForEmail` redirectTo.
 *
 * Must be listed under Supabase Authentication → URL Configuration →
 * Redirect URLs (for example `http://localhost:3000/auth/callback` and
 * `https://your-domain/auth/callback`).
 */
export async function getPublicOrigin(): Promise<string> {
  const headerList = await headers();
  const hostHeader =
    headerList.get("x-forwarded-host") ?? headerList.get("host");
  const host = hostHeader?.split(",")[0]?.trim();

  if (host) {
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    const proto =
      headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (isLocal ? "http" : "https");
    return `${proto}://${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
