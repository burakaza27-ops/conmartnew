// =============================================================================
// ConMart — Dual-Monetization Write Path
// =============================================================================
// All chat, ticket, and commission writes go through here. Callers still have
// to authorize; this module assumes the caller is already known.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { generateReferenceCode } from "@/lib/engine/reference-code";
import { filterLeakedContactText } from "@/lib/security/masking";
import { calculateCommission } from "@/lib/marketplace/commission";
import {
  canOpenDirectRoom,
  canSendInRoom,
  routeConversation,
  validateRoomShape,
} from "@/lib/marketplace/chat-guard";
import {
  assertDealTicketTransition,
  canAgentClaimTicket,
  isOpenDealTicket,
} from "@/lib/marketplace/deal-ticket";
import { matchZone, type ZoneCandidate } from "@/lib/marketplace/zone-matching";
import { resolveSubscription } from "@/lib/marketplace/subscription";

export type InitiateKind = "DIRECT" | "MEDIATED" | "PENDING_AGENT";

export interface InitiateConversationResult {
  kind: InitiateKind;
  roomId?: string;
  ticketId?: string;
  zoneName?: string;
}

type Actor = { id: string; role: string };

export async function initiateConversation(input: {
  actor: Actor;
  listingId?: string;
  enquiryId?: string;
  briefing?: string;
}): Promise<InitiateConversationResult> {
  const context = await loadConversationContext(input);
  const sellerSub = context.seller.sellerProfile;
  const route = routeConversation(sellerSub);

  if (route === "DIRECT") {
    const decision = canOpenDirectRoom(sellerSub);
    if (!decision.allowed) {
      throw new DomainError(
        "This supplier is not subscribed for direct chat. A local agent must handle the deal."
      );
    }

    const room = await findOrCreateDirectRoom({
      buyerId: context.buyerId,
      sellerId: context.seller.id,
      listingId: context.listingId,
      enquiryId: context.enquiryId,
    });

    return { kind: "DIRECT", roomId: room.id };
  }

  const ticket = await ensureOpenDealTicket({
    buyerId: context.buyerId,
    sellerId: context.seller.id,
    listingId: context.listingId,
    enquiryId: context.enquiryId,
    location: context.location,
    briefing: input.briefing,
    orderTotal: context.orderTotal,
  });

  if (ticket.agentId) {
    const room = ticket.rooms.find((item) => item.type === "BUYER_AGENT");
    if (!room) {
      throw new DomainError("The agent channel for this deal is not ready yet.");
    }
    return { kind: "MEDIATED", roomId: room.id, ticketId: ticket.id };
  }

  return {
    kind: "PENDING_AGENT",
    ticketId: ticket.id,
    zoneName: ticket.zone.name,
  };
}

export async function sendChatMessage(input: {
  actor: Actor;
  roomId: string;
  body: string;
}): Promise<{ messageId: string }> {
  const room = await db.chatRoom.findUnique({
    where: { id: input.roomId },
    select: {
      id: true,
      type: true,
      buyerId: true,
      sellerId: true,
      agentId: true,
    },
  });

  if (!room) {
    throw new DomainError("Conversation not found.");
  }

  const decision = canSendInRoom({
    room,
    senderId: input.actor.id,
    senderRole: input.actor.role,
  });

  if (!decision.allowed) {
    throw new DomainError(messageForChatDenial(decision.reason));
  }

  const rawBody = input.body.trim();
  const body =
    room.type === "DIRECT" ? rawBody : filterLeakedContactText(rawBody);

  if (!body) {
    throw new DomainError("Message cannot be empty after removing contact details.");
  }

  const message = await db.chatMessage.create({
    data: {
      roomId: room.id,
      senderId: input.actor.id,
      body,
    },
    select: { id: true },
  });

  await db.chatRoom.update({
    where: { id: room.id },
    data: { updatedAt: new Date() },
  });

  return { messageId: message.id };
}

