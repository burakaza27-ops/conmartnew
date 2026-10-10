import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  })),
}));

describe("Edge Middleware & Security Headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces strict Content Security Policy without https: wildcard and without unsafe-eval in script-src", async () => {
    const req = new NextRequest("http://localhost:3000/catalog");
    const response = await middleware(req);

    const csp = response.headers.get("content-security-policy");
    expect(csp).toBeTruthy();

    // Verify script-src directives
    const scriptSrcMatch = csp?.match(/script-src[^;]+/);
    expect(scriptSrcMatch).toBeTruthy();
    const scriptSrc = scriptSrcMatch ? scriptSrcMatch[0] : "";

    // Security assertions:
    expect(scriptSrc).not.toContain("https:");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).toMatch(/'nonce-[a-f0-9-]+'/i);
  });

  it("attaches defensive security headers (nosniff, frame-ancestors, X-Frame-Options DENY)", async () => {
    const req = new NextRequest("http://localhost:3000/");
    const response = await middleware(req);

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toContain("camera=()");
  });

  it("redirects unauthenticated users trying to access protected /admin routes", async () => {
    const req = new NextRequest("http://localhost:3000/admin/agents");
    const response = await middleware(req);

    expect(response.status).toBe(307); // redirect
    expect(response.headers.get("location")).toContain("/login?redirect=%2Fadmin%2Fagents");
  });

  it("redirects unauthenticated users trying to access protected /seller routes", async () => {
    const req = new NextRequest("http://localhost:3000/seller/listings");
    const response = await middleware(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?redirect=%2Fseller%2Flistings");
  });

  it("returns 401 JSON for unauthenticated protected API routes", async () => {
    const req = new NextRequest("http://localhost:3000/api/upload/agent-document");
    const response = await middleware(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Authentication required.");
  });

  it("permits public buyer browsing without authentication", async () => {
    const req = new NextRequest("http://localhost:3000/buyer/catalog");
    const response = await middleware(req);

    expect(response.status).toBe(200);
  });
});
