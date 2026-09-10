import { describe, expect, it } from "vitest";

import { safeAppPath } from "@/lib/auth/redirect";

describe("safeAppPath", () => {
  it("accepts a same-origin relative path", () => {
    expect(safeAppPath("/reset-password")).toBe("/reset-password");
    expect(safeAppPath("/account/settings")).toBe("/account/settings");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeAppPath("//evil.example/phish", "/dashboard")).toBe("/dashboard");
    expect(safeAppPath("https://evil.example", "/dashboard")).toBe("/dashboard");
  });

  it("rejects backslashes and missing leading slash", () => {
    expect(safeAppPath("\\login", "/dashboard")).toBe("/dashboard");
    expect(safeAppPath("login", "/dashboard")).toBe("/dashboard");
  });

  it("falls back when the value is empty", () => {
    expect(safeAppPath(null, "/buyer")).toBe("/buyer");
    expect(safeAppPath(undefined, "/buyer")).toBe("/buyer");
    expect(safeAppPath("  ", "/buyer")).toBe("/buyer");
  });
});