export async function claimDealTicket(input: {
  actor: Actor;
  ticketId: string;
}): Promise<{ ticketId: string; buyerRoomId: string; sellerRoomId: string }> {
  if (input.actor.role !== "FIELD_AGENT" && input.actor.role !== "ADMIN") {
    throw new DomainError("Only a registered local agent can claim this deal.");
  }

  const [ticket, agentProfile] = await Promise.all([
    db.dealTicket.findUnique({
      where: { id: input.ticketId },
      select: {
        id: true,
        status: true,
        zoneId: true,
        agentId: true,
        buyerId: true,
        sellerId: true,
        enquiryId: true,
        listingId: true,
      },
    }),
    input.actor.role === "ADMIN"
      ? Promise.resolve(null)
      : db.agentProfile.findUnique({
          where: { userId: input.actor.id },
          select: { zoneId: true, isActive: true },
        }),
  ]);

  if (!ticket) {
    throw new DomainError("Deal ticket not found.");
  }

  if (input.actor.role === "FIELD_AGENT") {
    if (!agentProfile) {
      throw new DomainError("Your account is not registered to a location zone.");
    }
    if (
      !canAgentClaimTicket({
        ticketStatus: ticket.status,
        ticketZoneId: ticket.zoneId,
        ticketAgentId: ticket.agentId,
        agentZoneId: agentProfile.zoneId,
        agentIsActive: agentProfile.isActive,
      })
    ) {
      throw new DomainError(
        "You can only claim unassigned deals in your registered zone."
      );
    }
  } else if (ticket.status !== "PENDING_AGENT" || ticket.agentId) {
    throw new DomainError("This deal is no longer waiting for an agent.");
  }

  const claimed = await db.dealTicket.updateMany({
    where: {
      id: ticket.id,
      status: "PENDING_AGENT",
      agentId: null,
    },
    data: {
      status: "AGENT_ASSIGNED",
      agentId: input.actor.id,
      claimedAt: new Date(),
    },
  });

  if (claimed.count !== 1) {
    throw new DomainError("Another agent claimed this deal first.");
  }

  const [buyerRoom, sellerRoom] = await Promise.all([
    createMediatedRoom({
      type: "BUYER_AGENT",
      buyerId: ticket.buyerId,
      sellerId: null,
      agentId: input.actor.id,
      dealTicketId: ticket.id,
      enquiryId: ticket.enquiryId,
      listingId: ticket.listingId,
    }),
    createMediatedRoom({
      type: "SELLER_AGENT",
      buyerId: null,
      sellerId: ticket.sellerId,
      agentId: input.actor.id,
      dealTicketId: ticket.id,
      enquiryId: ticket.enquiryId,
      listingId: ticket.listingId,
    }),
  ]);

  return {
    ticketId: ticket.id,
    buyerRoomId: buyerRoom.id,
    sellerRoomId: sellerRoom.id,
  };
}

export async function transitionDealTicket(input: {
  actor: Actor;
  ticketId: string;
  to: "IN_INSPECTION" | "CANCELLED";
}): Promise<void> {
  const ticket = await db.dealTicket.findUnique({
    where: { id: input.ticketId },
    select: { id: true, status: true, agentId: true, buyerId: true, sellerId: true },
  });

  if (!ticket) {
    throw new DomainError("Deal ticket not found.");
  }

  assertActorCanManageTicket(input.actor, ticket);
  assertDealTicketTransition(ticket.status, input.to);

  await db.dealTicket.update({
    where: { id: ticket.id },
    data: {
      status: input.to,
      cancelledAt: input.to === "CANCELLED" ? new Date() : undefined,
    },
  });
}

export async function completeDealTicket(input: {
  actor: Actor;
  ticketId: string;
  orderTotal: number;
}): Promise<{ platformAmount: number; agentAmount: number }> {
  const ticket = await db.dealTicket.findUnique({
    where: { id: input.ticketId },
    select: {
      id: true,
      status: true,
      agentId: true,
      buyerId: true,
      sellerId: true,
      commission: { select: { id: true } },
    },
  });

  if (!ticket) {
    throw new DomainError("Deal ticket not found.");
  }

  assertActorCanManageTicket(input.actor, ticket);
  assertDealTicketTransition(ticket.status, "COMPLETED");

  if (ticket.commission) {
    throw new DomainError("Commission for this deal has already been recorded.");
  }

  const breakdown = calculateCommission({ orderTotal: input.orderTotal });

  await db.$transaction([
    db.dealTicket.update({
      where: { id: ticket.id },
      data: {
        status: "COMPLETED",
        orderTotal: breakdown.orderTotal,
        completedAt: new Date(),
      },
    }),
    db.commission.create({
      data: {
        dealTicketId: ticket.id,
        orderTotal: breakdown.orderTotal,
        totalFeePercent: breakdown.totalFeePercent,
        platformSharePercent: breakdown.platformSharePercent,
        agentSharePercent: breakdown.agentSharePercent,
        platformAmount: breakdown.platformAmount,
        agentAmount: breakdown.agentAmount,
        payoutStatus: "DUE",
      },
    }),
  ]);

  return {
    platformAmount: breakdown.platformAmount,
    agentAmount: breakdown.agentAmount,
  };
}

