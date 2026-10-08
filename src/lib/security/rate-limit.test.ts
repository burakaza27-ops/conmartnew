import { describe, it, expect } from "vitest";
import { allowOnRateLimitBackendFailure } from "./rate-limit";

describe("allowOnRateLimitBackendFailure", () => {
  it("allows requests (fails open) in development and test environments", () => {
    expect(allowOnRateLimitBackendFailure("development")).toBe(true);
    expect(allowOnRateLimitBackendFailure("test")).toBe(true);
    expect(allowOnRateLimitBackendFailure(undefined)).toBe(true);
  });

  it("denies requests (fails closed) in production environment to prevent rate-limit evasion", () => {
    expect(allowOnRateLimitBackendFailure("production")).toBe(false);
  });
});
