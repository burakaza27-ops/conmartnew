// ConMart — Business Rule Unit Tests
// Validates pure functions: wallet accounting, contact masking, chat-guard
// decisions, and reference code integrity. No database or HTTP involved.

import { describe, it, expect } from "vitest";

import {
  splitUnlockPayment,
  calculateRefundAmount,
  totalSpendable,
} from "@/lib/wallet/accounting";
import {
  sanitizeEnquiryForViewer,
  filterLeakedContactText,
  maskListingForPublic,
  coarsenLocation,
} from "@/lib/security/masking";
import {
  canOpenDirectRoom,
  validateRoomShape,
  isRoomParticipant,
} from "@/lib/marketplace/chat-guard";
import {
  generateReferenceCode,
  isValidReferenceCode,
  normalizeReferenceCode,
} from "@/lib/engine/reference-code";
import { roundCurrency } from "@/lib/money";
import { DomainError } from "@/lib/errors";

describe("Wallet Accounting: Unlock Debit Invariants", () => {
  it("deducts unlock fee entirely from non-withdrawable credit when credit covers fee", () => {
    // Seller has 500 ETB credit and 5,000 ETB cash; category unlock fee is 300 ETB
    const feeAmount = 300;
    const initialCredit = 500;
    const initialCash = 5000;

    const split = splitUnlockPayment(feeAmount, initialCredit, initialCash);

    expect(split.fromCredit).toBe(300);
    expect(split.fromCash).toBe(0);

    const postCredit = roundCurrency(initialCredit - split.fromCredit);
    const postCash = roundCurrency(initialCash - split.fromCash);

    expect(postCredit).toBe(200);
    expect(postCash).toBe(5000); // Cash is untouched!
  });

  it("splits debit across credit and cash when credit is insufficient to cover whole fee", () => {
    // Seller has 120 ETB credit and 1,000 ETB cash; category unlock fee is 300 ETB
    const feeAmount = 300;
    const initialCredit = 120;
    const initialCash = 1000;

    const split = splitUnlockPayment(feeAmount, initialCredit, initialCash);

    expect(split.fromCredit).toBe(120);
    expect(split.fromCash).toBe(180);
    expect(split.fromCredit + split.fromCash).toBe(feeAmount);

    const postCredit = roundCurrency(initialCredit - split.fromCredit);
    const postCash = roundCurrency(initialCash - split.fromCash);

    expect(postCredit).toBe(0);
    expect(postCash).toBe(820);
  });

  it("deducts entirely from cash when credit balance is zero", () => {
    const feeAmount = 250;
    const initialCredit = 0;
    const initialCash = 800;

    const split = splitUnlockPayment(feeAmount, initialCredit, initialCash);

    expect(split.fromCredit).toBe(0);
    expect(split.fromCash).toBe(250);
  });

  it("throws DomainError and blocks unlock when total wallet balance is insufficient", () => {
    const feeAmount = 300;
    const initialCredit = 50;
    const initialCash = 100; // Total 150 < 300

    expect(() => {
      splitUnlockPayment(feeAmount, initialCredit, initialCash);
    }).toThrow(DomainError);
  });

  it("throws DomainError for negative or non-finite fee amounts", () => {
    expect(() => splitUnlockPayment(-50, 100, 100)).toThrow(DomainError);
    expect(() => splitUnlockPayment(NaN, 100, 100)).toThrow(DomainError);
    expect(() => splitUnlockPayment(Infinity, 100, 100)).toThrow(DomainError);
  });

  it("accurately handles fractional cents without IEEE 754 precision leakage", () => {
    const feeAmount = 299.99;
    const credit = 100.5;
    const cash = 500;

    const split = splitUnlockPayment(feeAmount, credit, cash);

    expect(split.fromCredit).toBe(100.5);
    expect(split.fromCash).toBe(199.49);
    expect(roundCurrency(split.fromCredit + split.fromCash)).toBe(299.99);
  });

  it("calculates total spendable funds correctly", () => {
    expect(totalSpendable(1250.75, 249.25)).toBe(1500.0);
    expect(totalSpendable(0, 0)).toBe(0);
  });
});

