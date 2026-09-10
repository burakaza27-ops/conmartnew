// =============================================================================
// ConMart — Auth Server Actions
// =============================================================================
// Sign-in, registration, sign-out, profile updates, and password reset.
//
// Registration writes to two systems: Supabase Auth and the `users` table. The
// application record is created in a transaction, and the auth account is
// rolled back if that transaction fails, so the two never drift apart.
// =============================================================================

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import {
  changePasswordSchema,
  ethiopianPhoneLookupVariants,
  loginSchema,
  normalizeEthiopianPhone,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/lib/validations";
import {
  ALL_APP_ROLES,
  authorize,
  defaultRouteForRole,
  getSessionUser,
} from "@/lib/auth/session";
import { getPublicOrigin } from "@/lib/auth/origin";
import {
  PASSWORD_RECOVERY_COOKIE,
} from "@/lib/auth/password-recovery";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import {
  toSafeErrorMessage,
  mapSignUpAuthError,
  mapPasswordUpdateError,
} from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

/**
 * Shown for both a missing account and a wrong password so the form cannot be
 * used to enumerate which email addresses are registered.
 */
const INVALID_CREDENTIALS_MESSAGE =
  "Invalid email or password. Please try again.";

/**
 * Signs in an existing user.
 *
 * The post-login destination is derived from the `users` table rather than the
 * JWT, because `user_metadata` is writable by the account holder.
 */
export async function signIn(
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  // Throttle per address and per network to slow credential stuffing without
  // letting one attacker lock out a shared office IP.
  const clientId = await getClientIdentifier();
  const emailKey = parsed.data.email.toLowerCase();

  const [byEmail, byIp] = await Promise.all([
    rateLimit(`signin:email:${emailKey}`, { limit: 8, windowSeconds: 900 }),
    rateLimit(`signin:ip:${clientId}`, { limit: 30, windowSeconds: 900 }),
  ]);

  if (!byEmail.allowed || !byIp.allowed) {
    const retryAfter = Math.max(byEmail.retryAfterSeconds, byIp.retryAfterSeconds);
    return { success: false, error: rateLimitMessage(retryAfter) };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { success: false, error: INVALID_CREDENTIALS_MESSAGE };
  }

  const dbUser = await db.user.findUnique({
    where: { authId: data.user.id },
    select: { role: true },
  });

  if (!dbUser) {
    // An auth account with no application record cannot be authorized for any
    // route, so end the session rather than leaving a half-signed-in user.
    await supabase.auth.signOut();
    return {
      success: false,
      error:
        "Your account setup is incomplete. Please contact ConMart support to finish registration.",
    };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { redirectUrl: defaultRouteForRole(dbUser.role) } };
}

/**
 * Registers a buyer, supplier, or local-agent account.
 *
 * Sellers start UNVERIFIED with an empty wallet. Agents must pick a coverage
 * area before any Auth user is created, so a bad zone never orphans a login.
 */
export async function signUp(
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    role: formData.get("role"),
    zoneId: formData.get("zoneId") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const { email, password, name, companyName, role } = parsed.data;
  const phone = normalizeEthiopianPhone(parsed.data.phone);
  const zoneId = role === "FIELD_AGENT" ? parsed.data.zoneId : undefined;

  const clientId = await getClientIdentifier();
  const emailKey = email.toLowerCase();
  const [byEmail, byIp] = await Promise.all([
    rateLimit(`signup:email:${emailKey}`, { limit: 5, windowSeconds: 3600 }),
    rateLimit(`signup:ip:${clientId}`, { limit: 8, windowSeconds: 3600 }),
  ]);

  if (!byEmail.allowed || !byIp.allowed) {
    const retryAfter = Math.max(byEmail.retryAfterSeconds, byIp.retryAfterSeconds);
    return { success: false, error: rateLimitMessage(retryAfter) };
  }

  if (role === "FIELD_AGENT") {
    if (!zoneId) {
      return {
        success: false,
        error: "Select the coverage area you will work as a local agent.",
      };
    }
    const zone = await db.zone.findUnique({
      where: { id: zoneId },
      select: { id: true },
    });
    if (!zone) {
      return {
        success: false,
        error: "The selected coverage area is no longer available. Refresh the page and choose again.",
      };
    }
  }

  const supabase = await createSupabaseServerClient();

  // `role` is mirrored into user_metadata for display only. Authorization
  // always reads the `users` table — see src/lib/auth/session.ts.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, name, company_name: companyName } },
  });

  if (authError) {
    console.error("[signUp:auth]", authError.message, authError);
    if (authError.message.includes("already registered")) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }
    return { success: false, error: mapSignUpAuthError(authError.message) };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }

  const authId = authData.user.id;

  const existingProfile = await db.user.findUnique({
    where: { authId },
    select: { id: true, role: true },
  });

  if (existingProfile) {
    revalidatePath("/", "layout");
    return {
      success: true,
      data: { redirectUrl: defaultRouteForRole(existingProfile.role) },
    };
  }

  try {
    // Nested writes, not `db.$transaction(async (tx) => ...)`.
    // Interactive transactions pin a session, which PgBouncer in transaction
    // mode (Supabase port 6543) does not keep. A single nested create is one
    // round-trip the pooler can run atomically.
    await db.user.create({
      data: {
        authId,
        role,
        name,
        phone,
        companyName,
        ...(role === "SELLER"
          ? {
              sellerProfile: {
                create: {
                  verificationStatus: "UNVERIFIED" as const,
                  sellerType: "RETAILER" as const,
                },
              },
              wallet: {
                create: { cashBalance: 0, creditBalance: 0 },
              },
            }
          : {}),
        ...(role === "FIELD_AGENT" && zoneId
          ? {
              agentProfile: {
                create: {
                  zoneId,
                  isActive: true,
                },
              },
            }
          : {}),
      },
    });
  } catch (dbError) {
    const raced = await db.user.findUnique({
      where: { authId },
      select: { role: true },
    });
    if (raced) {
      revalidatePath("/", "layout");
      return { success: true, data: { redirectUrl: defaultRouteForRole(raced.role) } };
    }
    await rollbackAuthUser(authId);
    return {
      success: false,
      error: toSafeErrorMessage(
        dbError,
        "signUp:profile",
        "We could not finish setting up your account. Please try again."
      ),
    };
  }

  revalidatePath("/", "layout");
  if (!authData.session) {
    return { success: true, data: { redirectUrl: "/login?registered=1" } };
  }
  return { success: true, data: { redirectUrl: defaultRouteForRole(role) } };
}

