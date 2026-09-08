// =============================================================================
// ConMart — Auth Server Actions
// =============================================================================
// Sign-in, registration, and sign-out.
//
// Registration writes to two systems: Supabase Auth and the `users` table. The
// application record is created in a transaction, and the auth account is
// rolled back if that transaction fails, so the two never drift apart.
// =============================================================================

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validations";
import { defaultRouteForRole } from "@/lib/auth/session";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import { toSafeErrorMessage } from "@/lib/errors";
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
 * Registers a buyer or supplier account.
 *
 * Sellers start UNVERIFIED with an empty wallet. Verification is granted by an
 * administrator from the command center after documents are reviewed.
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
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const { email, password, name, phone, companyName, role } = parsed.data;

  const clientId = await getClientIdentifier();
  const { allowed, retryAfterSeconds } = await rateLimit(`signup:ip:${clientId}`, {
    limit: 5,
    windowSeconds: 3600,
  });

  if (!allowed) {
    return { success: false, error: rateLimitMessage(retryAfterSeconds) };
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
    if (authError.message.includes("already registered")) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }
    return { success: false, error: toSafeErrorMessage(authError, "signUp:auth") };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }

  const authId = authData.user.id;

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
      },
    });
  } catch (dbError) {
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
