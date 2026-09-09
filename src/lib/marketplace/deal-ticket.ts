// =============================================================================
// ConMart — Deal Ticket State Machine
// =============================================================================
// Mediated deals move through a short, one-way path. Skipping a state (for
// example PENDING_AGENT → COMPLETED) would let a supplier close a ticket
// without an agent ever touching it.
// =============================================================================

export const DEAL_TICKET_STATUSES = [
  "PENDING_AGENT",
  "AGENT_ASSIGNED",
  "IN_INSPECTION",
  "COMPLETED",
  "CANCELLED",
] as const;
export type DealTicketStatus = (typeof DEAL_TICKET_STATUSES)[number];

const TRANSITIONS: Record<DealTicketStatus, readonly DealTicketStatus[]> = {
  PENDING_AGENT: ["AGENT_ASSIGNED", "CANCELLED"],
  AGENT_ASSIGNED: ["IN_INSPECTION", "CANCELLED"],
  IN_INSPECTION: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionDealTicket(
  from: DealTicketStatus | string,
  to: DealTicketStatus | string
): boolean {
  if (!isDealTicketStatus(from) || !isDealTicketStatus(to)) {
    return false;
  }
  return TRANSITIONS[from].includes(to);
}

export function assertDealTicketTransition(
  from: DealTicketStatus | string,
  to: DealTicketStatus | string
): void {
  if (!canTransitionDealTicket(from, to)) {
    throw new Error(`Illegal deal-ticket transition: ${from} → ${to}`);
  }
}

export function isOpenDealTicket(status: DealTicketStatus | string): boolean {
  return (
    status === "PENDING_AGENT" ||
    status === "AGENT_ASSIGNED" ||
    status === "IN_INSPECTION"
  );
}

export function isTerminalDealTicket(status: DealTicketStatus | string): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

/**
 * An agent may claim only an unassigned ticket in their own registered zone.
 * Zone mismatch is the obvious bypass ("I'll just claim the Bole ticket from
 * Hawassa") and is rejected here before any write.
 */
export function canAgentClaimTicket(input: {
  ticketStatus: DealTicketStatus | string;
  ticketZoneId: string;
  ticketAgentId?: string | null;
  agentZoneId: string;
  agentIsActive: boolean;
}): boolean {
  return (
    input.agentIsActive &&
    input.ticketStatus === "PENDING_AGENT" &&
    !input.ticketAgentId &&
    input.ticketZoneId === input.agentZoneId
  );
}

export function isDealTicketStatus(value: string): value is DealTicketStatus {
  return (DEAL_TICKET_STATUSES as readonly string[]).includes(value);
}
