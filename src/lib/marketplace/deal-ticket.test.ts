import { describe, expect, it } from "vitest";

import {
  assertDealTicketTransition,
  canAgentClaimTicket,
  canTransitionDealTicket,
  isOpenDealTicket,
  isTerminalDealTicket,
} from "@/lib/marketplace/deal-ticket";

describe("deal ticket transitions", () => {
  it("allows the happy path and cancellation from each open state", () => {
    expect(canTransitionDealTicket("PENDING_AGENT", "AGENT_ASSIGNED")).toBe(true);
    expect(canTransitionDealTicket("AGENT_ASSIGNED", "IN_INSPECTION")).toBe(true);
    expect(canTransitionDealTicket("IN_INSPECTION", "COMPLETED")).toBe(true);
    expect(canTransitionDealTicket("PENDING_AGENT", "CANCELLED")).toBe(true);
    expect(canTransitionDealTicket("AGENT_ASSIGNED", "CANCELLED")).toBe(true);
    expect(canTransitionDealTicket("IN_INSPECTION", "CANCELLED")).toBe(true);
  });

  it("blocks skipping the agent — the FREE-supplier bypass", () => {
    expect(canTransitionDealTicket("PENDING_AGENT", "COMPLETED")).toBe(false);
    expect(canTransitionDealTicket("PENDING_AGENT", "IN_INSPECTION")).toBe(false);
    expect(canTransitionDealTicket("AGENT_ASSIGNED", "COMPLETED")).toBe(false);
  });

  it("blocks moving out of a terminal state", () => {
    expect(canTransitionDealTicket("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransitionDealTicket("CANCELLED", "PENDING_AGENT")).toBe(false);
  });

  it("rejects unknown statuses", () => {
    expect(canTransitionDealTicket("PENDING", "COMPLETED")).toBe(false);
  });

  it("throws a readable error from the assertion helper", () => {
    expect(() => assertDealTicketTransition("PENDING_AGENT", "COMPLETED")).toThrow(
      /PENDING_AGENT → COMPLETED/
    );
  });

  it("classifies open vs terminal statuses", () => {
    expect(isOpenDealTicket("PENDING_AGENT")).toBe(true);
    expect(isOpenDealTicket("IN_INSPECTION")).toBe(true);
    expect(isTerminalDealTicket("COMPLETED")).toBe(true);
    expect(isTerminalDealTicket("AGENT_ASSIGNED")).toBe(false);
  });
});

describe("canAgentClaimTicket", () => {
  const base = {
    ticketStatus: "PENDING_AGENT",
    ticketZoneId: "zone-koye",
    ticketAgentId: null as string | null,
    agentZoneId: "zone-koye",
    agentIsActive: true,
  };

  it("allows an active agent in the ticket's zone to claim", () => {
    expect(canAgentClaimTicket(base)).toBe(true);
  });

  it("rejects a claim from a different zone", () => {
    expect(canAgentClaimTicket({ ...base, agentZoneId: "zone-bole" })).toBe(false);
  });

  it("rejects a second claim on an already assigned ticket", () => {
    expect(
      canAgentClaimTicket({
        ...base,
        ticketStatus: "AGENT_ASSIGNED",
        ticketAgentId: "other-agent",
      })
    ).toBe(false);
  });

  it("rejects an inactive agent", () => {
    expect(canAgentClaimTicket({ ...base, agentIsActive: false })).toBe(false);
  });
});
