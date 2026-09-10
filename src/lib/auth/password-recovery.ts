// =============================================================================
// ConMart — Password-recovery session marker
// =============================================================================
// After the email link is exchanged for a session, the callback stamps a short
// httpOnly cookie. The reset action requires that cookie so a normal signed-in
// visit to /reset-password cannot skip "current password" in Account Settings.
// =============================================================================

export const PASSWORD_RECOVERY_COOKIE = "cm_pw_recovery";

/** Fifteen minutes is long enough to type a new password, short enough to expire. */
export const PASSWORD_RECOVERY_MAX_AGE_SECONDS = 15 * 60;

export function passwordRecoveryCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: PASSWORD_RECOVERY_MAX_AGE_SECONDS,
  };
}
