// =============================================================================
// ConMart — Password recovery callback
// =============================================================================
// Supabase reset emails should redirect here (not /auth/callback?next=…).
// Query params on redirectTo are often stripped; a dedicated path is reliable
// and easy to whitelist in Supabase → Authentication → Redirect URLs.
// =============================================================================

import type { NextRequest } from "next/server";

import { handleAuthCallback } from "@/lib/auth/callback-handler";

export async function GET(request: NextRequest) {
  return handleAuthCallback(request, { forceRecovery: true });
}
