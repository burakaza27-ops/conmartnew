import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SubscriptionTier,
  PaymentMethod,
  WalletTxStatus,
  SubscriptionStatus,
  GuidedLeadStatus,
  SupplierLeadEventType,
} from "@prisma/client";

vi.mock("server-only", () => ({}));

const { mockTx, mockDb } = vi.hoisted(() => {
  const tx = {
    subscriptionPayment: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    subscriptionPlan: {
      findUnique: vi.fn(),
    },
    sellerProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    guidedLead: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    supplierLeadEvent: {
      groupBy: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    product: {
      create: vi.fn(),
      update: vi.fn(),
    },
    listing: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    priceTier: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  };

  const db = {
    ...tx,
    subscriptionPayment: {
      ...tx.subscriptionPayment,
    },
    $transaction: vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  return { mockTx: tx, mockDb: db };
});

vi.mock("@/lib/db", () => ({ db: mockDb }));

import {
  submitSubscriptionPayment,
  reviewSubscriptionPayment,
  getSupplierLeadsSummary,
} from "@/lib/subscription/subscription-service";
import { assignGuidedLead } from "@/lib/leads/guided-lead-service";

describe("Database Integrity & Concurrency Race Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reviewSubscriptionPayment Atomic State Guards", () => {
    it("successfully approves pending payment and credits subscription tier", async () => {
      const mockPayment = {
        id: "pay-1",
        sellerId: "seller-1",
        tier: SubscriptionTier.PREMIUM,
        status: WalletTxStatus.PENDING,
        seller: {
          sellerProfile: {
            subscriptionExpiresAt: null,
          },
        },
      };

      mockDb.subscriptionPayment.findUnique.mockResolvedValueOnce(mockPayment);
      mockTx.subscriptionPayment.updateMany.mockResolvedValueOnce({ count: 1 });
      mockTx.subscriptionPlan.findUnique.mockResolvedValueOnce({
        durationDays: 30,
      });
      mockTx.sellerProfile.update.mockResolvedValueOnce({});
      mockTx.subscriptionPayment.findUniqueOrThrow.mockResolvedValueOnce({
        ...mockPayment,
        status: WalletTxStatus.COMPLETED,
      });

      const res = await reviewSubscriptionPayment({
        paymentId: "pay-1",
        adminId: "admin-1",
        approved: true,
      });

      expect(res.status).toBe(WalletTxStatus.COMPLETED);
      expect(mockTx.subscriptionPayment.updateMany).toHaveBeenCalledWith({
        where: {
          id: "pay-1",
          status: WalletTxStatus.PENDING,
        },
        data: expect.objectContaining({
          status: WalletTxStatus.COMPLETED,
          reviewedBy: "admin-1",
        }),
      });
      expect(mockTx.sellerProfile.update).toHaveBeenCalledWith({
        where: { userId: "seller-1" },
        data: expect.objectContaining({
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionTier: SubscriptionTier.PREMIUM,
        }),
      });
    });

    it("prevents double-credit race condition when status was already processed (updateMany count: 0)", async () => {
      mockDb.subscriptionPayment.findUnique.mockResolvedValueOnce({
        id: "pay-1",
        sellerId: "seller-1",
        tier: SubscriptionTier.PREMIUM,
        status: WalletTxStatus.PENDING,
        seller: { sellerProfile: null },
      });

      // Another concurrent worker updated the payment first: count is 0
      mockTx.subscriptionPayment.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        reviewSubscriptionPayment({
          paymentId: "pay-1",
          adminId: "admin-1",
          approved: true,
        })
      ).rejects.toThrow("Payment has already been processed or is no longer pending.");

      // Critical assertion: seller profile MUST NOT be credited
      expect(mockTx.sellerProfile.update).not.toHaveBeenCalled();
    });

    it("proves TOCTOU race immunity under simultaneous parallel execution (Promise.all)", async () => {
      // Simulate stateful database row under concurrent access
      let dbStatus = WalletTxStatus.PENDING;
      let sellerTierCredits = 0;

      const mockPayment = {
        id: "pay-race-1",
        sellerId: "seller-1",
        tier: SubscriptionTier.PREMIUM,
        get status() {
          return dbStatus;
        },
        seller: {
          sellerProfile: {
            subscriptionExpiresAt: null,
          },
        },
      };

      // Both concurrent requests read the pending payment initially (simulating TOCTOU window)
      mockDb.subscriptionPayment.findUnique.mockImplementation(async () => ({
        ...mockPayment,
        status: dbStatus,
      }));

      // In the database transaction, only the first atomic updateMany can match PENDING and transition
      mockTx.subscriptionPayment.updateMany.mockImplementation(async ({ where, data }) => {
        if (
          where.id === "pay-race-1" &&
          where.status === WalletTxStatus.PENDING &&
          dbStatus === WalletTxStatus.PENDING
        ) {
          dbStatus = data.status;
          return { count: 1 };
        }
        return { count: 0 };
      });

      mockTx.subscriptionPlan.findUnique.mockResolvedValue({ durationDays: 30 });
      mockTx.sellerProfile.update.mockImplementation(async () => {
        sellerTierCredits++;
        return {};
      });
      mockTx.subscriptionPayment.findUniqueOrThrow.mockImplementation(async () => ({
        ...mockPayment,
        status: dbStatus,
      }));

      // Fire 5 concurrent approval requests in parallel simultaneously via Promise.allSettled
      const concurrentAttempts = 5;
      const promises = Array.from({ length: concurrentAttempts }, (_, i) =>
        reviewSubscriptionPayment({
          paymentId: "pay-race-1",
          adminId: `admin-${i + 1}`,
          approved: true,
        })
      );

      const results = await Promise.allSettled(promises);

      // Verify outcomes under simultaneous parallel execution:
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly ONE caller succeeds
      expect(fulfilled).toHaveLength(1);
      // All other parallel callers fail with concurrency guard error
      expect(rejected).toHaveLength(concurrentAttempts - 1);

      rejected.forEach((r) => {
        expect((r as PromiseRejectedResult).reason.message).toMatch(
          /Payment has already been processed or is no longer pending/
        );
      });

      // Crucial: seller profile MUST have been credited exactly ONCE
      expect(sellerTierCredits).toBe(1);
      expect(dbStatus).toBe(WalletTxStatus.COMPLETED);
    });
  });

  describe("assignGuidedLead Atomic Hijacking Prevention", () => {
    it("successfully assigns lead when status is NEW", async () => {
      mockDb.guidedLead.updateMany.mockResolvedValueOnce({ count: 1 });
      mockDb.guidedLead.findUniqueOrThrow.mockResolvedValueOnce({
        id: "lead-1",
        assignedAgentId: "agent-1",
        status: GuidedLeadStatus.ASSIGNED,
      });

      const lead = await assignGuidedLead("lead-1", "agent-1");
      expect(lead.status).toBe(GuidedLeadStatus.ASSIGNED);
      expect(mockDb.guidedLead.updateMany).toHaveBeenCalledWith({
        where: {
          id: "lead-1",
          status: GuidedLeadStatus.NEW,
        },
        data: {
          assignedAgentId: "agent-1",
          status: GuidedLeadStatus.ASSIGNED,
        },
      });
    });

    it("rejects assignment if lead is already assigned or closed (count: 0)", async () => {
      mockDb.guidedLead.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(assignGuidedLead("lead-already-assigned", "agent-2")).rejects.toThrow(
        "Guided lead is no longer available for assignment or has already been assigned."
      );
    });

    it("proves lead assignment race immunity under simultaneous parallel execution (Promise.all)", async () => {
      let leadStatus = GuidedLeadStatus.NEW;
      let assignedAgent: string | null = null;
      let assignmentCount = 0;

      mockDb.guidedLead.updateMany.mockImplementation(async ({ where, data }) => {
        if (
          where.id === "lead-race-1" &&
          where.status === GuidedLeadStatus.NEW &&
          leadStatus === GuidedLeadStatus.NEW
        ) {
          leadStatus = data.status;
          assignedAgent = data.assignedAgentId;
          assignmentCount++;
          return { count: 1 };
        }
        return { count: 0 };
      });

      mockDb.guidedLead.findUniqueOrThrow.mockImplementation(async () => ({
        id: "lead-race-1",
        status: leadStatus,
        assignedAgentId: assignedAgent,
      }));

      // 5 field agents simultaneously attempt to claim the exact same lead
      const concurrentAgents = 5;
      const promises = Array.from({ length: concurrentAgents }, (_, i) =>
        assignGuidedLead("lead-race-1", `agent-${i + 1}`)
      );

      const results = await Promise.allSettled(promises);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // Exactly ONE agent must win the race
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(concurrentAgents - 1);

      // The other 4 losing agents receive rejection
      rejected.forEach((r) => {
        expect((r as PromiseRejectedResult).reason.message).toMatch(
          /Guided lead is no longer available for assignment or has already been assigned/
        );
      });

      expect(leadStatus).toBe(GuidedLeadStatus.ASSIGNED);
      expect(assignmentCount).toBe(1);
      expect(assignedAgent).toBeDefined();
    });
  });

  describe("submitSubscriptionPayment Normalization & Unique Constraint", () => {
    it("normalizes reference code to uppercase and trimmed", async () => {
      mockDb.subscriptionPlan.findUnique.mockResolvedValueOnce({
        tier: SubscriptionTier.FEATURED,
        priceETB: 1500,
      });
      mockDb.subscriptionPayment.findUnique.mockResolvedValueOnce(null);
      mockDb.subscriptionPayment.create.mockResolvedValueOnce({
        id: "sub-1",
        referenceCode: "TX-TEST-NORMALIZED",
      });
      mockDb.sellerProfile.update.mockResolvedValueOnce({});

      await submitSubscriptionPayment({
        sellerId: "seller-1",
        tier: SubscriptionTier.FEATURED,
        paymentMethod: PaymentMethod.TELEBIRR,
        referenceCode: "  tx-test-normalized  ",
      });

      expect(mockDb.subscriptionPayment.findUnique).toHaveBeenCalledWith({
        where: { referenceCode: "TX-TEST-NORMALIZED" },
        select: { status: true },
      });
      expect(mockDb.subscriptionPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          referenceCode: "TX-TEST-NORMALIZED",
        }),
      });
    });

    it("rejects duplicate active reference codes", async () => {
      mockDb.subscriptionPlan.findUnique.mockResolvedValueOnce({
        tier: SubscriptionTier.FEATURED,
        priceETB: 1500,
      });
      mockDb.subscriptionPayment.findUnique.mockResolvedValueOnce({
        status: WalletTxStatus.PENDING,
      });

      await expect(
        submitSubscriptionPayment({
          sellerId: "seller-2",
          tier: SubscriptionTier.FEATURED,
          paymentMethod: PaymentMethod.TELEBIRR,
          referenceCode: "TX-ALREADY-SUBMITTED",
        })
      ).rejects.toThrow("already awaiting review");
    });

    it("proves duplicate reference submission race prevention under parallel execution (Promise.all)", async () => {
      mockDb.subscriptionPlan.findUnique.mockResolvedValue({
        tier: SubscriptionTier.FEATURED,
        priceETB: 1500,
      });

      const existingReferences = new Set<string>();

      mockDb.subscriptionPayment.findUnique.mockImplementation(async ({ where }) => {
        if (existingReferences.has(where.referenceCode)) {
          return { status: WalletTxStatus.PENDING };
        }
        return null;
      });

      mockDb.subscriptionPayment.create.mockImplementation(async ({ data }) => {
        if (existingReferences.has(data.referenceCode)) {
          const err = new Error("Unique constraint failed on the fields: (`referenceCode`)");
          (err as unknown as { code: string }).code = "P2002";
          throw err;
        }
        existingReferences.add(data.referenceCode);
        return { id: "sub-1", referenceCode: data.referenceCode };
      });

      mockDb.sellerProfile.update.mockResolvedValue({});

      // Two simultaneous submissions with the exact same reference code in parallel
      const [res1, res2] = await Promise.allSettled([
        submitSubscriptionPayment({
          sellerId: "seller-1",
          tier: SubscriptionTier.FEATURED,
          paymentMethod: PaymentMethod.TELEBIRR,
          referenceCode: "TX-PARALLEL-DUPE-100",
        }),
        submitSubscriptionPayment({
          sellerId: "seller-2",
          tier: SubscriptionTier.FEATURED,
          paymentMethod: PaymentMethod.TELEBIRR,
          referenceCode: "tx-parallel-dupe-100",
        }),
      ]);

      const fulfilled = [res1, res2].filter((r) => r.status === "fulfilled");
      const rejected = [res1, res2].filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(existingReferences.size).toBe(1);
    });
  });

  describe("getSupplierLeadsSummary Database Aggregation", () => {
    it("aggregates analytics using database groupBy and count instead of heap arrays", async () => {
      mockDb.sellerProfile.findUnique.mockResolvedValueOnce({
        subscriptionTier: SubscriptionTier.FEATURED,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });

      mockDb.supplierLeadEvent.groupBy.mockResolvedValueOnce([
        { eventType: SupplierLeadEventType.VIEW, _count: { eventType: 420 } },
        { eventType: SupplierLeadEventType.CALL_CLICK, _count: { eventType: 15 } },
        { eventType: SupplierLeadEventType.WHATSAPP_CLICK, _count: { eventType: 10 } },
        { eventType: SupplierLeadEventType.DIRECTIONS_CLICK, _count: { eventType: 5 } },
        { eventType: SupplierLeadEventType.AGENT_DELIVERED, _count: { eventType: 2 } },
      ]);

      mockDb.supplierLeadEvent.count
        .mockResolvedValueOnce(20) // previous week interactions
        .mockResolvedValueOnce(1850); // monthly views

      const summary = await getSupplierLeadsSummary("seller-1");

      expect(summary.weeklyViews).toBe(420);
      expect(summary.monthlyViews).toBe(1850);
      expect(summary.weeklyCallClicks).toBe(15);
      expect(summary.weeklyWhatsAppClicks).toBe(10);
      expect(summary.totalInteractionsThisWeek).toBe(32); // 15 + 10 + 5 + 2
      expect(summary.totalInteractionsLastWeek).toBe(20);
      expect(summary.weeklyGrowthPercentage).toBe(60); // (32 - 20) / 20 * 100

      // Verify db.supplierLeadEvent.groupBy was called
      expect(mockDb.supplierLeadEvent.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ["eventType"],
          _count: { eventType: true },
        })
      );
    });
  });
});
