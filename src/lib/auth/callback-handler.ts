// =============================================================================
// ConMart — Shared Supabase auth callback handler
// =============================================================================
// Supabase password-reset emails may arrive as:
//   • PKCE code on /auth/callback?code=…
//   • PKCE code on /auth/callback/recovery?code=…  (preferred redirectTo)
//   • token_hash on /auth/confirm?token_hash=…&type=recovery
//   • Implicit hash tokens on /auth/confirm#access_token=…&type=recovery
//
// Query params like `next=/reset-password` are often stripped by the provider,
// so recovery uses a dedicated callback path instead.
// =============================================================================

import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeAppPath } from "@/lib/auth/redirect";
import {
  PASSWORD_RECOVERY_COOKIE,
  passwordRecoveryCookieOptions,
} from "@/lib/auth/password-recovery";

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string): value is EmailOtpType {
  return (EMAIL_OTP_TYPES as readonly string[]).includes(value);
}

export interface AuthCallbackOptions {
  /** When true, always land on /reset-password and stamp the recovery cookie. */
  forceRecovery?: boolean;
}

export async function handleAuthCallback(
  request: NextRequest,
  options: AuthCallbackOptions = {}
): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const next = safeAppPath(searchParams.get("next"), "/dashboard");
  const isRecovery =
    options.forceRecovery === true ||
    typeParam === "recovery" ||
    next.startsWith("/reset-password");

  const destination = isRecovery ? "/reset-password" : next;
  const redirectUrl = new URL(destination, origin);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            response.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  let exchangeError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      exchangeError = error.message;
    }
  } else if (tokenHash && typeParam && isEmailOtpType(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam,
      token_hash: tokenHash,
    });
    if (error) {
      exchangeError = error.message;
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  if (exchangeError) {
    console.error("Auth callback error:", exchangeError);
    const failurePath = isRecovery
      ? "/forgot-password?error=expired"
      : "/login?error=auth_failed";
    return NextResponse.redirect(new URL(failurePath, origin));
  }

  if (isRecovery) {
    response.cookies.set(
      PASSWORD_RECOVERY_COOKIE,
      "1",
      passwordRecoveryCookieOptions(origin.startsWith("https://"))
    );
  }

  return response;
}
