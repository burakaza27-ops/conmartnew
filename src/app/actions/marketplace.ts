// =============================================================================
// ConMart — Dual-Monetization Server Actions
// =============================================================================
// Chat initiation, agent job-board claims, ticket transitions, and commission
// close-out. Each action re-derives the caller from the users table.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DomainError, toSafeErrorMessage } from "@/lib/errors";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import {
  claimDealTicketSchema,
  completeDealTicketSchema,
  initiateConversationSchema,
  sendChatMessageSchema,
  setSellerSubscriptionSchema,
  transitionDealTicketSchema,
  type ClaimDealTicketInput,
  type CompleteDealTicketInput,
  type InitiateConversationInput,
  type SendChatMessageInput,
  type SetSellerSubscriptionInput,
  type TransitionDealTicketInput,
} from "@/lib/validations";
import { isRoomParticipant } from "@/lib/marketplace/chat-guard";
import { resolveSubscription } from "@/lib/marketplace/subscription";
import {
  claimDealTicket,
  completeDealTicket,
  initiateConversation,
  sendChatMessage,
  transitionDealTicket,
  type InitiateConversationResult,
} from "@/lib/marketplace/service";

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function initiateConversationAction(
  input: InitiateConversationInput
): Promise<ActionResponse<InitiateConversationResult>> {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = initiateConversationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid conversation request.",
    };
  }

  const clientId = await getClientIdentifier();
  const [byUser, byIp] = await Promise.all([
    rateLimit(`chat:open:${auth.user.id}`, { limit: 30, windowSeconds: 3600 }),
    rateLimit(`chat:open:ip:${clientId}`, { limit: 60, windowSeconds: 3600 }),
  ]);
  if (!byUser.allowed || !byIp.allowed) {
    return {
      success: false,
      error: rateLimitMessage(Math.max(byUser.retryAfterSeconds, byIp.retryAfterSeconds)),
    };
  }

  try {
    if (auth.user.role === "FIELD_AGENT") {
      throw new DomainError(
        "Local agents join deals from the job board, not by opening buyer–supplier chat."
      );
    }

    const result = await initiateConversation({
      actor: auth.user,
      listingId: parsed.data.listingId,
      enquiryId: parsed.data.enquiryId,
      briefing: parsed.data.briefing,
    });

    revalidateMarketplaceSurfaces();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "initiateConversation"),
    };
  }
}

export async function sendChatMessageAction(
  input: SendChatMessageInput
): Promise<ActionResponse<{ messageId: string }>> {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = sendChatMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid message.",
    };
  }

  const limited = await rateLimit(`chat:send:${auth.user.id}`, {
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    return { success: false, error: rateLimitMessage(limited.retryAfterSeconds) };
  }

  try {
    const result = await sendChatMessage({
      actor: auth.user,
      roomId: parsed.data.roomId,
      body: parsed.data.body,
    });
    revalidatePath("/buyer/messages");
    revalidatePath("/seller/messages");
    revalidatePath("/agent/messages");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "sendChatMessage") };
  }
}

export async function claimDealTicketAction(
  input: ClaimDealTicketInput
): Promise<ActionResponse<{ ticketId: string; buyerRoomId: string; sellerRoomId: string }>> {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = claimDealTicketSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid claim.",
    };
  }

  try {
    const result = await claimDealTicket({
      actor: auth.user,
      ticketId: parsed.data.ticketId,
    });
    revalidateMarketplaceSurfaces();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error, "claimDealTicket") };
  }
}

export async function transitionDealTicketAction(
  input: TransitionDealTicketInput
): Promise<ActionResponse<null>> {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = transitionDealTicketSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid status change.",
    };
  }

  try {
    await transitionDealTicket({
      actor: auth.user,
      ticketId: parsed.data.ticketId,
      to: parsed.data.to,
    });
    revalidateMarketplaceSurfaces();
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "transitionDealTicket"),
    };
  }
}

