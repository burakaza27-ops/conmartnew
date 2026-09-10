// =============================================================================
// ConMart — Public origin for email links
// =============================================================================
// Password-reset emails must always use your *canonical* production domain,
// not whichever Vercel preview URL happened to handle the forgot-password
// form. Set NEXT_PUBLIC_SITE_URL in Vercel to your real domain (e.g.
// https://conmart.et). Request Host is only used when that variable is unset
// (local dev).
// =============================================================================

import "server-only";

import { headers } from "next/headers";

/**
 * Absolute origin used in `resetPasswordForEmail` redirectTo.
 *
 * Add every callback URL in Supabase → Authentication → URL Configuration:
 *   https://YOUR-DOMAIN/auth/callback
 *   https://YOUR-DOMAIN/auth/callback/recovery
 *   https://YOUR-DOMAIN/auth/confirm
 */
export async function getPublicOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

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

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

/** Build the Supabase redirectTo URL for password recovery emails. */
export async function getPasswordRecoveryRedirectUrl(): Promise<string> {
  const origin = await getPublicOrigin();
  return `${origin}/auth/callback/recovery`;
}
