import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { mockAuth, mockWalletService, mockDb, mockRateLimit, mockNotifications } = vi.hoisted(() => {
  return {
    mockAuth: {
      authorize: vi.fn(),
    },
    mockWalletService: {
      getOrCreateSellerWallet: vi.fn(),
      submitWalletTopUpRequest: vi.fn(),
      approveTopUpRequest: vi.fn(),
      rejectTopUpRequest: vi.fn(),
    },
    mockDb: {
      walletTransaction: { findMany: vi.fn() },
      topUpRequest: { findMany: vi.fn() },
      user: { findMany: vi.fn() },
    },
    mockRateLimit: {
      getClientIdentifier: vi.fn().mockResolvedValue("ip-test-1"),
      rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
      rateLimitMessage: vi.fn().mockReturnValue("Rate limited"),
    },
    mockNotifications: {
      createNotification: vi.fn(),
    },
  };
});

vi.mock("@/lib/auth/session", () => ({
  authorize: mockAuth.authorize,
}));
vi.mock("@/lib/wallet/wallet-service", () => mockWalletService);
vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/security/rate-limit", () => mockRateLimit);
vi.mock("@/lib/notifications", () => mockNotifications);

import {
  getSellerWalletAction,
  submitTopUpRequestAction,
  approveTopUpAction,
  rejectTopUpAction,
} from "./wallet";

describe("Wallet Server Actions Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSellerWalletAction", () => {
    it("rejects unauthenticated requests", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: false,
        error: "You must be signed in as a supplier or administrator to access this.",
      });

      const res = await getSellerWalletAction();
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("signed in as a supplier");
      }
    });

    it("returns balances and mapped transactions when authorized", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: true,
        user: { id: "seller-1", role: "SELLER" },
      });

      mockWalletService.getOrCreateSellerWallet.mockResolvedValueOnce({
        walletId: "w-1",
        sellerId: "seller-1",
        cashBalance: 1200,
        creditBalance: 300,
        totalSpendable: 1500,
      });

      mockDb.walletTransaction.findMany.mockResolvedValueOnce([
        {
          id: "tx-1",
          amount: 500,
          type: "TOP_UP",
          status: "COMPLETED",
          reference: "REF-1",
          description: "Telebirr top up",
          balanceAfterCash: 1200,
          balanceAfterCredit: 300,
          createdAt: new Date("2026-03-01T10:00:00Z"),
        },
      ]);

      mockDb.topUpRequest.findMany.mockResolvedValueOnce([]);

      const res = await getSellerWalletAction();
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.cashBalance).toBe(1200);
        expect(res.data.creditBalance).toBe(300);
        expect(res.data.totalSpendable).toBe(1500);
        expect(res.data.transactions).toHaveLength(1);
        expect(res.data.transactions[0].amount).toBe(500);
      }
    });
  });

  describe("submitTopUpRequestAction", () => {
    it("validates amount must be positive and meet minimum", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: true,
        user: { id: "seller-1", role: "SELLER" },
      });

      const formData = new FormData();
      formData.append("amount", "20"); // Below minimum (50)
      formData.append("paymentMethod", "TELEBIRR");
      formData.append("referenceCode", "TB-12345");

      const res = await submitTopUpRequestAction(formData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Minimum deposit");
      }
    });

    it("enforces rate limits on top-up submissions", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: true,
        user: { id: "seller-1", role: "SELLER" },
      });
      mockRateLimit.rateLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 });
      mockRateLimit.rateLimit.mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 });

      const formData = new FormData();
      formData.append("amount", "1000");
      formData.append("paymentMethod", "TELEBIRR");
      formData.append("referenceCode", "TB-VALID-123");

      const res = await submitTopUpRequestAction(formData);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Rate limited");
      }
    });

    it("successfully creates top-up request and alerts admins", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: true,
        user: { id: "seller-1", role: "SELLER", name: "Kebede" },
      });
      mockRateLimit.rateLimit.mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 });
      mockRateLimit.rateLimit.mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 });
      mockWalletService.submitWalletTopUpRequest.mockResolvedValueOnce({ id: "top-new" });
      mockDb.user.findMany.mockResolvedValueOnce([{ id: "admin-1" }]);

      const formData = new FormData();
      formData.append("amount", "1000");
      formData.append("paymentMethod", "TELEBIRR");
      formData.append("referenceCode", "TB-VALID-999");

      const res = await submitTopUpRequestAction(formData);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.topUpId).toBe("top-new");
      }
      expect(mockWalletService.submitWalletTopUpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerId: "seller-1",
          amount: 1000,
          paymentMethod: "TELEBIRR",
          referenceCode: "TB-VALID-999",
        })
      );
    });
  });

  describe("approveTopUpAction", () => {
    it("blocks non-admin users from approving deposits", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: false,
        error: "Administrator permission required.",
      });

      const res = await approveTopUpAction("top-1");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Administrator permission required.");
      }
    });

    it("approves deposit and notifies seller when admin acts", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: true,
        user: { id: "admin-1", role: "ADMIN" },
      });

      mockWalletService.approveTopUpRequest.mockResolvedValueOnce({
        success: true,
        topUpId: "top-1",
        sellerId: "seller-1",
        referenceCode: "TB-12345",
        amount: 2500,
        newCashBalance: 5000,
      });

      const res = await approveTopUpAction("top-1");
      expect(res.success).toBe(true);
      expect(mockWalletService.approveTopUpRequest).toHaveBeenCalledWith({
        topUpId: "top-1",
        adminUserId: "admin-1",
      });
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "seller-1",
          type: "WALLET_TOPPED_UP",
        })
      );
    });
  });

  describe("rejectTopUpAction", () => {
    it("blocks non-admin users from rejecting deposits", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: false,
        error: "Administrator permission required.",
      });

      const res = await rejectTopUpAction("top-1", "Fake receipt");
      expect(res.success).toBe(false);
    });

    it("rejects deposit and notifies seller", async () => {
      mockAuth.authorize.mockResolvedValueOnce({
        ok: true,
        user: { id: "admin-1", role: "ADMIN" },
      });

      mockWalletService.rejectTopUpRequest.mockResolvedValueOnce({
        success: true,
        topUpId: "top-1",
        status: "FAILED",
      });

      const res = await rejectTopUpAction("top-1", "Slip does not match CBE transaction");
      expect(res.success).toBe(true);
      expect(mockWalletService.rejectTopUpRequest).toHaveBeenCalledWith({
        topUpId: "top-1",
        adminUserId: "admin-1",
        reason: "Slip does not match CBE transaction",
      });
    });
  });
});