export async function ensureDealTicketForEnquiry(input: {
  enquiryId: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  location: string;
  orderTotal: number;
}): Promise<void> {
  const seller = await db.sellerProfile.findUnique({
    where: { userId: input.sellerId },
    select: { subscriptionStatus: true, subscriptionExpiresAt: true },
  });

  if (resolveSubscription(seller) === "ACTIVE") {
    return;
  }

  await ensureOpenDealTicket({
    buyerId: input.buyerId,
    sellerId: input.sellerId,
    listingId: input.listingId,
    enquiryId: input.enquiryId,
    location: input.location,
    orderTotal: input.orderTotal,
  });
}

async function loadConversationContext(input: {
  actor: Actor;
  listingId?: string;
  enquiryId?: string;
}) {
  if (input.enquiryId) {
    const enquiry = await db.enquiry.findUnique({
      where: { id: input.enquiryId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        listingId: true,
        qty: true,
        listing: {
          select: {
            location: true,
            priceTiers: {
              select: { minQty: true, maxQty: true, unitPrice: true },
              orderBy: { minQty: "asc" },
            },
          },
        },
        seller: {
          select: {
            id: true,
            sellerProfile: {
              select: { subscriptionStatus: true, subscriptionExpiresAt: true },
            },
          },
        },
      },
    });

    if (!enquiry) {
      throw new DomainError("Enquiry not found.");
    }

    const isParty =
      enquiry.buyerId === input.actor.id ||
      enquiry.sellerId === input.actor.id ||
      input.actor.role === "ADMIN";

    if (!isParty) {
      throw new DomainError("You are not a party to this enquiry.");
    }

    return {
      buyerId: enquiry.buyerId,
      seller: enquiry.seller,
      listingId: enquiry.listingId,
      enquiryId: enquiry.id,
      location: enquiry.listing.location,
      orderTotal: estimateOrderTotal(enquiry.qty, enquiry.listing.priceTiers),
    };
  }

  if (input.actor.role !== "BUYER" && input.actor.role !== "ADMIN") {
    throw new DomainError("Only a buyer can start a conversation from a listing.");
  }

  const listing = await db.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      active: true,
      location: true,
      sellerId: true,
      seller: {
        select: {
          id: true,
          sellerProfile: {
            select: { subscriptionStatus: true, subscriptionExpiresAt: true },
          },
        },
      },
    },
  });

  if (!listing || !listing.active) {
    throw new DomainError("This material listing is no longer available.");
  }

  if (listing.sellerId === input.actor.id) {
    throw new DomainError("You cannot open a conversation with your own listing.");
  }

  return {
    buyerId: input.actor.id,
    seller: listing.seller,
    listingId: listing.id,
    enquiryId: undefined as string | undefined,
    location: listing.location,
    orderTotal: 0,
  };
}

