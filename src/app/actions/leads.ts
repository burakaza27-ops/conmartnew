// =============================================================================
// ConMart — Guided Leads & Telemetry Server Actions
// =============================================================================
// Handles:
// 1. "Get Guided" / "Request a Visit" lead submissions from buyers.
// 2. Real-time telemetry logging (Call clicks, WhatsApp taps, Map directions).
// 3. Agent Lead Inbox, assignments, and 5-stage status workflow transitions.
// 4. Commission ledger records for delivered agent deals.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { authorize, getSessionUser } from "@/lib/auth/session";
import {
  createGuidedLead,
  getGuidedLeads,
  assignGuidedLead,
  updateGuidedLeadStatus,
  recordAgentCommission,
  getAgentCommissionSummary,
} from "@/lib/leads/guided-lead-service";
import { maskPhoneNumber } from "@/lib/agents/agent-onboarding-service";
import { logSupplierLeadEvent } from "@/lib/subscription/subscription-service";
import {
  createGuidedLeadSchema,
  updateGuidedLeadStatusSchema,
  CreateGuidedLeadInput,
  UpdateGuidedLeadStatusInput,
} from "@/lib/validations";
import { toSafeErrorMessage } from "@/lib/errors";
import { rateLimit, getClientIdentifier, rateLimitMessage } from "@/lib/security/rate-limit";
import { GuidedLeadStatus, SupplierLeadEventType } from "@prisma/client";

/**
 * Public/Buyer: Submits a "Get Guided" / "Request a Visit" request.
 * Free, zero payment required, no account required.
 */
export async function submitGuidedLeadAction(input: CreateGuidedLeadInput) {
  const clientId = await getClientIdentifier();
  const rl = await rateLimit(`guided-lead:${clientId}`, { limit: 10, windowSeconds: 60 });
  if (!rl.allowed) {
    return { success: false as const, error: rateLimitMessage(rl.retryAfterSeconds) };
  }


  const parsed = createGuidedLeadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message || "Invalid lead details submitted",
    };
  }

  try {
    const result = await createGuidedLead({
      materialNeeded: parsed.data.materialNeeded,
      quantity: parsed.data.quantity,
      areaLocation: parsed.data.areaLocation,
      buyerPhone: parsed.data.buyerPhone,
      buyerName: parsed.data.buyerName,
      preferredVisitTime: parsed.data.preferredVisitTime,
      notes: parsed.data.notes,
      targetSellerId: parsed.data.targetSellerId,
    });

    // If target seller was specified, log an AGENT_DELIVERED event trigger
    if (parsed.data.targetSellerId) {
      await logSupplierLeadEvent({
        sellerId: parsed.data.targetSellerId,
        eventType: SupplierLeadEventType.AGENT_DELIVERED,
        buyerPhone: parsed.data.buyerPhone,
        metadata: { referenceCode: result.referenceCode },
      });
    }

    revalidatePath("/agent");
    revalidatePath("/agent/leads");

    return { success: true as const, data: result };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "submitGuidedLeadAction") };
  }
}


/**
 * Public/Buyer Telemetry: Records when a buyer interacts with a subscribed supplier
 * (taps Call, WhatsApp deep link, or Get Directions).
 */
export async function logLeadEventAction(params: {
  sellerId: string;
  eventType: SupplierLeadEventType;
  listingId?: string;
  buyerPhone?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const clientId = await getClientIdentifier();
    const rl = await rateLimit(`telemetry:${clientId}`, { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return { success: false as const, error: "Rate limit exceeded" };
    }

    await logSupplierLeadEvent(params);
    return { success: true as const };
  } catch {
    // Non-blocking telemetry
    return { success: true as const };
  }
}

/**
 * Agent / Admin: Fetches the lead inbox.
 */
export async function getGuidedLeadsAction(filters?: {
  status?: GuidedLeadStatus;
  agentId?: string;
  area?: string;
  search?: string;
  limit?: number;
}) {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const leads = await getGuidedLeads(filters);
    const isAdmin = auth.user.role === "ADMIN";
    const currentUserId = auth.user.id;

    return {
      success: true as const,
      data: leads.map((l) => {
        const isAssignedToMe = l.assignedAgent?.id === currentUserId;
        const shouldRevealPhone = isAdmin || isAssignedToMe;

        return {
          id: l.id,
          referenceCode: l.referenceCode,
          materialNeeded: l.materialNeeded,
          quantity: l.quantity,
          areaLocation: l.areaLocation,
          buyerPhone: shouldRevealPhone ? l.buyerPhone : maskPhoneNumber(l.buyerPhone),
          isPhoneRevealed: shouldRevealPhone,
          buyerName: l.buyerName,
          preferredVisitTime: l.preferredVisitTime,
          notes: l.notes,
          status: l.status,
          closeReason: l.closeReason,
          targetSeller: l.targetSeller
            ? {
                id: l.targetSeller.id,
                name: l.targetSeller.name,
                companyName: l.targetSeller.companyName,
                phone: l.targetSeller.phone,
              }
            : null,
          assignedAgent: l.assignedAgent
            ? {
                id: l.assignedAgent.id,
                name: l.assignedAgent.name,
                phone: l.assignedAgent.phone,
              }
            : null,
          createdAt: l.createdAt.toISOString(),
        };
      }),
    };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "getGuidedLeadsAction") };
  }
}

/**
 * Agent / Admin: Claims or assigns a lead.
 * Field agents can only assign leads to themselves; only Admins can assign to any agent.
 */
export async function assignGuidedLeadAction(leadId: string, targetAgentId?: string) {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const agentId = auth.user.role === "ADMIN" && targetAgentId ? targetAgentId : auth.user.id;

  try {
    const lead = await assignGuidedLead(leadId, agentId);
    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    return { success: true as const, data: lead };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "assignGuidedLeadAction") };
  }
}

/**
 * Agent / Admin: Advances a lead through the 5-stage workflow:
 * NEW -> ASSIGNED -> GUIDING -> DELIVERED -> CLOSED.
 * When DELIVERED, automatically calculates and records agent commission.
 */
export async function updateGuidedLeadStatusAction(
  params: UpdateGuidedLeadStatusInput & { commissionFee?: number }
) {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const parsed = updateGuidedLeadStatusSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message || "Invalid status transition",
    };
  }

  try {
    const updated = await updateGuidedLeadStatus({
      leadId: parsed.data.leadId,
      status: parsed.data.status,
      closeReason: parsed.data.closeReason,
      agentId: auth.user.role === "FIELD_AGENT" ? auth.user.id : undefined,
    });

    // If delivered, record commission ledger entry
    if (parsed.data.status === GuidedLeadStatus.DELIVERED) {
      const agentId = updated.assignedAgentId || auth.user.id;
      // Default agent commission per successful delivery if not specified (e.g. 200 ETB baseline)
      const fee = params.commissionFee && params.commissionFee > 0 ? params.commissionFee : 200;

      await recordAgentCommission({
        guidedLeadId: updated.id,
        agentId,
        feeAmount: fee,
        notes: `Delivery recorded for lead ${updated.referenceCode}`,
      });
    }

    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    revalidatePath("/agent/commissions");

    return { success: true as const, data: updated };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "updateGuidedLeadStatusAction") };
  }
}

/**
 * Agent: Retrieves commission summary & history.
 */
export async function getAgentCommissionSummaryAction() {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const summary = await getAgentCommissionSummary(auth.user.id);
    return { success: true as const, data: summary };
  } catch (err) {
    return { success: false as const, error: toSafeErrorMessage(err, "getAgentCommissionSummaryAction") };
  }
}

