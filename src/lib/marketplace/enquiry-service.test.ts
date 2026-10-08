import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      enquiry: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      sellerProfile: {
        findUnique: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      listing: {
        findUnique: vi.fn(),
      },
      unlockRecord: {
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/wallet/wallet-service", () => ({
  executeUnlockIntroductionTransaction: vi.fn(),
  processDealFailureRefund: vi.fn(),
}));
vi.mock("@/lib/marketplace/service", () => ({
  ensureDealTicketForEnquiry: vi.fn(),
}));

import {
  sellerDeclineEnquiry,
  resolveEnquiryBuyer,
  suspendSellerIfUnreliable,
  SUSPENSION_MIN_FAILED_DEALS,
  SUSPENSION_FAILURE_RATE,
} from "./enquiry-service";
import { DomainError } from "@/lib/errors";

describe("Enquiry Domain Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sellerDeclineEnquiry", () => {
    it("throws if enquiry is not found", async () => {
      mockDb.enquiry.findUnique.mockResolvedValueOnce(null);

      await expect(
        sellerDeclineEnquiry({ id: "seller-1", role: "SELLER" }, "enq-1")
      ).rejects.toThrow(DomainError);
    });

    it("throws if caller is not the seller and not an ADMIN", async () => {
      mockDb.enquiry.findUnique.mockResolvedValueOnce({
        id: "enq-1",
        sellerId: "seller-1",
        buyerId: "buyer-1",
        status: "PENDING",
      });

      await expect(
        sellerDeclineEnquiry({ id: "seller-2", role: "SELLER" }, "enq-1")
      ).rejects.toThrow(/Enquiry not found/);
    });

    it("blocks declining an already accepted enquiry (only legal from PENDING)", async () => {
      mockDb.enquiry.findUnique.mockResolvedValueOnce({
        id: "enq-1",
        sellerId: "seller-1",
        buyerId: "buyer-1",
        status: "ACCEPTED",
      });

      await expect(
        sellerDeclineEnquiry({ id: "seller-1", role: "SELLER" }, "enq-1")
      ).rejects.toThrow(/already accepted/);
    });

    it("blocks declining an already declined enquiry", async () => {
      mockDb.enquiry.findUnique.mockResolvedValueOnce({
        id: "enq-1",
        sellerId: "seller-1",
        buyerId: "buyer-1",
        status: "DECLINED",
      });

      await expect(
        sellerDeclineEnquiry({ id: "seller-1", role: "SELLER" }, "enq-1")
      ).rejects.toThrow(/already declined/);
    });

    it("successfully marks enquiry DECLINED when valid", async () => {
      mockDb.enquiry.findUnique.mockResolvedValueOnce({
        id: "enq-1",
        sellerId: "seller-1",
        buyerId: "buyer-1",
        status: "PENDING",
      });
      mockDb.enquiry.updateMany.mockResolvedValueOnce({ count: 1 });

      await sellerDeclineEnquiry({ id: "seller-1", role: "SELLER" }, "enq-1");

      expect(mockDb.enquiry.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "enq-1",
            sellerId: "seller-1",
            status: "PENDING",
          }),
          data: expect.objectContaining({
            status: "DECLINED",
          }),
        })
      );
    });
  });

  describe("resolveEnquiryBuyer", () => {
    it("resolves direct buyer when no on-behalf phone is provided", async () => {
      const res = await resolveEnquiryBuyer(
        { id: "buyer-123", role: "BUYER" },
        {}
      );
      expect(res).toEqual({ buyerId: "buyer-123", agentId: null });
    });

    it("throws if a regular BUYER attempts assisted capture with a phone number", async () => {
      await expect(
        resolveEnquiryBuyer(
          { id: "buyer-123", role: "BUYER" },
          { onBehalfOfBuyerPhone: "+251911223344" }
        )
      ).rejects.toThrow(/Only ConMart field agents can raise a request/);
    });

    it("throws if assisted phone matches an existing registered user", async () => {
      mockDb.user.findFirst
        .mockResolvedValueOnce(null) // no offline user
        .mockResolvedValueOnce({ id: "reg-user-1" }); // registered user found

      await expect(
        resolveEnquiryBuyer(
          { id: "agent-1", role: "FIELD_AGENT" },
          { onBehalfOfBuyerPhone: "+251911223344" }
        )
      ).rejects.toThrow(/belongs to a registered ConMart account/);
    });

    it("reuses existing offline buyer profile when available", async () => {
      mockDb.user.findFirst.mockResolvedValueOnce({ id: "offline-1" });

      const res = await resolveEnquiryBuyer(
        { id: "agent-1", role: "FIELD_AGENT" },
        { onBehalfOfBuyerPhone: "+251911223344" }
      );

      expect(res).toEqual({ buyerId: "offline-1", agentId: "agent-1" });
      expect(mockDb.user.create).not.toHaveBeenCalled();
    });

    it("creates new offline buyer profile when not previously seen", async () => {
      mockDb.user.findFirst
        .mockResolvedValueOnce(null) // no offline user
        .mockResolvedValueOnce(null); // no registered user

      mockDb.user.create.mockResolvedValueOnce({ id: "new-offline-1" });

      const res = await resolveEnquiryBuyer(
        { id: "agent-1", role: "FIELD_AGENT" },
        { onBehalfOfBuyerPhone: "+251911223344", onBehalfOfBuyerName: "Abebe" }
      );

      expect(res).toEqual({ buyerId: "new-offline-1", agentId: "agent-1" });
      expect(mockDb.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "BUYER",
            authId: null,
            phone: "+251911223344",
            name: "Abebe",
          }),
        })
      );
    });
  });

  describe("suspendSellerIfUnreliable", () => {
    it("does not suspend if seller has fewer than SUSPENSION_MIN_FAILED_DEALS failed deals", async () => {
      mockDb.sellerProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        completedDealsCount: 0,
        failedDealsCount: SUSPENSION_MIN_FAILED_DEALS - 1,
      });

      await suspendSellerIfUnreliable("seller-1");
      expect(mockDb.sellerProfile.update).not.toHaveBeenCalled();
    });

    it("does not suspend if failure rate is at or below SUSPENSION_FAILURE_RATE", async () => {
      // 4 failed out of 10 total = 40% <= 60%
      mockDb.sellerProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        completedDealsCount: 6,
        failedDealsCount: 4,
      });

      await suspendSellerIfUnreliable("seller-1");
      expect(mockDb.sellerProfile.update).not.toHaveBeenCalled();
    });

    it("suspends seller when failed deals >= min and failure rate exceeds threshold", async () => {
      // 4 failed out of 5 total = 80% > 60%
      mockDb.sellerProfile.findUnique.mockResolvedValueOnce({
        id: "profile-1",
        completedDealsCount: 1,
        failedDealsCount: 4,
      });

      await suspendSellerIfUnreliable("seller-1");
      expect(mockDb.sellerProfile.update).toHaveBeenCalledWith({
        where: { id: "profile-1" },
        data: { verificationStatus: "SUSPENDED" },
      });
    });
  });
});