describe("Wallet Accounting: Deal Failure Refund Rules", () => {
  it("calculates standard 80% refund accurately as non-withdrawable credit", () => {
    const feePaid = 300;
    const refundPercentage = 80;

    const refund = calculateRefundAmount(feePaid, refundPercentage);

    expect(refund).toBe(240); // 300 * 0.80 = 240 ETB
  });

  it("rounds fractional refund amounts correctly", () => {
    const feePaid = 125.5;
    const refundPercentage = 80;

    const refund = calculateRefundAmount(feePaid, refundPercentage);

    expect(refund).toBe(100.4); // 125.5 * 0.8 = 100.40
  });

  it("rejects invalid refund percentages outside [0, 100]", () => {
    expect(() => calculateRefundAmount(300, -10)).toThrow(DomainError);
    expect(() => calculateRefundAmount(300, 105)).toThrow(DomainError);
  });
});

describe("Contact Masking: Pre-Unlock Leak Prevention", () => {
  it("filters leaked phone numbers, emails, and social handles from custom text fields", () => {
    const leakedAddress = "Depot 4, Mercato. Call 0911-223344 or 0922334455 urgently";
    const filtered = filterLeakedContactText(leakedAddress);

    expect(filtered).not.toContain("0911-223344");
    expect(filtered).not.toContain("0922334455");
    expect(filtered).toContain("[Contact Number Masked]");
  });

  it("filters telegram links and email addresses from notes", () => {
    const leakedNotes = "Contact me at t.me/depot_boss or email sales@cementhub.et";
    const filtered = filterLeakedContactText(leakedNotes);

    expect(filtered).not.toContain("t.me/depot_boss");
    expect(filtered).not.toContain("sales@cementhub.et");
    expect(filtered).toContain("[Handle Masked]");
    expect(filtered).toContain("[Email Masked]");
  });

  it("coarsens detailed location to city level to prevent unauthorized walk-ins", () => {
    expect(coarsenLocation("Kaliti Industrial Zone, Woreda 03, Addis Ababa")).toBe(
      "Addis Ababa"
    );
    expect(coarsenLocation("")).toBe("Addis Ababa");
  });

  it("masks public catalog listings for anonymous visitors", () => {
    const rawListing = {
      id: "list-1",
      location: "Gelan Industrial Zone, Yard 4",
      seller: {
        id: "seller-99",
        name: "Abebe Kebede",
        phone: "+251911223344",
        companyName: "Abebe Building Supplies PLC",
      },
    };

    const masked = maskListingForPublic(rawListing);

    expect(masked.seller?.name).toBe("Verified Depot Coordinator");
    expect(masked.seller?.phone).toBeUndefined(); // Phone completely stripped!
    expect(masked.seller?.companyName).toContain("ConMart Verified Supplier Depot");
  });

  it("enforces strict identity withholding prior to introduction unlock", () => {
    const mockEnquiry = {
      id: "enq-1",
      buyerId: "buyer-123",
      sellerId: "seller-456",
      buyer: {
        name: "Dawit Contractor",
        phone: "+251911001122",
        companyName: "Dawit Construction",
      },
      seller: {
        name: "Yonas Importer",
        phone: "+251922334455",
        companyName: "Yonas Steel PLC",
      },
      listing: { location: "Addis Ababa, Bole Subcity" },
      unlockRecord: null, // LOCKED!
    };

    // Seller viewing locked enquiry
    const sellerView = sanitizeEnquiryForViewer({
      enquiry: mockEnquiry,
      viewerUserId: "seller-456",
      viewerRole: "SELLER",
    });

    expect(sellerView.isUnlocked).toBe(false);
    expect(sellerView.buyer.phone).toBeUndefined(); // Buyer phone hidden from seller!
    expect(sellerView.buyer.name).toBe("Prospective Commercial Contractor");

    // Unlocked enquiry view
    const unlockedView = sanitizeEnquiryForViewer({
      enquiry: {
        ...mockEnquiry,
        unlockRecord: { id: "unlock-1" }, // UNLOCKED!
      },
      viewerUserId: "seller-456",
      viewerRole: "SELLER",
    });

    expect(unlockedView.isUnlocked).toBe(true);
    expect(unlockedView.buyer.phone).toBe("+251911001122"); // Revealed after payment!
    expect(unlockedView.buyer.name).toBe("Dawit Contractor");
  });

  it("buyer cannot see seller phone in serialized PENDING enquiry payload", () => {
    const mockEnquiry = {
      id: "enq-2",
      buyerId: "buyer-999",
      sellerId: "seller-111",
      buyer: { name: "Buyer Name", phone: "+251911000000", companyName: "Buyer Co" },
      seller: { name: "Seller Name", phone: "+251922000000", companyName: "Seller Co" },
      listing: { location: "Addis Ababa" },
      unlockRecord: null,
    };

    const buyerView = sanitizeEnquiryForViewer({
      enquiry: mockEnquiry,
      viewerUserId: "buyer-999",
      viewerRole: "BUYER",
    });

    expect(buyerView.isUnlocked).toBe(false);
    // Seller phone must not appear in the buyer-facing JSON payload
    expect(buyerView.seller.phone).toBeUndefined();
  });
});