export async function completeDealTicketAction(
  input: CompleteDealTicketInput
): Promise<ActionResponse<{ platformAmount: number; agentAmount: number }>> {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = completeDealTicketSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid completion.",
    };
  }

  try {
    const result = await completeDealTicket({
      actor: auth.user,
      ticketId: parsed.data.ticketId,
      orderTotal: parsed.data.orderTotal,
    });
    revalidateMarketplaceSurfaces();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "completeDealTicket"),
    };
  }
}

export async function setSellerSubscriptionAction(
  input: SetSellerSubscriptionInput
): Promise<ActionResponse<null>> {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = setSellerSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid subscription update.",
    };
  }

  try {
    await db.sellerProfile.update({
      where: { id: parsed.data.sellerProfileId },
      data: {
        subscriptionStatus: parsed.data.status,
        subscriptionExpiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : null,
      },
    });
    revalidateMarketplaceSurfaces();
    revalidatePath("/admin/command-center");
    revalidatePath("/buyer", "layout");
    revalidatePath("/buyer/catalog");
    revalidatePath("/buyer/category/all");
    revalidatePath("/buyer/product", "layout");
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: toSafeErrorMessage(error, "setSellerSubscription"),
    };
  }
}

export async function getInboxAction() {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const user = auth.user;
  const rooms = await db.chatRoom.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { buyerId: user.id },
              { sellerId: user.id },
              { agentId: user.id },
            ],
          },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
      dealTicket: {
        select: { id: true, referenceCode: true, status: true },
      },
      listing: {
        select: { product: { select: { title: true } } },
      },
      buyer: { select: { name: true, companyName: true } },
      seller: { select: { name: true, companyName: true } },
      agent: { select: { name: true, companyName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return {
    success: true as const,
    data: rooms
      .filter((room) => isRoomParticipant(room, user.id) || user.role === "ADMIN")
      .map((room) => ({
        id: room.id,
        type: room.type,
        ticketId: room.dealTicket?.id ?? null,
        ticketReference: room.dealTicket?.referenceCode ?? null,
        ticketStatus: room.dealTicket?.status ?? null,
        listingTitle: room.listing?.product.title ?? null,
        counterpartName: counterpartName(room, user.id, user.role),
        lastMessage: room.messages[0]?.body ?? null,
        lastMessageAt: room.messages[0]?.createdAt.toISOString() ?? room.updatedAt.toISOString(),
      })),
  };
}

export async function getChatRoomAction(roomId: string) {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          body: true,
          senderId: true,
          createdAt: true,
          sender: { select: { name: true, role: true } },
        },
      },
      dealTicket: {
        select: { id: true, referenceCode: true, status: true, zone: { select: { name: true } } },
      },
      listing: {
        select: { product: { select: { title: true } } },
      },
      buyer: { select: { name: true, companyName: true } },
      seller: { select: { name: true, companyName: true } },
      agent: { select: { name: true, companyName: true } },
    },
  });

  if (!room) {
    return { success: false as const, error: "Conversation not found." };
  }

  if (!isRoomParticipant(room, auth.user.id) && auth.user.role !== "ADMIN") {
    return { success: false as const, error: "You are not a participant in this conversation." };
  }

  return {
    success: true as const,
    data: {
      id: room.id,
      type: room.type,
      viewerId: auth.user.id,
      counterpartName: counterpartName(room, auth.user.id, auth.user.role),
      listingTitle: room.listing?.product.title ?? null,
      ticket: room.dealTicket
        ? {
            id: room.dealTicket.id,
            referenceCode: room.dealTicket.referenceCode,
            status: room.dealTicket.status,
            zoneName: room.dealTicket.zone.name,
          }
        : null,
      messages: room.messages.map((message) => ({
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderRole: message.sender.role,
        createdAt: message.createdAt.toISOString(),
        mine: message.senderId === auth.user.id,
      })),
    },
  };
}

