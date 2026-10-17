import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockExecuteRaw = vi.fn().mockResolvedValue(1);
const mockQueryRaw = vi.fn().mockResolvedValue([]);
vi.mock("@/lib/db", () => ({
  db: {
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

const mockRequireRole = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

import {
  submitGuestWastageAction,
  moderateWastageAction,
  getPendingWastagesAction,
} from "./wastage";

describe("Site Wastage Server Actions Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitGuestWastageAction", () => {
    it("successfully submits guest site wastage with valid Ethiopian phone and photo", async () => {
      const res = await submitGuestWastageAction({
        imageUrl: "https://mock.supabase.co/storage/v1/object/public/site-wastages/wst-1.jpg",
        title: "Used Formwork Timber (200 pcs)",
        quantity: 200,
        unit: "PIECE",
        askingPrice: 8500,
        isNegotiable: true,
        location: "Addis Ababa, Jemo 1 Site",
        contactName: "Foreman Abebe",
        contactPhone: "0911234567",
      });

      expect(res.success).toBe(true);
      expect(res.data?.referenceCode).toMatch(/^WST-[A-Z0-9]+$/);
      expect(mockExecuteRaw).toHaveBeenCalled();
    });

    it("successfully handles multi-photo uploads preserving all image URLs", async () => {
      const photos = [
        "https://mock.supabase.co/storage/v1/object/public/site-wastages/wst-1.jpg",
        "https://mock.supabase.co/storage/v1/object/public/site-wastages/wst-2.jpg",
        "https://mock.supabase.co/storage/v1/object/public/site-wastages/wst-3.jpg",
      ];

      const res = await submitGuestWastageAction({
        imageUrl: photos[0],
        imageUrls: photos,
        title: "Scrap 16mm Rebar Bundles",
        quantity: 5,
        unit: "TON",
        askingPrice: 45000,
        isNegotiable: true,
        location: "Addis Ababa, Kaliti",
        contactName: "Eng. Dawit",
        contactPhone: "0922334455",
      });

      expect(res.success).toBe(true);
      expect(res.data?.id).toBeDefined();
    });

    it("rejects invalid Ethiopian phone numbers", async () => {
      const res = await submitGuestWastageAction({
        imageUrl: "https://mock.supabase.co/storage/v1/object/public/site-wastages/wst-1.jpg",
        title: "Used Timber",
        quantity: 50,
        unit: "PIECE",
        askingPrice: 1000,
        isNegotiable: true,
        location: "Addis Ababa",
        contactName: "Abebe",
        contactPhone: "12345", // invalid
      });

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("rejects short or empty titles", async () => {
      const res = await submitGuestWastageAction({
        imageUrl: "https://mock.supabase.co/storage/v1/object/public/site-wastages/wst-1.jpg",
        title: "ab", // too short (min 3 chars)
        quantity: 1,
        unit: "PIECE",
        askingPrice: 100,
        isNegotiable: true,
        location: "Addis Ababa",
        contactName: "Abebe",
        contactPhone: "0911234567",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("at least 3 characters");
    });
  });

  describe("moderateWastageAction", () => {
    it("allows ADMIN to approve site wastage submission", async () => {
      mockRequireRole.mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" });

      const res = await moderateWastageAction({
        wastageId: "wastage_123",
        status: "APPROVED",
        moderationNotes: "Verified site photos",
      });

      expect(res.success).toBe(true);
      expect(mockExecuteRaw).toHaveBeenCalled();
    });

    it("fails when caller lacks ADMIN permissions", async () => {
      mockRequireRole.mockRejectedValueOnce(new Error("Unauthorized: ADMIN role required"));

      const res = await moderateWastageAction({
        wastageId: "wastage_123",
        status: "APPROVED",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("ADMIN");
    });
  });

  describe("getPendingWastagesAction", () => {
    it("retrieves pending submissions for ADMIN review", async () => {
      mockRequireRole.mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" });
      mockQueryRaw.mockResolvedValueOnce([
        {
          id: "wst-1",
          title: "Surplus Cement Bags",
          description: "Unopened 42.5R bags",
          image_url: "https://example.com/cement.jpg",
          quantity: 30,
          unit: "BAG",
          asking_price: 35000,
          is_negotiable: true,
          location: "Bole",
          contact_name: "Yonas",
          contact_phone: "0911001122",
          status: "PENDING",
          moderated_by: null,
          moderation_notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const res = await getPendingWastagesAction();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].title).toBe("Surplus Cement Bags");
    });
  });
});
