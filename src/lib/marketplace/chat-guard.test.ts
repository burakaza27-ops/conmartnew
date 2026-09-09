import { describe, expect, it } from "vitest";

import {
  canOpenDirectRoom,
  canSendInRoom,
  isRoomParticipant,
  routeConversation,
  validateRoomShape,
} from "@/lib/marketplace/chat-guard";

const now = new Date("2026-09-09T12:00:00.000Z");
const active = { subscriptionStatus: "ACTIVE" as const, subscriptionExpiresAt: null };
const free = { subscriptionStatus: "FREE" as const, subscriptionExpiresAt: null };
const expired = {
  subscriptionStatus: "ACTIVE" as const,
  subscriptionExpiresAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("routeConversation", () => {
  it("opens a direct room only for an effectively ACTIVE supplier", () => {
    expect(routeConversation(active, now)).toBe("DIRECT");
  });

  it("routes FREE suppliers through an agent ticket", () => {
    expect(routeConversation(free, now)).toBe("AGENT_TICKET");
  });

  it("routes a lapsed subscription through an agent ticket", () => {
    expect(routeConversation(expired, now)).toBe("AGENT_TICKET");
  });

  it("routes a missing profile through an agent ticket", () => {
    expect(routeConversation(null, now)).toBe("AGENT_TICKET");
  });
});

describe("canOpenDirectRoom — non-subscribed suppliers cannot bypass routing", () => {
  it("denies a FREE supplier", () => {
    expect(canOpenDirectRoom(free, now)).toEqual({
      allowed: false,
      reason: "SELLER_REQUIRES_AGENT",
    });
  });

  it("denies an expired ACTIVE supplier", () => {
    expect(canOpenDirectRoom(expired, now)).toEqual({
      allowed: false,
      reason: "SELLER_REQUIRES_AGENT",
    });
  });

  it("denies a supplier with no profile row", () => {
    expect(canOpenDirectRoom(undefined, now)).toEqual({
      allowed: false,
      reason: "SELLER_REQUIRES_AGENT",
    });
  });

  it("allows a currently ACTIVE supplier", () => {
    expect(canOpenDirectRoom(active, now)).toEqual({ allowed: true });
  });
});

describe("validateRoomShape", () => {
  it("refuses to persist a DIRECT room for a FREE supplier", () => {
    const decision = validateRoomShape(
      { type: "DIRECT", buyerId: "buyer-1", sellerId: "seller-free" },
      free,
      now
    );
    expect(decision).toEqual({
      allowed: false,
      reason: "SELLER_REQUIRES_AGENT",
    });
  });

  it("refuses a DIRECT room that names the same party twice", () => {
    expect(
      validateRoomShape(
        { type: "DIRECT", buyerId: "same", sellerId: "same" },
        active,
        now
      )
    ).toEqual({ allowed: false, reason: "INVALID_ROOM" });
  });

  it("refuses a BUYER_AGENT room that also lists the seller", () => {
    expect(
      validateRoomShape(
        {
          type: "BUYER_AGENT",
          buyerId: "buyer-1",
          sellerId: "seller-free",
          agentId: "agent-1",
          dealTicketId: "t1",
        },
        free,
        now
      )
    ).toEqual({ allowed: false, reason: "CROSS_PARTY_LEAK" });
  });

  it("refuses a SELLER_AGENT room that also lists the buyer", () => {
    expect(
      validateRoomShape(
        {
          type: "SELLER_AGENT",
          buyerId: "buyer-1",
          sellerId: "seller-free",
          agentId: "agent-1",
          dealTicketId: "t1",
        },
        free,
        now
      )
    ).toEqual({ allowed: false, reason: "CROSS_PARTY_LEAK" });
  });

  it("accepts a two-party BUYER_AGENT room", () => {
    expect(
      validateRoomShape(
        {
          type: "BUYER_AGENT",
          buyerId: "buyer-1",
          sellerId: null,
          agentId: "agent-1",
          dealTicketId: "t1",
        },
        free,
        now
      )
    ).toEqual({ allowed: true });
  });
});

describe("canSendInRoom", () => {
  const direct = {
    type: "DIRECT" as const,
    buyerId: "buyer-1",
    sellerId: "seller-paid",
    agentId: null,
  };

  const buyerAgent = {
    type: "BUYER_AGENT" as const,
    buyerId: "buyer-1",
    sellerId: null,
    agentId: "agent-1",
  };

  const sellerAgent = {
    type: "SELLER_AGENT" as const,
    buyerId: null,
    sellerId: "seller-free",
    agentId: "agent-1",
  };

  it("blocks a stranger from posting in a DIRECT room", () => {
    expect(
      canSendInRoom({
        room: direct,
        senderId: "intruder",
        senderRole: "BUYER",
      })
    ).toEqual({ allowed: false, reason: "NOT_A_PARTICIPANT" });
  });

  it("does not let a FREE supplier invent membership on a paid DIRECT room", () => {
    expect(isRoomParticipant(direct, "seller-free")).toBe(false);
    expect(
      canSendInRoom({
        room: direct,
        senderId: "seller-free",
        senderRole: "SELLER",
      })
    ).toEqual({ allowed: false, reason: "NOT_A_PARTICIPANT" });
  });

  it("blocks the FREE supplier from the buyer-agent channel", () => {
    expect(isRoomParticipant(buyerAgent, "seller-free")).toBe(false);
    expect(
      canSendInRoom({
        room: buyerAgent,
        senderId: "seller-free",
        senderRole: "SELLER",
      })
    ).toEqual({ allowed: false, reason: "NOT_A_PARTICIPANT" });
  });

  it("blocks the buyer from the seller-agent channel", () => {
    expect(isRoomParticipant(sellerAgent, "buyer-1")).toBe(false);
    expect(
      canSendInRoom({
        room: sellerAgent,
        senderId: "buyer-1",
        senderRole: "BUYER",
      })
    ).toEqual({ allowed: false, reason: "NOT_A_PARTICIPANT" });
  });

  it("lets the assigned agent post on both mediated sides", () => {
    expect(
      canSendInRoom({
        room: buyerAgent,
        senderId: "agent-1",
        senderRole: "FIELD_AGENT",
      })
    ).toEqual({ allowed: true });
    expect(
      canSendInRoom({
        room: sellerAgent,
        senderId: "agent-1",
        senderRole: "FIELD_AGENT",
      })
    ).toEqual({ allowed: true });
  });

  it("lets the subscribed supplier post in their DIRECT room", () => {
    expect(
      canSendInRoom({
        room: direct,
        senderId: "seller-paid",
        senderRole: "SELLER",
      })
    ).toEqual({ allowed: true });
  });
});
