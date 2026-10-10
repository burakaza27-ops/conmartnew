// =============================================================================
// ConMart — 01B Online Agent Registration, Vetting & Approval Service
// =============================================================================
// Implements the Yakob Dan specification for Commission / Field Agent onboarding:
// 1. Role Eligibility & Application submission with Grade 12 & ID evidence.
// 2. Service area & approximate coordinates with travel radius.
// 3. Guarantor backing (Government Employee vs. Community / Organization).
// 4. Admin 5-point vetting checklist & multi-state approval pipeline.
// 5. Holding view for applicants under review.
// 6. Assignment release with buyer phone privacy masking until acceptance.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import {
  AgentApprovalStatus,
  GuarantorType,
  GuidedLeadStatus,
} from "@prisma/client";
import {
  normalizeEthiopianPhone,
  SubmitAgentApplicationInput,
  ReviewAgentApplicationInput,
} from "@/lib/validations";

/**
 * Mask an Ethiopian phone number for privacy protection (e.g. +251 91 ••• ••34).
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "+251 •• ••• ••••";
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+251") && cleaned.length >= 12) {
    const prefix = cleaned.slice(0, 4);   // "+251"
    const operator = cleaned.slice(4, 6); // "91"
    const end = cleaned.slice(-2);        // "78"
    return `${prefix} ${operator} ••• ••${end}`;
  }
  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    const operator = cleaned.slice(1, 3);
    const end = cleaned.slice(-2);
    return `+251 ${operator} ••• ••${end}`;
  }
  if (cleaned.length >= 9) {
    const end = cleaned.slice(-2);
    return `+251 91 ••• ••${end}`;
  }
  return "+251 •• ••• ••••";
}

/**
 * Resolves an active Zone ID matching the given sub-city or service area string.
 * Defaults to the Addis Ababa zone or the first available zone in the DB.
 */
