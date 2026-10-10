// =============================================================================
// ConMart — Stamp password-recovery cookie after client-side email confirm
// =============================================================================
// Implicit-flow links (#access_token) and some token_hash flows complete in the
// browser. This route marks the session as recovery so /reset-password accepts it.
// =============================================================================

import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  PASSWORD_RECOVERY_COOKIE,
  passwordRecoveryCookieOptions,
} from "@/lib/auth/password-recovery";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { error: "No active session. Request a new reset link." },
      { status: 401 }
    );
  }

  const urlOrigin = new URL(request.url).origin;
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== urlOrigin) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    PASSWORD_RECOVERY_COOKIE,
    "1",
    passwordRecoveryCookieOptions(origin.startsWith("https://"))
  );
  return response;
}
