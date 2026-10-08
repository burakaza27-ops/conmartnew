// =============================================================================
// ConMart — Supabase Server Client
// =============================================================================
// Creates a Supabase client configured for server-side usage (Server Components,
// Server Actions, Route Handlers). Uses Next.js `cookies()` for session management.
//
// Usage: const supabase = await createSupabaseServerClient()
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes auth tokens via HTTP-only cookies.
 *
 * MUST be called with `await` since `cookies()` is async in Next.js 16.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "placeholder-anon-key";

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` is called from Server Components where cookies
            // can't be modified. This is safe to ignore — the proxy
            // will refresh the session on the next request.
          }
        },
      },
    }
  );
}

/**
 * Gets the currently authenticated user from the Supabase session.
 * Returns null if not authenticated.
 *
 * Memoized via React cache() so multiple components in the same request
 * tree (e.g. layout.tsx and page.tsx) share the same auth lookup without
 * duplicate HTTP round-trips to Supabase.
 */
export const getAuthenticatedUser = cache(async () => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Failed to authenticate user via Supabase:", error);
    return null;
  }
});
