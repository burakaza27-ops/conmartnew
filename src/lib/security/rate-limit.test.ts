import { describe, it, expect } from "vitest";
import {
  allowOnRateLimitBackendFailure,
  isValidIpAddress,
  getClientIdentifier,
  rateLimitMessage,
} from "./rate-limit";

describe("Rate Limiting Security & IP Verification", () => {
  describe("allowOnRateLimitBackendFailure", () => {
    it("allows fallback in all environments to prevent locking out valid users", () => {
      expect(allowOnRateLimitBackendFailure("development")).toBe(true);
      expect(allowOnRateLimitBackendFailure("test")).toBe(true);
      expect(allowOnRateLimitBackendFailure("production")).toBe(true);
      expect(allowOnRateLimitBackendFailure(undefined)).toBe(true);
    });
  });

  describe("isValidIpAddress", () => {
    it("validates legitimate IPv4 addresses", () => {
      expect(isValidIpAddress("192.168.1.1")).toBe(true);
      expect(isValidIpAddress("10.0.0.1")).toBe(true);
      expect(isValidIpAddress("197.156.120.45")).toBe(true);
      expect(isValidIpAddress("255.255.255.255")).toBe(true);
    });

    it("validates legitimate IPv6 addresses", () => {
      expect(isValidIpAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
      expect(isValidIpAddress("::1")).toBe(true);
      expect(isValidIpAddress("fe80::1")).toBe(true);
    });

    it("rejects malicious or malformed IP strings", () => {
      expect(isValidIpAddress("999.999.999.999")).toBe(false);
      expect(isValidIpAddress("192.168.1.1/24")).toBe(false);
      expect(isValidIpAddress("192.168.1.1; DROP TABLE users")).toBe(false);
      expect(isValidIpAddress("<script>alert(1)</script>")).toBe(false);
      expect(isValidIpAddress("attacker.evil.com")).toBe(false);
      expect(isValidIpAddress("")).toBe(false);
      expect(isValidIpAddress("   ")).toBe(false);
    });
  });

  describe("getClientIdentifier Spoofing Prevention", () => {
    it("prioritizes trusted Cloudflare cf-connecting-ip header", async () => {
      const headers = new Headers({
        "cf-connecting-ip": "197.156.70.12",
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        "x-real-ip": "10.0.0.1",
      });

      const ip = await getClientIdentifier(headers);
      expect(ip).toBe("197.156.70.12");
    });

    it("prioritizes trusted Vercel edge header when Cloudflare is absent", async () => {
      const headers = new Headers({
        "x-vercel-forwarded-for": "196.188.12.90",
        "x-forwarded-for": "1.2.3.4",
      });

      const ip = await getClientIdentifier(headers);
      expect(ip).toBe("196.188.12.90");
    });

    it("prioritizes x-real-ip when edge platform headers are absent", async () => {
      const headers = new Headers({
        "x-real-ip": "213.55.85.10",
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      });

      const ip = await getClientIdentifier(headers);
      expect(ip).toBe("213.55.85.10");
    });

    it("safely extracts rightmost valid IP from X-Forwarded-For to defeat client prepending", async () => {
      // Attacker prepends fake IP "100.100.100.100", proxy appends real client IP "197.156.88.5"
      const headers = new Headers({
        "x-forwarded-for": "100.100.100.100, 197.156.88.5",
      });

      const ip = await getClientIdentifier(headers);
      expect(ip).toBe("197.156.88.5");
    });

    it("rejects malicious injection strings in X-Forwarded-For and falls back to unknown", async () => {
      const headers = new Headers({
        "x-forwarded-for": "invalid-ip-string, hacker-injection",
      });

      const ip = await getClientIdentifier(headers);
      expect(ip).toBe("unknown");
    });
  });

  describe("rateLimitMessage", () => {
    it("formats user-friendly rate limit messages", () => {
      expect(rateLimitMessage(30)).toBe("Too many attempts. Please try again in a moment.");
      expect(rateLimitMessage(120)).toBe("Too many attempts. Please try again in 2 minutes.");
    });
  });
});
