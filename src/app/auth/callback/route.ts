// =============================================================================
// ConMart — Auth Callback Route Handler
// =============================================================================
// Exchanges the Supabase Auth code (PKCE) or token_hash (email templates)
// for a session, then redirects into the app. Password-recovery links land
// on /reset-password and receive a short-lived httpOnly marker cookie.
// =============================================================================

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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const next = safeAppPath(searchParams.get("next"), "/dashboard");
  const isRecovery =
    typeParam === "recovery" || next.startsWith("/reset-password");

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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
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
    return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
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