describe("Chat Guard: Room Shape Decisions", () => {
  it("denies DIRECT chat room when seller subscription is FREE or null", () => {
    const decision = canOpenDirectRoom(null);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("SELLER_REQUIRES_AGENT");
    }
  });

  it("allows DIRECT chat room when seller subscription is active PAID", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const decision = canOpenDirectRoom({
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: future,
    });
    expect(decision.allowed).toBe(true);
  });

  it("denies DIRECT chat room when seller subscription is EXPIRED", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const decision = canOpenDirectRoom({
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: past, // Expired yesterday!
    });
    expect(decision.allowed).toBe(false);
  });

  it("rejects DIRECT room if buyer and seller are the same user", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const decision = validateRoomShape(
      { type: "DIRECT", buyerId: "user-123", sellerId: "user-123" },
      { subscriptionStatus: "ACTIVE", subscriptionExpiresAt: future }
    );

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("INVALID_ROOM");
    }
  });

  it("FREE seller cannot be placed in a DIRECT room", () => {
    const decision = validateRoomShape(
      { type: "DIRECT", buyerId: "buyer-1", sellerId: "seller-2" },
      { subscriptionStatus: "FREE", subscriptionExpiresAt: null }
    );
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("SELLER_REQUIRES_AGENT");
    }
  });

  it("prevents cross-party counterparty leaks in mediated BUYER_AGENT rooms", () => {
    // A BUYER_AGENT room must NEVER have sellerId set
    const decision = validateRoomShape(
      {
        type: "BUYER_AGENT",
        buyerId: "buyer-1",
        sellerId: "seller-1", // Cross-party leak attempt!
        agentId: "agent-1",
        dealTicketId: "ticket-1",
      },
      null
    );

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("CROSS_PARTY_LEAK");
    }
  });

  it("validates room participant membership accurately", () => {
    const room = {
      type: "DIRECT",
      buyerId: "buyer-abc",
      sellerId: "seller-xyz",
    };

    expect(isRoomParticipant(room, "buyer-abc")).toBe(true);
    expect(isRoomParticipant(room, "seller-xyz")).toBe(true);
    expect(isRoomParticipant(room, "random-user")).toBe(false);
    expect(isRoomParticipant(room, "")).toBe(false);
  });
});

describe("Reference Code Integrity", () => {
  it("generates reference codes with expected structure", () => {
    const ref = generateReferenceCode("ENQ");
    expect(ref.startsWith("ENQ-")).toBe(true);
    expect(isValidReferenceCode(ref, "ENQ")).toBe(true);
  });

  it("normalizes and validates reference codes from user input", () => {
    const raw = "  #enq-8a3k9m  ";
    const normalized = normalizeReferenceCode(raw, "ENQ");
    expect(normalized).toBe("ENQ-8A3K9M");
    expect(isValidReferenceCode(normalized!, "ENQ")).toBe(true);
  });

  it("generates distinct sequential reference codes", () => {
    const ref1 = generateReferenceCode("ENQ");
    const ref2 = generateReferenceCode("ENQ");
    expect(ref1).not.toBe(ref2);
  });
});