/**
 * Deletes the Supabase Auth account created moments earlier, so a failed
 * profile write does not strand an account that can sign in but not be
 * authorized for anything.
 */
async function rollbackAuthUser(authId: string): Promise<void> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    console.error(
      `Orphaned Supabase auth user ${authId}: no users row was created and ` +
        "SUPABASE_SERVICE_ROLE_KEY is not configured, so it cannot be removed automatically."
    );
    return;
  }

  const { error } = await admin.auth.admin.deleteUser(authId);
  if (error) {
    console.error(`Failed to roll back Supabase auth user ${authId}:`, error.message);
  }
}

/** Signs out the current user and returns them to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

async function throttleAccountAction(
  action: string,
  userKey: string
): Promise<string | null> {
  const clientId = await getClientIdentifier();
  const [byUser, byIp] = await Promise.all([
    rateLimit(`account:${action}:user:${userKey}`, {
      limit: 8,
      windowSeconds: 900,
    }),
    rateLimit(`account:${action}:ip:${clientId}`, {
      limit: 20,
      windowSeconds: 900,
    }),
  ]);

  if (!byUser.allowed || !byIp.allowed) {
    const retryAfter = Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds);
    return rateLimitMessage(retryAfter);
  }

  return null;
}

/**
 * Updates the signed-in user's name, phone, and company on the `users` row.
 * Email is not editable — changing it would desync login from the profile.
 *
 * The new phone is stored in canonical form and refused when another
 * registered account already uses it, so agent-on-behalf lookups stay unique.
 */
