// =============================================================================
// ECON — Supabase Service-Role Client
// =============================================================================
// Bypasses Row Level Security and can administer any account. It exists only
// for maintenance the anon key cannot perform, such as deleting an auth user
// whose application record failed to persist.
//
// Never import this from a client component and never pass its results
// straight to the browser.
// =============================================================================

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/config/env";

/**
 * Returns a service-role client, or null when SUPABASE_SERVICE_ROLE_KEY is not
 * configured. Callers must treat the null case as "cleanup unavailable" rather
 * than failing the user-facing operation.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
