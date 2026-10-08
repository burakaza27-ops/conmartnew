import { describe, it, expect } from "vitest";
import { allowOnRateLimitBackendFailure } from "./rate-limit";

describe("allowOnRateLimitBackendFailure", () => {
  it("allows fallback in all environments to prevent locking out valid users", () => {
    expect(allowOnRateLimitBackendFailure("development")).toBe(true);
    expect(allowOnRateLimitBackendFailure("test")).toBe(true);
    expect(allowOnRateLimitBackendFailure("production")).toBe(true);
    expect(allowOnRateLimitBackendFailure(undefined)).toBe(true);
  });
});