export async function updateProfileAction(
  formData: FormData
): Promise<ActionResult<{ name: string; phone: string; companyName: string }>> {
  const auth = await authorize(ALL_APP_ROLES);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const throttled = await throttleAccountAction("profile", auth.user.id);
  if (throttled) {
    return { success: false, error: throttled };
  }

  const name = parsed.data.name.trim();
  const companyName = parsed.data.companyName.trim();
  const phone = normalizeEthiopianPhone(parsed.data.phone);

  const taken = await db.user.findFirst({
    where: {
      id: { not: auth.user.id },
      authId: { not: null },
      phone: { in: ethiopianPhoneLookupVariants(phone) },
    },
    select: { id: true },
  });

  if (taken) {
    return {
      success: false,
      error: "That phone number is already used by another ConMart account.",
    };
  }

  try {
    const updated = await db.user.update({
      where: { id: auth.user.id },
      data: { name, phone, companyName },
      select: { name: true, phone: true, companyName: true },
    });

    const supabase = await createSupabaseServerClient();
    await supabase.auth.updateUser({
      data: { name, company_name: companyName, phone },
    });

    revalidatePath("/", "layout");
    revalidatePath("/account/settings");
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(
        error,
        "updateProfile",
        "We could not save your profile. Please try again."
      ),
    };
  }
}

/**
 * Changes the signed-in user's password after proving they know the current one.
 */
export async function changePasswordAction(
  formData: FormData
): Promise<ActionResult<{ updated: true }>> {
  const auth = await authorize(ALL_APP_ROLES);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  if (!auth.user.email) {
    return {
      success: false,
      error: "Your account has no email address, so the password cannot be changed here.",
    };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const throttled = await throttleAccountAction("password", auth.user.id);
  if (throttled) {
    return { success: false, error: throttled };
  }

  const supabase = await createSupabaseServerClient();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return { success: false, error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    console.error("[changePassword]", updateError.message);
    return { success: false, error: mapPasswordUpdateError(updateError.message) };
  }

  await supabase.auth.signOut({ scope: "others" });
  revalidatePath("/", "layout");
  return { success: true, data: { updated: true } };
}

/**
 * Sends a password-reset email. Always reports success so the form cannot be
 * used to discover which addresses are registered.
 */
export async function requestPasswordResetAction(
  formData: FormData
): Promise<ActionResult<{ sent: true }>> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const emailKey = parsed.data.email.toLowerCase();
  const clientId = await getClientIdentifier();
  const [byEmail, byIp] = await Promise.all([
    rateLimit(`reset:email:${emailKey}`, { limit: 3, windowSeconds: 3600 }),
    rateLimit(`reset:ip:${clientId}`, { limit: 8, windowSeconds: 3600 }),
  ]);

  if (!byEmail.allowed || !byIp.allowed) {
    const retryAfter = Math.max(byEmail.retryAfterSeconds, byIp.retryAfterSeconds);
    return { success: false, error: rateLimitMessage(retryAfter) };
  }

  const origin = await getPublicOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("[requestPasswordReset]", error.message);
    // Still succeed from the caller's point of view — a provider outage
    // should not confirm or deny that the address exists.
  }

  return { success: true, data: { sent: true } };
}

/**
 * Sets a new password after the recovery email link has been exchanged.
 * Requires the short-lived recovery cookie stamped by `/auth/callback`.
 */
export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  const parsed = resetPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const cookieStore = await cookies();
  const recovery = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value;
  if (recovery !== "1") {
    return {
      success: false,
      error: "This reset link has expired. Request a new password reset email.",
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      error: "This reset link has expired. Request a new password reset email.",
    };
  }

  const throttled = await throttleAccountAction("reset", user.id);
  if (throttled) {
    return { success: false, error: throttled };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    console.error("[resetPassword]", error.message);
    return { success: false, error: mapPasswordUpdateError(error.message) };
  }

  cookieStore.delete(PASSWORD_RECOVERY_COOKIE);
  await supabase.auth.signOut({ scope: "others" });
  revalidatePath("/", "layout");
  return {
    success: true,
    data: { redirectUrl: "/account/settings?password=1" },
  };
}