async function findOrCreateDirectRoom(input: {
  buyerId: string;
  sellerId: string;
  listingId?: string;
  enquiryId?: string;
}) {
  const existing = await db.chatRoom.findUnique({
    where: {
      type_buyerId_sellerId: {
        type: "DIRECT",
        buyerId: input.buyerId,
        sellerId: input.sellerId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  const shape = validateRoomShape(
    { type: "DIRECT", buyerId: input.buyerId, sellerId: input.sellerId },
    { subscriptionStatus: "ACTIVE", subscriptionExpiresAt: null }
  );

  if (!shape.allowed) {
    throw new DomainError(
      "This supplier is not subscribed for direct chat. A local agent must handle the deal."
    );
  }

  try {
    return await db.chatRoom.create({
      data: {
        type: "DIRECT",
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        listingId: input.listingId,
        enquiryId: input.enquiryId,
      },
      select: { id: true },
    });
  } catch {
    const raced = await db.chatRoom.findUnique({
      where: {
        type_buyerId_sellerId: {
          type: "DIRECT",
          buyerId: input.buyerId,
          sellerId: input.sellerId,
        },
      },
      select: { id: true },
    });
    if (raced) return raced;
    throw new DomainError("Could not open the conversation. Please try again.");
  }
}

async function ensureOpenDealTicket(input: {
  buyerId: string;
  sellerId: string;
  listingId?: string;
  enquiryId?: string;
  location: string;
  briefing?: string;
  orderTotal: number;
}) {
  if (input.enquiryId) {
    const linked = await db.dealTicket.findUnique({
      where: { enquiryId: input.enquiryId },
      include: { zone: { select: { name: true } }, rooms: { select: { id: true, type: true } } },
    });
    if (linked && isOpenDealTicket(linked.status)) {
      return linked;
    }
  }

  const existing = await db.dealTicket.findFirst({
    where: {
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      listingId: input.listingId ?? undefined,
      status: { in: ["PENDING_AGENT", "AGENT_ASSIGNED", "IN_INSPECTION"] },
    },
    include: { zone: { select: { name: true } }, rooms: { select: { id: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    if (input.briefing && !existing.buyerBriefing) {
      await db.dealTicket.update({
        where: { id: existing.id },
        data: { buyerBriefing: filterLeakedContactText(input.briefing) },
      });
    }
    return existing;
  }

  const zones = await db.zone.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      aliases: true,
      priority: true,
      minLat: true,
      minLng: true,
      maxLat: true,
      maxLng: true,
    },
  });

  const candidates: ZoneCandidate[] = zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    slug: zone.slug,
    aliases: zone.aliases,
    priority: zone.priority,
    minLat: zone.minLat == null ? null : Number(zone.minLat),
    minLng: zone.minLng == null ? null : Number(zone.minLng),
    maxLat: zone.maxLat == null ? null : Number(zone.maxLat),
    maxLng: zone.maxLng == null ? null : Number(zone.maxLng),
  }));

  const match = matchZone(input.location, candidates);
  if (!match) {
    throw new DomainError(
      "No local agent zone covers this depot. Ask ConMart operations to map the location."
    );
  }

  return db.dealTicket.create({
    data: {
      referenceCode: generateReferenceCode("DLT"),
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      zoneId: match.zoneId,
      listingId: input.listingId,
      enquiryId: input.enquiryId,
      status: "PENDING_AGENT",
      orderTotal: input.orderTotal,
      buyerBriefing: input.briefing
        ? filterLeakedContactText(input.briefing)
        : null,
    },
    include: { zone: { select: { name: true } }, rooms: { select: { id: true, type: true } } },
  });
}

async function createMediatedRoom(input: {
  type: "BUYER_AGENT" | "SELLER_AGENT";
  buyerId: string | null;
  sellerId: string | null;
  agentId: string;
  dealTicketId: string;
  enquiryId: string | null;
  listingId: string | null;
}) {
  const shape = validateRoomShape(
    {
      type: input.type,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      agentId: input.agentId,
      dealTicketId: input.dealTicketId,
    },
    { subscriptionStatus: "FREE", subscriptionExpiresAt: null }
  );

  if (!shape.allowed) {
    throw new DomainError("Refusing to create a chat room that would bypass the agent.");
  }

  return db.chatRoom.create({
    data: {
      type: input.type,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      agentId: input.agentId,
      dealTicketId: input.dealTicketId,
      enquiryId: input.enquiryId,
      listingId: input.listingId,
    },
    select: { id: true },
  });
}

function assertActorCanManageTicket(
  actor: Actor,
  ticket: { agentId: string | null; buyerId: string; sellerId: string }
) {
  if (actor.role === "ADMIN") return;
  if (actor.role === "FIELD_AGENT" && ticket.agentId === actor.id) return;
  throw new DomainError("Only the assigned agent can update this deal.");
}

function estimateOrderTotal(
  qty: number,
  tiers: Array<{ minQty: number; maxQty: number; unitPrice: unknown }>
): number {
  const tier = tiers.find((item) => qty >= item.minQty && qty <= item.maxQty);
  if (!tier) return 0;
  return Number(tier.unitPrice) * qty;
}

function messageForChatDenial(reason: string): string {
  switch (reason) {
    case "SELLER_REQUIRES_AGENT":
      return "Direct chat is locked for this supplier. The deal must go through a local agent.";
    case "NOT_A_PARTICIPANT":
      return "You are not a participant in this conversation.";
    case "CROSS_PARTY_LEAK":
      return "Buyers and free suppliers cannot message each other directly.";
    default:
      return "You cannot send a message in this conversation.";
  }
}
