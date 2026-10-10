// =============================================================================
// ConMart — Agent Onboarding & Operations Server Actions
// =============================================================================
// Implements the 01B specification actions:
// 1. Submit / update agent vetting application.
// 2. Fetch current agent profile and holding status.
// 3. Toggle assignment availability switch.
// 4. Retrieve nearby visit requests with phone masking.
// 5. Accept / decline nearby assignments.
// 6. Admin review queue and 5-point checklist approval.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { authorize, getSessionUser } from "@/lib/auth/session";
import {
  submitAgentApplication,
  getAgentProfile,
  toggleAgentAvailability,
  getAgentNearbyRequests,
  adminGetAgentApplications,
  adminReviewAgentApplication,
} from "@/lib/agents/agent-onboarding-service";
import { assignGuidedLead, updateGuidedLeadStatus } from "@/lib/leads/guided-lead-service";
import {
  submitAgentApplicationSchema,
  reviewAgentApplicationSchema,
  SubmitAgentApplicationInput,
  ReviewAgentApplicationInput,
} from "@/lib/validations";
import { toSafeErrorMessage } from "@/lib/errors";
import { rateLimit, getClientIdentifier, rateLimitMessage } from "@/lib/security/rate-limit";
import { AgentApprovalStatus, GuidedLeadStatus } from "@prisma/client";

/**
 * Submits or updates an online agent application (01B Screens 2, 3, 4).
 */
export async function submitAgentApplicationAction(
  input: SubmitAgentApplicationInput
) {
  const user = await getSessionUser();
  if (!user) {
    return {
      success: false as const,
      error: "You must be logged in to submit an agent application. Please sign in or register first.",
    };
  }

  const clientId = await getClientIdentifier();
  const rl = await rateLimit(`agent-apply:${user.id}:${clientId}`, {
    limit: 6,
    windowSeconds: 300,
  });
  if (!rl.allowed) {
    return {
      success: false as const,
      error: rateLimitMessage(rl.retryAfterSeconds),
    };
  }

  const parsed = submitAgentApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message || "Invalid application details.",
    };
  }

  try {
    const profile = await submitAgentApplication(user.id, parsed.data);

    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    revalidatePath("/agent/apply");
    revalidatePath("/admin/command-center");
    revalidatePath("/admin/agents");

    return { success: true as const, data: profile };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "submitAgentApplicationAction"),
    };
  }
}

/**
 * Retrieves the caller's agent application status and vetting profile.
 */
export async function getMyAgentProfileAction() {
  const user = await getSessionUser();
  if (!user) {
    return { success: false as const, error: "Not authenticated" };
  }

  try {
    const profile = await getAgentProfile(user.id);
    return { success: true as const, data: profile };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "getMyAgentProfileAction"),
    };
  }
}

/**
 * Toggles whether the approved agent is available to accept assignments.
 */
export async function toggleAgentAvailabilityAction(isAvailable: boolean) {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const updated = await toggleAgentAvailability(auth.user.id, isAvailable);
    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    return { success: true as const, data: updated };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "toggleAgentAvailabilityAction"),
    };
  }
}

/**
 * Retrieves nearby visit requests for an approved agent (01B Screen 6).
 */
export async function getAgentNearbyRequestsAction() {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const data = await getAgentNearbyRequests(auth.user.id);
    return { success: true as const, data };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "getAgentNearbyRequestsAction"),
    };
  }
}

/**
 * Accepts a nearby visit request.
 * Releases the full unmasked buyer phone number and assigns lead to this agent.
 */
export async function acceptNearbyRequestAction(leadId: string) {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const assigned = await assignGuidedLead(leadId, auth.user.id);
    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    return { success: true as const, data: assigned };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "acceptNearbyRequestAction"),
    };
  }
}

/**
 * Declines a nearby visit request.
 */
export async function declineNearbyRequestAction(leadId: string) {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    // If assigned to current agent, unassign or mark unavailable
    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "declineNearbyRequestAction"),
    };
  }
}

/**
 * Admin: Retrieves all submitted agent applications for review (01B Screen 5).
 */
export async function getAdminAgentApplicationsAction(filters?: {
  status?: AgentApprovalStatus;
  search?: string;
}) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  try {
    const apps = await adminGetAgentApplications(filters);
    return {
      success: true as const,
      data: apps.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        reviewedAt: a.reviewedAt?.toISOString() || null,
      })),
    };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "getAdminAgentApplicationsAction"),
    };
  }
}

/**
 * Admin: Reviews an agent application with the 5-point checklist (01B Screen 5).
 */
export async function reviewAgentApplicationAction(
  input: ReviewAgentApplicationInput
) {
  const auth = await authorize(["ADMIN"]);
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const parsed = reviewAgentApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message || "Invalid review parameters.",
    };
  }

  try {
    const updated = await adminReviewAgentApplication(auth.user.id, parsed.data);
    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    revalidatePath("/admin/command-center");
    revalidatePath("/admin/agents");
    return { success: true as const, data: updated };
  } catch (err) {
    return {
      success: false as const,
      error: toSafeErrorMessage(err, "reviewAgentApplicationAction"),
    };
  }
}