export async function getAgentJobBoardAction() {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const profile =
    auth.user.role === "FIELD_AGENT"
      ? await db.agentProfile.findUnique({
          where: { userId: auth.user.id },
          select: {
            zoneId: true,
            isActive: true,
            zone: { select: { id: true, name: true } },
          },
        })
      : null;

  if (auth.user.role === "FIELD_AGENT" && !profile) {
    return {
      success: false as const,
      error: "Your account is not registered to a location zone. Contact operations.",
    };
  }

  if (auth.user.role === "FIELD_AGENT" && profile && !profile.isActive) {
    return {
      success: false as const,
      error: "Your agent account is inactive. Contact ConMart operations to reactivate it.",
    };
  }

  const tickets = await db.dealTicket.findMany({
    where:
      auth.user.role === "ADMIN"
        ? {}
        : {
            zoneId: profile!.zoneId,
            OR: [{ status: "PENDING_AGENT" }, { agentId: auth.user.id }],
          },
    include: {
      zone: { select: { name: true } },
      listing: {
        select: {
          location: true,
          product: { select: { title: true } },
        },
      },
      commission: {
        select: { agentAmount: true, payoutStatus: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return {
    success: true as const,
    data: {
      zoneName: profile?.zone.name ?? "All zones",
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        referenceCode: ticket.referenceCode,
        status: ticket.status,
        zoneName: ticket.zone.name,
        productTitle: ticket.listing?.product.title ?? "Materials deal",
        location: ticket.listing?.location ?? ticket.zone.name,
        orderTotal: Number(ticket.orderTotal),
        buyerBriefing: ticket.buyerBriefing,
        claimedAt: ticket.claimedAt?.toISOString() ?? null,
        createdAt: ticket.createdAt.toISOString(),
        assignedToMe: ticket.agentId === auth.user.id,
        commissionDue: ticket.commission
          ? Number(ticket.commission.agentAmount)
          : null,
        payoutStatus: ticket.commission?.payoutStatus ?? null,
      })),
    },
  };
}

export async function getDealTicketAction(ticketId: string) {
  const auth = await authorize(["BUYER", "SELLER", "FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const ticket = await db.dealTicket.findUnique({
    where: { id: ticketId },
    include: {
      zone: { select: { name: true } },
      listing: { select: { location: true, product: { select: { title: true } } } },
      rooms: { select: { id: true, type: true } },
      commission: true,
    },
  });

  if (!ticket) {
    return { success: false as const, error: "Deal ticket not found." };
  }

  const isParty =
    ticket.buyerId === auth.user.id ||
    ticket.sellerId === auth.user.id ||
    ticket.agentId === auth.user.id ||
    auth.user.role === "ADMIN";

  if (!isParty) {
    if (auth.user.role === "FIELD_AGENT" && ticket.status === "PENDING_AGENT") {
      const profile = await db.agentProfile.findUnique({
        where: { userId: auth.user.id },
        select: { zoneId: true },
      });
      if (profile?.zoneId !== ticket.zoneId) {
        return { success: false as const, error: "Deal ticket not found." };
      }
    } else {
      return { success: false as const, error: "Deal ticket not found." };
    }
  }

  const myRoom = ticket.rooms.find((room) => {
    if (auth.user.role === "BUYER") return room.type === "BUYER_AGENT";
    if (auth.user.role === "SELLER") return room.type === "SELLER_AGENT";
    return room.type === "BUYER_AGENT";
  });

  return {
    success: true as const,
    data: {
      id: ticket.id,
      referenceCode: ticket.referenceCode,
      status: ticket.status,
      zoneName: ticket.zone.name,
      productTitle: ticket.listing?.product.title ?? "Materials deal",
      location: ticket.listing?.location ?? ticket.zone.name,
      orderTotal: Number(ticket.orderTotal),
      buyerBriefing: ticket.buyerBriefing,
      viewerRole: auth.user.role,
      roomId: myRoom?.id ?? null,
      sellerRoomId:
        auth.user.role === "FIELD_AGENT" || auth.user.role === "ADMIN"
          ? ticket.rooms.find((room) => room.type === "SELLER_AGENT")?.id ?? null
          : null,
      buyerRoomId:
        auth.user.role === "FIELD_AGENT" || auth.user.role === "ADMIN"
          ? ticket.rooms.find((room) => room.type === "BUYER_AGENT")?.id ?? null
          : null,
      commission: ticket.commission
        ? {
            platformAmount: Number(ticket.commission.platformAmount),
            agentAmount: Number(ticket.commission.agentAmount),
            payoutStatus: ticket.commission.payoutStatus,
          }
        : null,
    },
  };
}

export async function getSellerSubscriptionAction() {
  const auth = await authorize(["SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const profile = await db.sellerProfile.findUnique({
    where: { userId: auth.user.id },
    select: { subscriptionStatus: true, subscriptionExpiresAt: true },
  });

  const effective = resolveSubscription(profile);

  return {
    success: true as const,
    data: {
      storedStatus: profile?.subscriptionStatus ?? "FREE",
      effectiveStatus: effective,
      expiresAt: profile?.subscriptionExpiresAt?.toISOString() ?? null,
      directChatEnabled: effective === "ACTIVE",
    },
  };
}

export async function getPartyDealTicketsAction() {
  const auth = await authorize(["BUYER", "SELLER", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const tickets = await db.dealTicket.findMany({
    where:
      auth.user.role === "ADMIN"
        ? {}
        : auth.user.role === "SELLER"
          ? { sellerId: auth.user.id }
          : { buyerId: auth.user.id },
    include: {
      zone: { select: { name: true } },
      listing: {
        select: {
          location: true,
          product: { select: { title: true } },
        },
      },
      rooms: { select: { id: true, type: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return {
    success: true as const,
    data: tickets.map((ticket) => {
      const myRoom = ticket.rooms.find((room) => {
        if (auth.user.role === "BUYER") return room.type === "BUYER_AGENT";
        if (auth.user.role === "SELLER") return room.type === "SELLER_AGENT";
        return room.type === "BUYER_AGENT";
      });
      return {
        id: ticket.id,
        referenceCode: ticket.referenceCode,
        status: ticket.status,
        zoneName: ticket.zone.name,
        productTitle: ticket.listing?.product.title ?? "Materials deal",
        location: ticket.listing?.location ?? ticket.zone.name,
        createdAt: ticket.createdAt.toISOString(),
        roomId: myRoom?.id ?? null,
      };
    }),
  };
}

function counterpartName(
  room: {
    type: string;
    buyer?: { name: string; companyName: string } | null;
    seller?: { name: string; companyName: string } | null;
    agent?: { name: string; companyName: string } | null;
  },
  _viewerId: string,
  viewerRole: string
): string {
  const label = (user?: { name: string; companyName: string } | null) =>
    user?.companyName || user?.name || null;

  if (room.type === "DIRECT") {
    if (viewerRole === "SELLER") return label(room.buyer) ?? "Buyer";
    return label(room.seller) ?? "Supplier";
  }
  if (room.type === "BUYER_AGENT") {
    if (viewerRole === "FIELD_AGENT" || viewerRole === "ADMIN") {
      return label(room.buyer) ?? "Buyer";
    }
    return label(room.agent) ?? "Local agent";
  }
  if (viewerRole === "FIELD_AGENT" || viewerRole === "ADMIN") {
    return label(room.seller) ?? "Supplier";
  }
  return label(room.agent) ?? "Local agent";
}

function revalidateMarketplaceSurfaces() {
  revalidatePath("/buyer/messages");
  revalidatePath("/seller/messages");
  revalidatePath("/seller/dashboard");
  revalidatePath("/seller/deals");
  revalidatePath("/buyer/deals");
  revalidatePath("/agent");
  revalidatePath("/agent/messages");
  revalidatePath("/agent/deals", "layout");
  revalidatePath("/buyer/enquiries");
  revalidatePath("/seller/enquiries");
  revalidatePath("/buyer/catalog");
  revalidatePath("/buyer/category/all");
}
