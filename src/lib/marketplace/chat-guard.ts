// =============================================================================
// ConMart — Chat Permission Decisions
// =============================================================================
// Pure. The server action that opens a room or accepts a message must call
// these functions; a UI lock is not authorization.
//
// Invariants:
//   1. A FREE (or expired) supplier never enters a DIRECT room.
//   2. A buyer and a FREE supplier never share a room of any type.
//   3. Mediated rooms are two-party: buyer↔agent or seller↔agent.
//   4. An existing DIRECT room stays usable if the subscription later lapses
//      (they already paid for that conversation). New DIRECT rooms do not.
// =============================================================================

import {
  isDirectChatEntitled,
  type SubscriptionRecord,
} from "@/lib/marketplace/subscription";

export const CHAT_ROOM_TYPES = ["DIRECT", "BUYER_AGENT", "SELLER_AGENT"] as const;
export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number];

export type ChatDenialReason =
  | "SELLER_REQUIRES_AGENT"
  | "NOT_A_PARTICIPANT"
  | "CROSS_PARTY_LEAK"
  | "ROOM_TYPE_FORBIDDEN"
  | "INVALID_ROOM";

export type ChatDecision =
  | { allowed: true }
  | { allowed: false; reason: ChatDenialReason };

export interface ProposedDirectRoom {
  type: "DIRECT";
  buyerId: string;
  sellerId: string;
}

export interface ProposedMediatedRoom {
  type: "BUYER_AGENT" | "SELLER_AGENT";
  buyerId?: string | null;
  sellerId?: string | null;
  agentId: string;
  dealTicketId: string;
}

export interface RoomMembership {
  type: ChatRoomType | string;
  buyerId?: string | null;
  sellerId?: string | null;
  agentId?: string | null;
}

/**
 * Whether a new DIRECT room may be created for this buyer/seller pair.
 *
 * The seller's *effective* subscription is the only privilege that matters.
 * A FREE seller who initiates, a buyer who asks, or a crafted payload that
 * names the FREE seller as the other party — all deny the same way.
 */
export function canOpenDirectRoom(
  sellerSubscription: SubscriptionRecord | null | undefined,
  now: Date = new Date()
): ChatDecision {
  if (!isDirectChatEntitled(sellerSubscription, now)) {
    return { allowed: false, reason: "SELLER_REQUIRES_AGENT" };
  }
  return { allowed: true };
}

/**
 * Structural rules for a room that is about to be persisted.
 *
 * Catches the bypass of writing a DIRECT row with a FREE seller, or stuffing
 * both counterparties into a mediated room so they can talk past the agent.
 */
export function validateRoomShape(
  room: ProposedDirectRoom | ProposedMediatedRoom,
  sellerSubscription: SubscriptionRecord | null | undefined,
  now: Date = new Date()
): ChatDecision {
  if (room.type === "DIRECT") {
    if (!room.buyerId || !room.sellerId || room.buyerId === room.sellerId) {
      return { allowed: false, reason: "INVALID_ROOM" };
    }
    return canOpenDirectRoom(sellerSubscription, now);
  }

  if (!room.agentId || !room.dealTicketId) {
    return { allowed: false, reason: "INVALID_ROOM" };
  }

  if (room.type === "BUYER_AGENT") {
    if (!room.buyerId || room.sellerId) {
      return { allowed: false, reason: "CROSS_PARTY_LEAK" };
    }
    return { allowed: true };
  }

  if (!room.sellerId || room.buyerId) {
    return { allowed: false, reason: "CROSS_PARTY_LEAK" };
  }

  return { allowed: true };
}

/**
 * Whether `userId` is one of the two (or, for DIRECT, two) named parties.
 *
 * ADMIN is not a participant. Support reads go through a separate admin path
 * so this function stays a membership test, not a privilege test.
 */
export function isRoomParticipant(room: RoomMembership, userId: string): boolean {
  if (!userId) return false;
  return (
    room.buyerId === userId ||
    room.sellerId === userId ||
    room.agentId === userId
  );
}

/**
 * Whether `senderId` may post in this room.
 *
 * Membership is the send-time check. Subscription is enforced when the room
 * is created (`validateRoomShape` / `canOpenDirectRoom`). Re-checking it here
 * would lock a paid conversation the moment the month ran out.
 *
 * A malformed mediated room that lists both counterparties is rejected so a
 * bad row cannot become a back-channel.
 */
export function canSendInRoom(input: {
  room: RoomMembership;
  senderId: string;
  senderRole: string;
}): ChatDecision {
  const { room, senderId, senderRole } = input;

  if (!CHAT_ROOM_TYPES.includes(room.type as ChatRoomType)) {
    return { allowed: false, reason: "INVALID_ROOM" };
  }

  if (!isRoomParticipant(room, senderId) && senderRole !== "ADMIN") {
    return { allowed: false, reason: "NOT_A_PARTICIPANT" };
  }

  if (room.type === "DIRECT") {
    return { allowed: true };
  }

  if (room.type === "BUYER_AGENT") {
    if (room.sellerId) {
      return { allowed: false, reason: "CROSS_PARTY_LEAK" };
    }
    return { allowed: true };
  }

  if (room.buyerId) {
    return { allowed: false, reason: "CROSS_PARTY_LEAK" };
  }
  return { allowed: true };
}

/**
 * The routing a chat-initiation attempt must take. Callers never invent a
 * DIRECT room when this returns `AGENT_TICKET`.
 */
export function routeConversation(
  sellerSubscription: SubscriptionRecord | null | undefined,
  now: Date = new Date()
): "DIRECT" | "AGENT_TICKET" {
  return isDirectChatEntitled(sellerSubscription, now) ? "DIRECT" : "AGENT_TICKET";
}
