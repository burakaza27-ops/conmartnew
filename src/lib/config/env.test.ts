import { describe, it, expect } from "vitest";
import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  const baseValidEnv = {
    DATABASE_URL: ["postgresql://", "test_user:test_pass", "@localhost:5432/test_db"].join(""),
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-example",
  };

  it("succeeds in development without Upstash Redis credentials", () => {
    const result = parseServerEnv({
      ...baseValidEnv,
      NODE_ENV: "development",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe("development");
    }
  });

  it("fails in production when Upstash Redis credentials are missing", () => {
    const result = parseServerEnv({
      ...baseValidEnv,
      NODE_ENV: "production",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("UPSTASH_REDIS_REST_URL");
      expect(result.error).toContain("UPSTASH_REDIS_REST_TOKEN");
    }
  });

  it("succeeds in production when Upstash credentials are provided", () => {
    const result = parseServerEnv({
      ...baseValidEnv,
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "valid-upstash-token",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe("production");
      expect(result.data.UPSTASH_REDIS_REST_URL).toBe("https://example.upstash.io");
    }
  });
});