async function resolveZoneForArea(areaOrSubCity?: string | null): Promise<string> {
  if (areaOrSubCity) {
    const slugQuery = areaOrSubCity.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const matchedZone = await db.zone.findFirst({
      where: {
        OR: [
          { slug: { contains: slugQuery, mode: "insensitive" } },
          { name: { contains: areaOrSubCity, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (matchedZone) return matchedZone.id;
  }

  // Fallback to Addis Ababa or any zone
  const fallback = await db.zone.findFirst({
    where: { region: "Addis Ababa" },
    select: { id: true },
  });
  if (fallback) return fallback.id;

  const anyZone = await db.zone.findFirst({ select: { id: true } });
  if (anyZone) return anyZone.id;

  throw new Error("No operational zone found in database.");
}

/**
 * Submits or updates an online agent application (01B Screens 2, 3, 4).
 * Transitions status to UNDER_REVIEW and preserves document links.
 */
export async function submitAgentApplication(
  userId: string,
  input: SubmitAgentApplicationInput
) {
  const normalizedPhone = normalizeEthiopianPhone(input.phone);
  const normalizedGuarantorPhone = normalizeEthiopianPhone(input.guarantorPhone);
  const zoneId = await resolveZoneForArea(input.subCity || input.serviceArea);

  // Update applicant user details and ensure role is FIELD_AGENT
  await db.user.update({
    where: { id: userId },
    data: {
      name: input.fullName.trim(),
      phone: normalizedPhone,
      role: "FIELD_AGENT",
    },
  });

  const existingProfile = await db.agentProfile.findUnique({
    where: { userId },
  });

  const profileData = {
    zoneId,
    city: input.city.trim(),
    subCity: input.subCity.trim(),
    grade12DocUrl: input.grade12DocUrl.trim(),
    identityDocUrl: input.identityDocUrl.trim(),
    serviceArea: input.serviceArea.trim(),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    travelRadiusKm: input.travelRadiusKm,
    availableDaysHours: input.availableDaysHours.trim(),
    isAvailableForAssignments: input.isAvailableForAssignments,
    guarantorType: input.guarantorType as GuarantorType,
    guarantorName: input.guarantorName.trim(),
    guarantorPhone: normalizedGuarantorPhone,
    guarantorEmployer: input.guarantorEmployer?.trim() || null,
    guarantorRelationship: input.guarantorRelationship?.trim() || null,
    guarantorDocUrl: input.guarantorDocUrl?.trim() || null,
    guarantorDescription: input.guarantorDescription?.trim() || null,
    guarantorConsentObtained: input.guarantorConsentObtained,
    approvalStatus: AgentApprovalStatus.UNDER_REVIEW,
    rejectionReason: null,
  };

  if (existingProfile) {
    return db.agentProfile.update({
      where: { userId },
      data: profileData,
      include: { zone: true, user: true },
    });
  }

  return db.agentProfile.create({
    data: {
      userId,
      ...profileData,
    },
    include: { zone: true, user: true },
  });
}

/**
 * Retrieves the agent profile and vetting status for a user.
 */
export async function getAgentProfile(userId: string) {
  return db.agentProfile.findUnique({
    where: { userId },
    include: {
      zone: true,
      user: {
        select: { id: true, name: true, phone: true, role: true },
      },
    },
  });
}

/**
 * Toggles whether an approved agent is available to receive assignments.
 */
export async function toggleAgentAvailability(
  userId: string,
  isAvailable: boolean
) {
  const profile = await db.agentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Agent profile not found.");
  }

  if (profile.approvalStatus !== AgentApprovalStatus.APPROVED) {
    throw new Error("Only approved agents can toggle assignment availability.");
  }

  return db.agentProfile.update({
    where: { userId },
    data: { isAvailableForAssignments: isAvailable },
  });
}

/**
 * Retrieves nearby visit requests for an approved agent (01B Screen 6).
 * Enforces privacy masking: Buyer phone is masked until assigned to the agent.
 */
export async function getAgentNearbyRequests(userId: string) {
  const profile = await getAgentProfile(userId);
  if (!profile) {
    return { isApproved: false, profile: null, requests: [] };
  }

  if (profile.approvalStatus !== AgentApprovalStatus.APPROVED) {
    return {
      isApproved: false,
      approvalStatus: profile.approvalStatus,
      rejectionReason: profile.rejectionReason,
      profile,
      requests: [],
    };
  }

  // Find requests in or near the agent's service area or unassigned leads
  const leads = await db.guidedLead.findMany({
    where: {
      OR: [
        { assignedAgentId: userId },
        {
          status: GuidedLeadStatus.NEW,
          ...(profile.serviceArea
            ? {
                areaLocation: {
                  contains: profile.serviceArea.trim(),
                  mode: "insensitive",
                },
              }
            : {}),
        },
      ],
    },
    include: {
      targetSeller: {
        select: { id: true, name: true, companyName: true, phone: true },
      },
      assignedAgent: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const formattedRequests = leads.map((lead) => {
    const isAssignedToMe = lead.assignedAgentId === userId;
    return {
      id: lead.id,
      referenceCode: lead.referenceCode,
      materialNeeded: lead.materialNeeded,
      quantity: lead.quantity,
      areaLocation: lead.areaLocation,
      buyerName: lead.buyerName,
      // PRIVACY RULE: Mask phone number unless assigned to this agent
      buyerPhone: isAssignedToMe ? lead.buyerPhone : maskPhoneNumber(lead.buyerPhone),
      isPhoneRevealed: isAssignedToMe,
      preferredVisitTime: lead.preferredVisitTime,
      notes: lead.notes,
      status: lead.status,
      closeReason: lead.closeReason,
      targetSeller: lead.targetSeller,
      assignedAgent: lead.assignedAgent,
      createdAt: lead.createdAt.toISOString(),
    };
  });

  return {
    isApproved: true,
    approvalStatus: profile.approvalStatus,
    profile,
    requests: formattedRequests,
  };
}

/**
 * Admin: Retrieves all agent applications for vetting (01B Screen 5).
 */
export async function adminGetAgentApplications(filters?: {
  status?: AgentApprovalStatus;
  search?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) {
    where.approvalStatus = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { user: { name: { contains: filters.search, mode: "insensitive" } } },
      { user: { phone: { contains: filters.search } } },
      { serviceArea: { contains: filters.search, mode: "insensitive" } },
      { subCity: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.agentProfile.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
      zone: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Admin: Reviews an agent application with checklist flags (01B Screen 5).
 */
export async function adminReviewAgentApplication(
  adminId: string,
  input: ReviewAgentApplicationInput
) {
  let targetStatus: AgentApprovalStatus;
  let isActive = true;

  switch (input.action) {
    case "APPROVE":
      targetStatus = AgentApprovalStatus.APPROVED;
      isActive = true;
      break;
    case "REQUEST_CORRECTION":
      targetStatus = AgentApprovalStatus.CHANGES_REQUIRED;
      isActive = false;
      break;
    case "REJECT":
      targetStatus = AgentApprovalStatus.REJECTED;
      isActive = false;
      break;
    case "SUSPEND":
      targetStatus = AgentApprovalStatus.SUSPENDED;
      isActive = false;
      break;
  }

  return db.agentProfile.update({
    where: { id: input.agentProfileId },
    data: {
      approvalStatus: targetStatus,
      isActive,
      rejectionReason: input.rejectionReason?.trim() || null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      ...(input.checklistPhoneVerified !== undefined && {
        checklistPhoneVerified: input.checklistPhoneVerified,
      }),
      ...(input.checklistGrade12Reviewed !== undefined && {
        checklistGrade12Reviewed: input.checklistGrade12Reviewed,
      }),
      ...(input.checklistIdentityReviewed !== undefined && {
        checklistIdentityReviewed: input.checklistIdentityReviewed,
      }),
      ...(input.checklistGuaranteeVerified !== undefined && {
        checklistGuaranteeVerified: input.checklistGuaranteeVerified,
      }),
      ...(input.checklistAreaConfirmed !== undefined && {
        checklistAreaConfirmed: input.checklistAreaConfirmed,
      }),
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  });
}
