import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

vi.mock("server-only", () => ({}));

// Mock authentication session
const mockGetSessionUser = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getSessionUser: () => mockGetSessionUser(),
}));

// Mock rate limiting to pass through
vi.mock("@/lib/security/rate-limit", () => ({
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
  rateLimitMessage: vi.fn().mockReturnValue("Rate limit exceeded"),
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
    SUPABASE_STORAGE_BUCKET: "agent-documents",
  },
}));

import { POST } from "./route";

describe("Agent Document Upload API Security & Storage Failure Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Ensure any test artifact clean-up
    const testPrivateDir = path.join(process.cwd(), "storage");
    if (fs.existsSync(testPrivateDir)) {
      fs.rmSync(testPrivateDir, { recursive: true, force: true });
    }
  });

  it("fails hard with 503 and leaves ZERO files on disk when cloud storage is unavailable / unconfigured", async () => {
    // 1. Authenticated user
    mockGetSessionUser.mockResolvedValue({ id: "user-agent-1", role: "AGENT" });

    // 2. Cloud storage credentials broken / unset: returns null
    mockCreateSupabaseAdminClient.mockReturnValue(null);

    // 3. Prepare genuine PDF file buffer (magic bytes %PDF-1.4)
    const pdfHeader = Buffer.from("%PDF-1.4\n%real pdf content for national id");
    const blob = new Blob([pdfHeader], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", blob, "national_id.pdf");
    formData.append("docType", "national_id");

    const request = new NextRequest("http://localhost:3000/api/upload/agent-document", {
      method: "POST",
      body: formData,
    });

    // 4. Record disk state before upload
    const publicUploads = path.join(process.cwd(), "public", "uploads", "agent-docs");
    const privateUploads = path.join(process.cwd(), "storage", "private-uploads", "agent-docs");
    const publicExistsBefore = fs.existsSync(publicUploads);
    const privateExistsBefore = fs.existsSync(privateUploads);

    const response = await POST(request);
    const body = await response.json();

    // 5. Verify hard 503 failure
    expect(response.status).toBe(503);
    expect(body.error).toBe("Secure document storage is temporarily unavailable. Please retry.");

    // 6. Absolute verification: ZERO files created on local disk anywhere
    if (!publicExistsBefore) {
      expect(fs.existsSync(publicUploads)).toBe(false);
    } else {
      expect(fs.readdirSync(publicUploads).length).toBe(0);
    }

    if (!privateExistsBefore) {
      expect(fs.existsSync(privateUploads)).toBe(false);
    } else {
      expect(fs.readdirSync(privateUploads).length).toBe(0);
    }
  });

  it("fails hard with 503 when cloud storage upload throws an error", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-agent-1", role: "AGENT" });

    // Supabase client exists but upload throws network/S3 error
    mockCreateSupabaseAdminClient.mockReturnValue({
      storage: {
        createBucket: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: new Error("S3 bucket connection timeout") }),
        }),
      },
    });

    const pdfHeader = Buffer.from("%PDF-1.4\nvalid content");
    const formData = new FormData();
    formData.append("file", new Blob([pdfHeader], { type: "application/pdf" }), "id.pdf");

    const request = new NextRequest("http://localhost:3000/api/upload/agent-document", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe("Secure document storage is temporarily unavailable. Please retry.");

    // Verify zero files on local disk
    const privateStorage = path.join(process.cwd(), "storage");
    expect(fs.existsSync(privateStorage)).toBe(false);
  });

  it("rejects unauthenticated requests with 401", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const pdfHeader = Buffer.from("%PDF-1.4\nvalid content");
    const formData = new FormData();
    formData.append("file", new Blob([pdfHeader], { type: "application/pdf" }), "id.pdf");

    const request = new NextRequest("http://localhost:3000/api/upload/agent-document", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("rejects files with invalid magic bytes (e.g. fake PDF extension) with 400", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-agent-1", role: "AGENT" });

    // Payload is text/HTML pretending to be a PDF
    const fakeContent = Buffer.from("<html><script>alert('xss')</script></html>");
    const formData = new FormData();
    formData.append("file", new Blob([fakeContent], { type: "application/pdf" }), "exploit.pdf");

    const request = new NextRequest("http://localhost:3000/api/upload/agent-document", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid file format");
  });

  it("succeeds with 200 and short-lived presigned URL when cloud storage is healthy", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-agent-1", role: "AGENT" });

    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    const mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://supabase.co/storage/v1/object/sign/agent-docs/file.pdf?token=exp-1h" },
      error: null,
    });

    mockCreateSupabaseAdminClient.mockReturnValue({
      storage: {
        createBucket: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          createSignedUrl: mockCreateSignedUrl,
        }),
      },
    });

    const pdfHeader = Buffer.from("%PDF-1.4\nvalid certificate");
    const formData = new FormData();
    formData.append("file", new Blob([pdfHeader], { type: "application/pdf" }), "cert.pdf");
    formData.append("docType", "grade12_certificate");

    const request = new NextRequest("http://localhost:3000/api/upload/agent-document", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.url).toContain("token=exp-1h");
    expect(body.storagePath).toMatch(/^agent-docs\/agent-grade12_certificate-/);
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^agent-docs\//),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "application/pdf", upsert: false })
    );
  });
});
