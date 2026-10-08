import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma, EnquiryStatus, WalletTxStatus, WalletTxType, RefundStatus, OutcomeType } from "@prisma/client";
import { DomainError } from "@/lib/errors";

vi.mock("server-only", () => ({}));

const { mockTx, mockDb } = vi.hoisted(() => {
  const tx = {
    enquiry: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    wallet: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    walletTransaction: {
      create: vi.fn(),
    },
    unlockRecord: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    sellerProfile: {
      upsert: vi.fn(),
    },
    topUpRequest: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const db = {
    ...tx,
    topUpRequest: {
      ...tx.topUpRequest,
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  return { mockTx: tx, mockDb: db };
});

vi.mock("@/lib/db", () => ({ db: mockDb }));

import {
  getOrCreateSellerWallet,
  canAffordUnlock,
  executeUnlockIntroductionTransaction,
  processDealFailureRefund,
  submitWalletTopUpRequest,
  approveTopUpRequest,
  rejectTopUpRequest,
} from "./wallet-service";

describe("Wallet Service Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateSellerWallet", () => {
    it("returns existing wallet with spendable sum", async () => {
      mockDb.wallet.findUnique.mockResolvedValueOnce({
        id: "w-1",
        sellerId: "seller-1",
        cashBalance: new Prisma.Decimal(500),
        creditBalance: new Prisma.Decimal(200),
      });

      const res = await getOrCreateSellerWallet("seller-1");
      expect(res.walletId).toBe("w-1");
      expect(res.cashBalance).toBe(500);
      expect(res.creditBalance).toBe(200);
      expect(res.totalSpendable).toBe(700);
    });

    it("creates wallet with zero balance if none exists", async () => {
      mockDb.wallet.findUnique.mockResolvedValueOnce(null);
      mockDb.wallet.create.mockResolvedValueOnce({
        id: "w-new",
        sellerId: "seller-2",
        cashBalance: new Prisma.Decimal(0),
        creditBalance: new Prisma.Decimal(0),
      });

      const res = await getOrCreateSellerWallet("seller-2");
      expect(res.walletId).toBe("w-new");
      expect(res.totalSpendable).toBe(0);
      expect(mockDb.wallet.create).toHaveBeenCalledWith({
        data: { sellerId: "seller-2", cashBalance: 0, creditBalance: 0 },
      });
    });
  });

  describe("canAffordUnlock", () => {
    it("returns canAfford: true when total spendable covers fee", async () => {
      mockDb.wallet.findUnique.mockResolvedValueOnce({
        id: "w-1",
        sellerId: "seller-1",
        cashBalance: new Prisma.Decimal(300),
        creditBalance: new Prisma.Decimal(100),
      });

      const res = await canAffordUnlock("seller-1", 350);
      expect(res.canAfford).toBe(true);
      expect(res.deficit).toBe(0);
      expect(res.totalSpendable).toBe(400);
    });

    it("returns canAfford: false with deficit when funds are insufficient", async () => {
      mockDb.wallet.findUnique.mockResolvedValueOnce({
        id: "w-1",
        sellerId: "seller-1",
        cashBalance: new Prisma.Decimal(100),
        creditBalance: new Prisma.Decimal(50),
      });

      const res = await canAffordUnlock("seller-1", 400);
      expect(res.canAfford).toBe(false);
      expect(res.deficit).toBe(250);
    });
  });

  describe("executeUnlockIntroductionTransaction", () => {
    const validEnquiry = {
      id: "enq-1",
      sellerId: "seller-1",
      buyerId: "buyer-1",
      status: EnquiryStatus.PENDING,
      referenceCode: "ENQ-1234",
      deliveryAddress: "Bole Medhanialem",
      buyer: { id: "buyer-1", name: "Abebe", phone: "+251911111111", companyName: "Abebe GC" },
      seller: { id: "seller-1", name: "Kebede", phone: "+251922222222", companyName: "Kebede Materials" },
      listing: { id: "list-1", location: "Kality", product: { title: "Dangote Cement 42.5R" } },
    };

    it("throws DomainError if enquiry does not exist", async () => {
      mockTx.enquiry.findUnique.mockResolvedValueOnce(null);

      await expect(
        executeUnlockIntroductionTransaction({
          enquiryId: "missing-enq",
          sellerId: "seller-1",
          buyerId: "buyer-1",
          feeAmount: 300,
        })
      ).rejects.toThrow("Enquiry not found.");
    });

    it("throws DomainError if seller does not own enquiry", async () => {
      mockTx.enquiry.findUnique.mockResolvedValueOnce({
        ...validEnquiry,
        sellerId: "different-seller",
      });

      await expect(
        executeUnlockIntroductionTransaction({
          enquiryId: "enq-1",
          sellerId: "seller-1",
          buyerId: "buyer-1",
          feeAmount: 300,
        })
      ).rejects.toThrow("Enquiry seller does not match the wallet being charged.");
    });

    it("throws DomainError if enquiry is not in PENDING status", async () => {
      mockTx.enquiry.findUnique.mockResolvedValueOnce({
        ...validEnquiry,
        status: EnquiryStatus.ACCEPTED,
      });

      await expect(
        executeUnlockIntroductionTransaction({
          enquiryId: "enq-1",
          sellerId: "seller-1",
          buyerId: "buyer-1",
          feeAmount: 300,
        })
      ).rejects.toThrow("already accepted");
    });

    it("throws DomainError if atomic lock detects concurrent acceptance", async () => {
      mockTx.enquiry.findUnique.mockResolvedValueOnce(validEnquiry);
      mockTx.enquiry.updateMany.mockResolvedValueOnce({ count: 0 }); // concurrent update won the race

      await expect(
        executeUnlockIntroductionTransaction({
          enquiryId: "enq-1",
          sellerId: "seller-1",
          buyerId: "buyer-1",
          feeAmount: 300,
        })
      ).rejects.toThrow("already answered or declined");
    });

    it("throws DomainError if balance changed during race condition guard", async () => {
      mockTx.enquiry.findUnique.mockResolvedValueOnce(validEnquiry);
      mockTx.enquiry.updateMany.mockResolvedValueOnce({ count: 1 });
      mockTx.wallet.findUnique.mockResolvedValueOnce({
        id: "w-1",
        sellerId: "seller-1",
        cashBalance: new Prisma.Decimal(500),
        creditBalance: new Prisma.Decimal(100),
      });
      mockTx.wallet.updateMany.mockResolvedValueOnce({ count: 0 }); // balance changed concurrently

      await expect(
        executeUnlockIntroductionTransaction({
          enquiryId: "enq-1",
          sellerId: "seller-1",
          buyerId: "buyer-1",
          feeAmount: 300,
        })
      ).rejects.toThrow("wallet balance changed");
    });

    it("successfully debits credit first, records ledger, and reveals unmasked contacts", async () => {
      mockTx.enquiry.findUnique.mockResolvedValueOnce(validEnquiry);
      mockTx.enquiry.updateMany.mockResolvedValueOnce({ count: 1 });
      mockTx.wallet.findUnique.mockResolvedValueOnce({
        id: "w-1",
        sellerId: "seller-1",
        cashBalance: new Prisma.Decimal(1000),
        creditBalance: new Prisma.Decimal(200), // has 200 credit
      });
      mockTx.wallet.updateMany.mockResolvedValueOnce({ count: 1 });
      mockTx.walletTransaction.create.mockResolvedValueOnce({ id: "tx-1" });
      mockTx.unlockRecord.create.mockResolvedValueOnce({ id: "unlock-1" });

      // Fee is 350: 200 from credit, 150 from cash
      const res = await executeUnlockIntroductionTransaction({
        enquiryId: "enq-1",
        sellerId: "seller-1",
        buyerId: "buyer-1",
        feeAmount: 350,
      });

      expect(res.success).toBe(true);
      expect(res.paidFromCredit).toBe(200);
      expect(res.paidFromCash).toBe(150);
      expect(res.walletBalances.cashBalance).toBe(850);
      expect(res.walletBalances.creditBalance).toBe(0);

      // Ledger verification
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          walletId: "w-1",
          amount: new Prisma.Decimal(-350),
          type: WalletTxType.UNLOCK_FEE,
          status: WalletTxStatus.COMPLETED,
        }),
      });

      // Unlock record verification
      expect(mockTx.unlockRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          enquiryId: "enq-1",
          sellerId: "seller-1",
          buyerId: "buyer-1",
          feeAmount: new Prisma.Decimal(350),
          paidFromCash: new Prisma.Decimal(150),
          paidFromCredit: new Prisma.Decimal(200),
        }),
      });

      // Revealed contacts verification
      expect(res.buyerContact.phone).toBe("+251911111111");
      expect(res.sellerContact.phone).toBe("+251922222222");
    });
  });

  describe("processDealFailureRefund", () => {
    const validUnlock = {
      id: "unl-1",
      sellerId: "seller-1",
      feeAmount: new Prisma.Decimal(500),
      refundStatus: RefundStatus.NONE,
      sellerReportedOutcome: OutcomeType.PENDING,
      enquiry: { referenceCode: "ENQ-5678" },
      seller: { id: "seller-1", name: "Kebede" },
    };

    it("throws DomainError if unlock record is not found", async () => {
      mockTx.unlockRecord.findUnique.mockResolvedValueOnce(null);

      await expect(
        processDealFailureRefund({ unlockRecordId: "missing" })
      ).rejects.toThrow("Unlock record not found.");
    });

    it("throws DomainError if refund has already been processed", async () => {
      mockTx.unlockRecord.findUnique.mockResolvedValueOnce({
        ...validUnlock,
        refundStatus: RefundStatus.REFUNDED_CREDIT,
      });

      await expect(
        processDealFailureRefund({ unlockRecordId: "unl-1" })
      ).rejects.toThrow("already been processed");
    });

    it("credits 80% to non-withdrawable credit and guards against double refund", async () => {
      mockTx.unlockRecord.findUnique.mockResolvedValueOnce(validUnlock);
      mockTx.wallet.findUnique.mockResolvedValueOnce({ id: "w-1", sellerId: "seller-1" });
      mockTx.wallet.update.mockResolvedValueOnce({
        id: "w-1",
        cashBalance: new Prisma.Decimal(300),
        creditBalance: new Prisma.Decimal(400), // was 0 + 400 (80% of 500)
      });
      mockTx.walletTransaction.create.mockResolvedValueOnce({ id: "tx-refund" });
      mockTx.unlockRecord.updateMany.mockResolvedValueOnce({ count: 1 });
      mockTx.sellerProfile.upsert.mockResolvedValueOnce({});

      const res = await processDealFailureRefund({
        unlockRecordId: "unl-1",
        refundPercentage: 80,
        reason: "Contractor bought elsewhere",
      });

      expect(res.success).toBe(true);
      expect(res.refundAmount).toBe(400); // 80% of 500
      expect(res.newCreditBalance).toBe(400);

      expect(mockTx.wallet.update).toHaveBeenCalledWith({
        where: { id: "w-1" },
        data: { creditBalance: { increment: new Prisma.Decimal(400) } },
      });

      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: WalletTxType.REFUND_CREDIT,
          amount: new Prisma.Decimal(400),
        }),
      });

      expect(mockTx.unlockRecord.updateMany).toHaveBeenCalledWith({
        where: { id: "unl-1", refundStatus: RefundStatus.NONE },
        data: expect.objectContaining({
          refundStatus: RefundStatus.REFUNDED_CREDIT,
          refundCreditAmount: new Prisma.Decimal(400),
        }),
      });
    });

    it("rolls back if concurrent refund won the race", async () => {
      mockTx.unlockRecord.findUnique.mockResolvedValueOnce(validUnlock);
      mockTx.wallet.findUnique.mockResolvedValueOnce({ id: "w-1", sellerId: "seller-1" });
      mockTx.wallet.update.mockResolvedValueOnce({
        id: "w-1",
        cashBalance: new Prisma.Decimal(300),
        creditBalance: new Prisma.Decimal(400),
      });
      mockTx.walletTransaction.create.mockResolvedValueOnce({ id: "tx-refund" });
      mockTx.unlockRecord.updateMany.mockResolvedValueOnce({ count: 0 }); // another process updated it

      await expect(
        processDealFailureRefund({ unlockRecordId: "unl-1" })
      ).rejects.toThrow("already been processed");
    });
  });

  describe("submitWalletTopUpRequest", () => {
    it("rejects duplicate deposit reference if already pending or completed", async () => {
      mockDb.wallet.findUnique.mockResolvedValueOnce({
        id: "w-1",
        sellerId: "seller-1",
        cashBalance: new Prisma.Decimal(0),
        creditBalance: new Prisma.Decimal(0),
      });
      mockDb.topUpRequest.findFirst.mockResolvedValueOnce({
        status: WalletTxStatus.PENDING,
      });

      await expect(
        submitWalletTopUpRequest({
          sellerId: "seller-1",
          amount: 5000,
          paymentMethod: "TELEBIRR",
          referenceCode: "TX-DUPLICATE-999",
        })
      ).rejects.toThrow("already awaiting review");
    });

    it("creates pending topUp request for novel reference", async () => {
      mockDb.wallet.findUnique.mockResolvedValueOnce({
        id: "w-1",
        sellerId: "seller-1",
        cashBalance: new Prisma.Decimal(0),
        creditBalance: new Prisma.Decimal(0),
      });
      mockDb.topUpRequest.findFirst.mockResolvedValueOnce(null);
      mockDb.topUpRequest.create.mockResolvedValueOnce({ id: "top-1" });

      const res = await submitWalletTopUpRequest({
        sellerId: "seller-1",
        amount: 5000,
        paymentMethod: "TELEBIRR",
        referenceCode: "TX-UNIQUE-101",
      });

      expect(res.id).toBe("top-1");
      expect(mockDb.topUpRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sellerId: "seller-1",
          walletId: "w-1",
          amount: new Prisma.Decimal(5000),
          status: WalletTxStatus.PENDING,
        }),
        select: { id: true },
      });
    });
  });

  describe("approveTopUpRequest", () => {
    it("throws DomainError if top up request not found", async () => {
      mockTx.topUpRequest.findUnique.mockResolvedValueOnce(null);

      await expect(
        approveTopUpRequest({ topUpId: "missing-topup", adminUserId: "admin-1" })
      ).rejects.toThrow("Top-up request not found.");
    });

    it("throws DomainError if deposit was already reviewed", async () => {
      mockTx.topUpRequest.findUnique.mockResolvedValueOnce({
        id: "top-1",
        status: WalletTxStatus.COMPLETED,
      });
      mockTx.topUpRequest.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        approveTopUpRequest({ topUpId: "top-1", adminUserId: "admin-1" })
      ).rejects.toThrow("already been reviewed");
    });

    it("credits cash balance and records transaction on successful approval", async () => {
      mockTx.topUpRequest.findUnique.mockResolvedValueOnce({
        id: "top-1",
        walletId: "w-1",
        sellerId: "seller-1",
        amount: new Prisma.Decimal(3000),
        paymentMethod: "CBE_BANK",
        referenceCode: "CBE-987654",
        status: WalletTxStatus.PENDING,
      });
      mockTx.topUpRequest.updateMany.mockResolvedValueOnce({ count: 1 });
      mockTx.wallet.update.mockResolvedValueOnce({
        id: "w-1",
        cashBalance: new Prisma.Decimal(4500),
        creditBalance: new Prisma.Decimal(200),
      });
      mockTx.walletTransaction.create.mockResolvedValueOnce({});

      const res = await approveTopUpRequest({
        topUpId: "top-1",
        adminUserId: "admin-1",
      });

      expect(res.success).toBe(true);
      expect(res.amount).toBe(3000);
      expect(res.newCashBalance).toBe(4500);

      expect(mockTx.wallet.update).toHaveBeenCalledWith({
        where: { id: "w-1" },
        data: { cashBalance: { increment: new Prisma.Decimal(3000) } },
      });

      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: WalletTxType.TOP_UP,
          amount: new Prisma.Decimal(3000),
        }),
      });
    });
  });

  describe("rejectTopUpRequest", () => {
    it("marks deposit as FAILED if pending review", async () => {
      mockDb.topUpRequest.updateMany.mockResolvedValueOnce({ count: 1 });

      const res = await rejectTopUpRequest({
        topUpId: "top-fail",
        adminUserId: "admin-1",
        reason: "Invalid bank slip",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(WalletTxStatus.FAILED);
    });

    it("throws DomainError if deposit is no longer pending", async () => {
      mockDb.topUpRequest.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        rejectTopUpRequest({
          topUpId: "top-fail",
          adminUserId: "admin-1",
        })
      ).rejects.toThrow("no longer pending review");
    });
  });
});
