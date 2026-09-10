// =============================================================================
// ConMart — Validated Server Environment
// =============================================================================
// Environment access is centralized here so a missing or malformed variable
// fails at startup with a precise message, rather than surfacing later as a
// zero-rated invoice or an unauthenticated database client.
//
// Only server code may import this module. Client components read the
// NEXT_PUBLIC_* values Next.js inlines at build time.
// =============================================================================

import "server-only";

import { z } from "zod";

const percentage = z.coerce
  .number()
  .min(0, "must be between 0 and 100")
  .max(100, "must be between 0 and 100");

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "is required"),
  DATABASE_POOLER_URL: z.string().min(1).optional(),
  /** PEM-encoded CA certificate, for a provider that does not use a public CA. */
  DATABASE_CA_CERT: z.string().min(1).optional(),
  DATABASE_SSL_NO_VERIFY: z.enum(["true", "false"]).default("false"),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url("must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  /** Optional public origin for password-reset emails when Host cannot be read. */
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("products"),

  PLATFORM_FEE_PERCENT: percentage.default(0),
  VAT_RATE_PERCENT: percentage.default(15),
  DEAL_FAILURE_REFUND_PERCENT: percentage.default(80),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")} ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid server environment configuration:\n${details}\n\n` +
        "Copy .env.example to .env.local and fill in the missing values."
    );
  }

  return parsed.data;
}

// `SKIP_ENV_VALIDATION` exists for Docker image builds and static analysis,
// where the runtime secrets are deliberately absent.
export const env: ServerEnv =
  process.env.SKIP_ENV_VALIDATION === "true"
    ? (process.env as unknown as ServerEnv)
    : loadServerEnv();

/** Percentage added to the base subtotal on a proforma. */
export function getPlatformFeePercent(): number {
  return Number(env.PLATFORM_FEE_PERCENT);
}

/** Ethiopian VAT rate applied to subtotal plus platform fee. */
export function getVatRatePercent(): number {
  return Number(env.VAT_RATE_PERCENT);
}

/** Share of an unlock fee returned as non-withdrawable credit on deal failure. */
export function getDealFailureRefundPercent(): number {
  return Number(env.DEAL_FAILURE_REFUND_PERCENT);
}
