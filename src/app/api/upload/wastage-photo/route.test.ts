import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

vi.mock("server-only", () => ({}));

// Mock rate limiting
const mockRateLimit = vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
vi.mock("@/lib/security/rate-limit", () => ({
  getClientIdentifier: vi.fn().mockResolvedValue("196.188.240.10"),
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitMessage: vi.fn().mockReturnValue("Rate limit exceeded. Try again in 60 minutes."),
}));

// Mock Supabase admin client
const mockCreateSupabaseAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mockCreateSupabaseAdminClient(),
}));

// Mock env
vi.mock("@/lib/config/env", () => ({
  env: {
    NODE_ENV: "production",
    SUPABASE_STORAGE_BUCKET: "site-wastages",
  },
}));

import { POST } from "./route";

describe("Wastage Photo Upload API Security & Anti-Fraud Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  afterEach(() => {
    const testDir = path.join(process.cwd(), "public", "uploads", "wastage");
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("successfully uploads a genuine JPEG camera photo to Supabase storage", async () => {
    // Fake Supabase client mock with createBucket and upload
    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://mock.supabase.co/storage/v1/object/public/site-wastages/site-wastages/wst-123.jpg" },
    });

    mockCreateSupabaseAdminClient.mockReturnValue({
      storage: {
        createBucket: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    });

    // Valid JPEG magic bytes: FF D8 FF E0
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const blob = new Blob([jpegHeader], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "camera_photo.jpg");

    const req = new NextRequest("http://localhost:3000/api/upload/wastage-photo", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.url).toContain("wst-");
    expect(mockUpload).toHaveBeenCalledOnce();
  });

  it("strictly rejects SVG and HTML script payloads disguised as images", async () => {
    const maliciousSvg = Buffer.from("<svg onload='alert(1)'>fake</svg>");
    const blob = new Blob([maliciousSvg], { type: "image/jpeg" }); // disguised MIME
    const formData = new FormData();
    formData.append("file", blob, "exploit.jpg");

    const req = new NextRequest("http://localhost:3000/api/upload/wastage-photo", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("Invalid or unsupported image format");
  });

  it("rejects files exceeding the 5MB size limit", async () => {
    // 6MB buffer
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    const blob = new Blob([largeBuffer], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "oversized.jpg");

    const req = new NextRequest("http://localhost:3000/api/upload/wastage-photo", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("5MB limit");
  });

  it("enforces rate limits with 429 when client exhausts upload budget", async () => {
    mockRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 1800,
    });

    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const blob = new Blob([jpegHeader], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");

    const req = new NextRequest("http://localhost:3000/api/upload/wastage-photo", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("1800");
  });

  it("fails cleanly with 503 if storage client is unavailable in production", async () => {
    mockCreateSupabaseAdminClient.mockReturnValue(null);

    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const blob = new Blob([jpegHeader], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");

    const req = new NextRequest("http://localhost:3000/api/upload/wastage-photo", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.error).toContain("storage service is currently unavailable");
  });
});
