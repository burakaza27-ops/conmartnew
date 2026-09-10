// =============================================================================
// ConMart — Error Boundaries Between Domain and Infrastructure Failures
// =============================================================================
// Domain rules ("insufficient balance", "enquiry already accepted") are safe to
// show a user. Infrastructure failures are not: driver and query errors leak
// table names, column names, and connection details.
//
// Throw `DomainError` for the former; everything else is reported generically.
// =============================================================================

/** A rule violation whose message is safe to display to the caller. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Maps Supabase Auth sign-up failures to messages that are safe to show users.
 * The raw provider message is still logged server-side for debugging.
 */
export function mapSignUpAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (
    lower.includes("confirmation") ||
    lower.includes("sending email") ||
    lower.includes("smtp") ||
    lower.includes("email address is invalid")
  ) {
    return (
      "We could not complete email verification. Check your inbox for a confirmation link, " +
      "or ask an administrator to disable “Confirm email” in Supabase for testing."
    );
  }

  if (lower.includes("invalid api key") || lower.includes("invalid jwt")) {
    return (
      "Sign-up is temporarily unavailable because the server auth keys are misconfigured. " +
      "Please contact support."
    );
  }

  if (lower.includes("signups not allowed") || lower.includes("signup is disabled")) {
    return "New registrations are currently disabled. Please contact support.";
  }

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many sign-up attempts. Please wait about an hour and try again, or ask an administrator to create your account.";
  }

  if (lower.includes("password")) {
    return "Password does not meet security requirements. Use at least 8 characters with upper, lower, and a number.";
  }

  return "Something went wrong. Please try again.";
}

/** Maps Supabase password-update failures to messages that are safe to show. */
export function mapPasswordUpdateError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("same") ||
    lower.includes("should be different") ||
    lower.includes("different from the old")
  ) {
    return "New password must be different from your current password.";
  }

  if (
    lower.includes("pwned") ||
    lower.includes("leaked") ||
    lower.includes("data breach") ||
    lower.includes("haveibeenpwned")
  ) {
    return "That password appears in a public breach list. Choose a different password.";
  }

  if (lower.includes("weak") || lower.includes("too short")) {
    return "Password does not meet security requirements. Use at least 8 characters with upper, lower, and a number.";
  }

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (lower.includes("session") || lower.includes("jwt") || lower.includes("expired")) {
    return "Your reset session has expired. Request a new password reset email.";
  }

  return "We could not update your password. Please try again.";
}

/**
 * Converts a caught value into a message safe to return over the wire.
 * Unexpected errors are logged with `context` and replaced with `fallback`.
 */
export function toSafeErrorMessage(
  error: unknown,
  context: string,
  fallback = "Something went wrong. Please try again."
): string {
  if (error instanceof DomainError) {
    return error.message;
  }

  console.error(`[${context}]`, error);
  return fallback;
}
