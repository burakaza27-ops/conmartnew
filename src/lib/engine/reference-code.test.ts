import { describe, expect, it } from "vitest";

import {
  generateReferenceCode,
  generateUniqueReferenceCode,
  isValidReferenceCode,
  normalizeReferenceCode,
} from "@/lib/engine/reference-code";

describe("generateReferenceCode", () => {
  it("defaults to the proforma prefix", () => {
    expect(generateReferenceCode()).toMatch(/^PRF-[2-9A-HJ-NP-Z]{6}$/);
  });

  it("supports the enquiry prefix", () => {
    expect(generateReferenceCode("ENQ")).toMatch(/^ENQ-[2-9A-HJ-NP-Z]{6}$/);
  });

  it("supports the deal-ticket prefix", () => {
    expect(generateReferenceCode("DLT")).toMatch(/^DLT-[2-9A-HJ-NP-Z]{6}$/);
  });

  it("never emits characters that are misread over the phone", () => {
    const codes = Array.from({ length: 500 }, () => generateReferenceCode());

    for (const code of codes) {
      expect(code.slice(4)).not.toMatch(/[01OIL]/);
    }
  });

  it("draws from a wide enough space that collisions are negligible", () => {
    const sampleSize = 2_000;
    const codes = new Set(
      Array.from({ length: sampleSize }, () => generateReferenceCode("ENQ"))
    );

    // The space is 31^6, roughly 887 million, so a handful of draws should
    // essentially never repeat. The threshold rather than an exact count keeps
    // the test from failing on a legitimate one-in-a-million collision.
    expect(codes.size / sampleSize).toBeGreaterThan(0.999);
  });
});

describe("generateUniqueReferenceCode", () => {
  it("returns a PRF code for legacy async call sites", async () => {
    await expect(generateUniqueReferenceCode()).resolves.toMatch(
      /^PRF-[2-9A-HJ-NP-Z]{6}$/
    );
  });
});

describe("isValidReferenceCode", () => {
  it("accepts a well-formed code", () => {
    expect(isValidReferenceCode("PRF-8A3K9M")).toBe(true);
  });

  it("accepts either prefix when none is specified", () => {
    expect(isValidReferenceCode("ENQ-QT47XZ")).toBe(true);
  });

  it("rejects the wrong prefix when one is required", () => {
    expect(isValidReferenceCode("ENQ-QT47XZ", "PRF")).toBe(false);
  });

  it("rejects ambiguous characters", () => {
    expect(isValidReferenceCode("PRF-8A3K90")).toBe(false);
    expect(isValidReferenceCode("PRF-8A3K9I")).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidReferenceCode("PRF-8A3K9")).toBe(false);
    expect(isValidReferenceCode("PRF-8A3K9MM")).toBe(false);
  });

  it("rejects an unrelated string", () => {
    expect(isValidReferenceCode("DROP TABLE orders")).toBe(false);
  });
});

describe("normalizeReferenceCode", () => {
  it("uppercases, trims, and strips a leading hash", () => {
    expect(normalizeReferenceCode("  #prf-8a3k9m ")).toBe("PRF-8A3K9M");
  });

  it("returns null for input that is not a reference", () => {
    expect(normalizeReferenceCode("not-a-code")).toBeNull();
  });

  it("returns null when the prefix does not match the one required", () => {
    expect(normalizeReferenceCode("prf-8a3k9m", "ENQ")).toBeNull();
  });
});