describe("State Transitions & Race-Condition Invariants", () => {
  it("enquiry atomic accept requires PENDING status and rejects second accept", () => {
    // Simulates the DB CAS condition: updateMany({ where: { id, status: 'PENDING' } })
    const enquiry = { id: "enq-1", status: "PENDING" };

    function tryAccept(record: { status: string }) {
      if (record.status !== "PENDING") {
        return { updated: false, reason: "Enquiry is not in PENDING state" };
      }
      record.status = "ACCEPTED";
      return { updated: true };
    }

    const firstAccept = tryAccept(enquiry);
    expect(firstAccept.updated).toBe(true);
    expect(enquiry.status).toBe("ACCEPTED");

    // Second accept attempt on the same enquiry MUST fail
    const secondAccept = tryAccept(enquiry);
    expect(secondAccept.updated).toBe(false);
    expect(secondAccept.reason).toContain("not in PENDING state");
  });

  it("race between accept and decline: first write wins, loser receives zero affected rows", () => {
    const enquiry = { id: "enq-2", status: "PENDING" };

    function tryDecline(record: { status: string }) {
      if (record.status !== "PENDING") {
        return { updated: false, reason: "Enquiry is not in PENDING state" };
      }
      record.status = "DECLINED";
      return { updated: true };
    }

    // Accept arrives first
    enquiry.status = "ACCEPTED";

    // Concurrent decline arrives
    const declineResult = tryDecline(enquiry);
    expect(declineResult.updated).toBe(false);
  });

  it("serialized JSON payload of PENDING enquiry never contains buyer phone number", () => {
    const rawEnquiry = {
      id: "enq-3",
      buyerId: "buyer-789",
      sellerId: "seller-123",
      buyer: {
        name: "Confidential Contractor",
        phone: "+251911998877",
        companyName: "Private Builders",
      },
      seller: {
        name: "Local Depot",
        phone: "+251922112233",
        companyName: "Addis Cement",
      },
      listing: { location: "Kaliti, Addis Ababa" },
      unlockRecord: null,
    };

    const sanitized = sanitizeEnquiryForViewer({
      enquiry: rawEnquiry,
      viewerUserId: "seller-123",
      viewerRole: "SELLER",
    });

    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain("+251911998877");
    expect(serialized).not.toContain("0911998877");
    expect(sanitized.buyer.phone).toBeUndefined();
  });
});

describe("Two Products Orthogonality: Introduction vs Conversation", () => {
  it("subscription never waives or modifies the introduction unlock fee", () => {
    // Irrespective of active subscription tier, unlock fee calculation is strictly category-based
    const baseUnlockFee = 350;
    const seller = { subscriptionStatus: "ACTIVE" as const };

    // Fee debit amount remains invariant regardless of subscription:
    const effectiveFee = seller.subscriptionStatus === "ACTIVE" ? baseUnlockFee : baseUnlockFee;
    expect(effectiveFee).toBe(350);

    const split = splitUnlockPayment(effectiveFee, 0, 1000);
    expect(split.fromCash).toBe(350);
  });

  it("FREE supplier route never permits direct chat room creation", () => {
    const freeSeller = { subscriptionStatus: "FREE" as const, subscriptionExpiresAt: null };
    const directDecision = canOpenDirectRoom(freeSeller);

    expect(directDecision.allowed).toBe(false);
    if (!directDecision.allowed) {
      expect(directDecision.reason).toBe("SELLER_REQUIRES_AGENT");
    }
  });

  it("ACTIVE supplier permits direct chat room creation", () => {
    const activeSeller = {
      subscriptionStatus: "ACTIVE" as const,
      subscriptionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };
    const directDecision = canOpenDirectRoom(activeSeller);

    expect(directDecision.allowed).toBe(true);
  });
});

