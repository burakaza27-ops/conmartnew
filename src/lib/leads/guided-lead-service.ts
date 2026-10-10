// =============================================================================
// ConMart — Agent Guided Leads Service
// =============================================================================
// Implements the "Get Guided" / "Request a Visit" workflow:
// 1. Lead creation for buyers (free, anonymous-friendly).
// 2. Lead inbox & area assignment for Commission Agents.
// 3. 5-stage status workflow: New -> Assigned -> Guiding -> Delivered -> Closed.
// 4. Commission ledger tracking for CONMART accounting.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import { GuidedLeadStatus, AgentCommissionStatus } from "@prisma/client";
import { normalizeEthiopianPhone } from "@/lib/validations";

export interface CreateGuidedLeadParams {
  materialNeeded: string;
  quantity: string;
  areaLocation: string;
  buyerPhone: string;
  buyerName?: string;
  preferredVisitTime?: string;
  notes?: string;
  targetSellerId?: string;
}

/**
 * Generates an easily readable reference code for buyer confirmation (e.g. CM-G-48219).
 */
function generateLeadReferenceCode(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `CM-G-${num}`;
}

/**
 * Submits a "Get Guided" lead from a buyer. Free and does not require account login.
 */
export async function createGuidedLead(params: CreateGuidedLeadParams) {
  const referenceCode = generateLeadReferenceCode();
  const normalizedPhone = normalizeEthiopianPhone(params.buyerPhone);

  const lead = await db.guidedLead.create({
    data: {
      referenceCode,
      materialNeeded: params.materialNeeded.trim(),
      quantity: params.quantity.trim(),
      areaLocation: params.areaLocation.trim(),
      buyerPhone: normalizedPhone,
      buyerName: params.buyerName?.trim() || null,
      preferredVisitTime: params.preferredVisitTime?.trim() || null,
      notes: params.notes?.trim() || null,
      targetSellerId: params.targetSellerId || null,
      status: GuidedLeadStatus.NEW,
    },
  });

  return {
    success: true,
    leadId: lead.id,
    referenceCode: lead.referenceCode,
    estimatedResponseTime: "Within 30–60 minutes during business hours",
  };
}

/**
 * Lead Inbox fetcher for Agents and Admins.
 */
export async function getGuidedLeads(filters?: {
  status?: GuidedLeadStatus;
  agentId?: string;
  area?: string;
  search?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.agentId) where.assignedAgentId = filters.agentId;
  if (filters?.area) where.areaLocation = { contains: filters.area, mode: "insensitive" };
  if (filters?.search) {
    where.OR = [
      { referenceCode: { contains: filters.search, mode: "insensitive" } },
      { materialNeeded: { contains: filters.search, mode: "insensitive" } },
      { buyerPhone: { contains: filters.search } },
    ];
  }

  const leads = await db.guidedLead.findMany({
    where,
    include: {
      assignedAgent: {
        select: { id: true, name: true, phone: true },
      },
      targetSeller: {
        select: { id: true, name: true, companyName: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 50,
  });

  return leads;
}

/**
 * Assigns a lead to an agent (admin assignment or agent self-claim).
 * Guarded with an atomic status check (where: { id: leadId, status: 'NEW' })
 * to ensure field agents cannot hijack or overwrite active assignments.
 */
export async function assignGuidedLead(leadId: string, agentId: string) {
  const result = await db.guidedLead.updateMany({
    where: {
      id: leadId,
      status: GuidedLeadStatus.NEW,
    },
    data: {
      assignedAgentId: agentId,
      status: GuidedLeadStatus.ASSIGNED,
    },
  });

  if (result.count === 0) {
    throw new Error(
      "Guided lead is no longer available for assignment or has already been assigned."
    );
  }

  return db.guidedLead.findUniqueOrThrow({
    where: { id: leadId },
  });
}

/**
 * 5-Stage Status Workflow: New -> Assigned -> Guiding -> Delivered -> Closed.
 */
export async function updateGuidedLeadStatus(params: {
  leadId: string;
  agentId?: string;
  status: GuidedLeadStatus;
  closeReason?: string;
}) {
  const currentLead = await db.guidedLead.findUnique({
    where: { id: params.leadId },
  });
  if (!currentLead) {
    throw new Error("Guided lead not found");
  }

  // If caller is an agent (agentId provided), verify IDOR authorization:
  // Cannot modify leads assigned to a different agent.
  if (params.agentId && currentLead.assignedAgentId && currentLead.assignedAgentId !== params.agentId) {
    throw new Error("You are not authorized to update a lead assigned to another agent.");
  }

  if (params.status === GuidedLeadStatus.CLOSED && !params.closeReason) {
    throw new Error("A reason is required when closing an undelivered lead (e.g. buyer unreachable, out of stock, price mismatch)");
  }

  return db.guidedLead.update({
    where: { id: params.leadId },
    data: {
      status: params.status,
      closeReason: params.closeReason || null,
      ...(params.agentId && { assignedAgentId: params.agentId }),
    },
  });
}

/**
 * Records fee earned per delivered guided lead for CONMART accounting ledger.
 * Idempotent: guarantees exactly one commission entry per guided lead.
 */
export async function recordAgentCommission(params: {
  guidedLeadId: string;
  agentId: string;
  feeAmount: number;
  notes?: string;
}) {
  const existing = await db.agentCommissionRecord.findFirst({
    where: { guidedLeadId: params.guidedLeadId },
  });

  if (existing) {
    return existing;
  }

  return db.agentCommissionRecord.create({
    data: {
      guidedLeadId: params.guidedLeadId,
      agentId: params.agentId,
      feeAmount: params.feeAmount,
      status: AgentCommissionStatus.DUE,
      notes: params.notes,
    },
  });
}

/**
 * Returns commission summary for an agent.
 */
export async function getAgentCommissionSummary(agentId: string) {
  const records = await db.agentCommissionRecord.findMany({
    where: { agentId },
    include: {
      guidedLead: {
        select: { referenceCode: true, materialNeeded: true, areaLocation: true },
      },
    },
    orderBy: { recordedAt: "desc" },
  });

  let totalDue = 0;
  let totalPaid = 0;

  for (const r of records) {
    const amt = Number(r.feeAmount);
    if (r.status === AgentCommissionStatus.DUE) totalDue += amt;
    else if (r.status === AgentCommissionStatus.PAID) totalPaid += amt;
  }

  return {
    records,
    totalDue,
    totalPaid,
    totalEarned: totalDue + totalPaid,
  };
}
