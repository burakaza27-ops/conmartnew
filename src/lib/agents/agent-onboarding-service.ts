// =============================================================================
// ECON — 01B Online Agent Registration, Vetting & Approval Service
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
  AgentServiceType,
  VehicleType,
  AgentCreditTxType,
  WalletTxStatus,
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
 * Submits or updates an online agent/driver application (01B Screens 2, 3, 4).
 * Transitions status to UNDER_REVIEW and preserves marketplace hub, vehicle, and document links.
 */
export async function submitAgentApplication(
  userId: string,
  input: SubmitAgentApplicationInput
) {
  const normalizedPhone = normalizeEthiopianPhone(input.phone);
  const normalizedGuarantorPhone = input.guarantorPhone
    ? normalizeEthiopianPhone(input.guarantorPhone)
    : null;
  const zoneId = await resolveZoneForArea(input.marketplaceHub || input.subCity || input.serviceArea);

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

  // Default introductory 6-month free period if not already set
  const sixMonthsAhead = new Date();
  sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

  const profileData = {
    zoneId,
    city: input.city?.trim() || "Addis Ababa",
    subCity: input.subCity?.trim() || null,
    // Marketplace Hub & Vehicle profile
    marketplaceHub: input.marketplaceHub?.trim() || "Megenagna",
    additionalHubs: input.additionalHubs || [],
    serviceType: (input.serviceType as AgentServiceType) || AgentServiceType.BOTH,
    vehicleType: (input.vehicleType as VehicleType) || null,
    vehiclePlateNumber: input.vehiclePlateNumber?.trim() || null,

    // Documents: Kebele ID, Driver's License, Vehicle Libre
    identityDocUrl: input.identityDocUrl.trim(),
    drivingLicenseDocUrl: input.drivingLicenseDocUrl?.trim() || null,
    vehicleLibreDocUrl: input.vehicleLibreDocUrl?.trim() || null,
    photoUrl: input.photoUrl?.trim() || null,

    // Work Area & Availability
    serviceArea: input.serviceArea?.trim() || input.marketplaceHub?.trim() || "Addis Ababa",
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    travelRadiusKm: input.travelRadiusKm ?? 5,
    availableDaysHours: input.availableDaysHours?.trim() || "Mon - Sat, 8:00 - 18:00",
    isAvailableForAssignments: input.isAvailableForAssignments ?? true,

    // 6-Month Intro Period
    introductoryEndsAt: existingProfile?.introductoryEndsAt ?? sixMonthsAhead,

    // Legacy fields preserved as optional
    grade12DocUrl: input.grade12DocUrl?.trim() || null,
    guarantorType: (input.guarantorType as GuarantorType) || null,
    guarantorName: input.guarantorName?.trim() || null,
    guarantorPhone: normalizedGuarantorPhone,
    guarantorEmployer: input.guarantorEmployer?.trim() || null,
    guarantorRelationship: input.guarantorRelationship?.trim() || null,
    guarantorDocUrl: input.guarantorDocUrl?.trim() || null,
    guarantorDescription: input.guarantorDescription?.trim() || null,
    guarantorConsentObtained: input.guarantorConsentObtained ?? false,

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

function extractLocalityTokens(text?: string | null): string[] {
  if (!text) return [];
  const cleaned = text
    .replace(/sub-city|subcity|zone|corridor|area|depot|yard|addis ababa|ethiopia/gi, " ")
    .replace(/[\/,\-\(\)]/g, " ")
    .trim();
  const words = cleaned
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3);
  return Array.from(new Set(words));
}

/**
 * Retrieves nearby visit requests for an approved agent (01B Screen 6).
 * Enforces intelligent proximity matching and privacy masking:
 * Buyer phone is masked until assigned to this agent.
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

  const rawTokens = [
    ...extractLocalityTokens(profile.serviceArea),
    ...extractLocalityTokens(profile.subCity),
    ...extractLocalityTokens(profile.city),
  ];
  const localityTokens = Array.from(new Set(rawTokens));

  // Find requests: assigned to this agent OR any new unassigned leads
  const leads = await db.guidedLead.findMany({
    where: {
      OR: [
        { assignedAgentId: userId },
        { status: GuidedLeadStatus.NEW },
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
    take: 50,
  });

  const formattedRequests = leads.map((lead) => {
    const isAssignedToMe = lead.assignedAgentId === userId;
    const leadAreaLower = (lead.areaLocation || "").toLowerCase();
    const isNearby =
      localityTokens.length > 0 &&
      localityTokens.some((token) => leadAreaLower.includes(token));

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
      isNearby,
      createdAt: lead.createdAt.toISOString(),
    };
  });

  // Sort: assigned to me first, then nearby leads, then others
  formattedRequests.sort((a, b) => {
    if (a.isPhoneRevealed && !b.isPhoneRevealed) return -1;
    if (!a.isPhoneRevealed && b.isPhoneRevealed) return 1;
    if (a.isNearby && !b.isNearby) return -1;
    if (!a.isNearby && b.isNearby) return 1;
    return 0;
  });

  return {
    isApproved: true,
    approvalStatus: profile.approvalStatus,
    profile,
    requests: formattedRequests,
  };
}

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/config/env";

/**
 * Resolves a stored document URL or storage key into a secure, short-lived presigned URL (1 hour).
 */
export async function createPresignedDocumentUrl(
  urlOrPath: string | null | undefined
): Promise<string | null> {
  if (!urlOrPath) return null;
  if (
    urlOrPath.startsWith("https://local-private-storage") ||
    urlOrPath.startsWith("https://example.com")
  ) {
    return urlOrPath;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return urlOrPath;

  const bucket = env.SUPABASE_STORAGE_BUCKET;
  let path = urlOrPath;
  if (urlOrPath.includes("/agent-docs/")) {
    const parts = urlOrPath.split("/agent-docs/");
    path = `agent-docs/${parts[1]?.split("?")[0]}`;
  } else if (urlOrPath.startsWith("/")) {
    path = urlOrPath.replace(/^\//, "");
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn("Failed to generate presigned URL for document:", err);
  }

  return urlOrPath;
}

/**
 * Admin: Retrieves all agent applications for vetting (01B Screen 5).
 * Enforces short-lived presigned URLs for viewing sensitive documents (National IDs, Driving Licenses, Libres).
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
      { marketplaceHub: { contains: filters.search, mode: "insensitive" } },
      { serviceArea: { contains: filters.search, mode: "insensitive" } },
      { subCity: { contains: filters.search, mode: "insensitive" } },
      { vehiclePlateNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const profiles = await db.agentProfile.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
      zone: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(
    profiles.map(async (p) => ({
      ...p,
      identityDocUrl: await createPresignedDocumentUrl(p.identityDocUrl),
      drivingLicenseDocUrl: await createPresignedDocumentUrl(p.drivingLicenseDocUrl),
      vehicleLibreDocUrl: await createPresignedDocumentUrl(p.vehicleLibreDocUrl),
      photoUrl: await createPresignedDocumentUrl(p.photoUrl),
      grade12DocUrl: await createPresignedDocumentUrl(p.grade12DocUrl),
      guarantorDocUrl: await createPresignedDocumentUrl(p.guarantorDocUrl),
    }))
  );
}

/**
 * Admin: Reviews an agent application with checklist flags (01B Screen 5).
 * On approval, activates the 6-month free introductory period if not set.
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

  const existing = await db.agentProfile.findUnique({
    where: { id: input.agentProfileId },
    select: { introductoryEndsAt: true },
  });

  const sixMonthsAhead = new Date();
  sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

  return db.agentProfile.update({
    where: { id: input.agentProfileId },
    data: {
      approvalStatus: targetStatus,
      isActive,
      rejectionReason: input.rejectionReason?.trim() || null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      ...(targetStatus === AgentApprovalStatus.APPROVED && {
        isOnline: true,
        lastOnlineAt: new Date(),
        introductoryEndsAt: existing?.introductoryEndsAt ?? sixMonthsAhead,
      }),
      ...(input.checklistPhoneVerified !== undefined && {
        checklistPhoneVerified: input.checklistPhoneVerified,
      }),
      ...(input.checklistIdentityReviewed !== undefined && {
        checklistIdentityReviewed: input.checklistIdentityReviewed,
      }),
      ...(input.checklistLicenseReviewed !== undefined && {
        checklistLicenseReviewed: input.checklistLicenseReviewed,
      }),
      ...(input.checklistLibreReviewed !== undefined && {
        checklistLibreReviewed: input.checklistLibreReviewed,
      }),
      ...(input.checklistAreaConfirmed !== undefined && {
        checklistAreaConfirmed: input.checklistAreaConfirmed,
      }),
      ...(input.checklistGrade12Reviewed !== undefined && {
        checklistGrade12Reviewed: input.checklistGrade12Reviewed,
      }),
      ...(input.checklistGuaranteeVerified !== undefined && {
        checklistGuaranteeVerified: input.checklistGuaranteeVerified,
      }),
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  });
}

/**
 * Toggles an approved agent's real-time online/offline dispatch availability.
 */
export async function toggleAgentOnlineStatus(
  userId: string,
  isOnline: boolean
) {
  const profile = await db.agentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Agent profile not found.");
  }

  if (profile.approvalStatus !== AgentApprovalStatus.APPROVED) {
    throw new Error("Only approved agents can toggle dispatch availability.");
  }

  return db.agentProfile.update({
    where: { userId },
    data: {
      isOnline,
      lastOnlineAt: new Date(),
    },
  });
}

/**
 * Retrieves the agent's prepaid wallet status, 6-month intro countdown, and ledger.
 */
export async function getAgentWalletStatus(userId: string) {
  const profile = await db.agentProfile.findUnique({
    where: { userId },
    include: {
      creditTransactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!profile) {
    throw new Error("Agent profile not found.");
  }

  const now = new Date();
  const introEndsAt = profile.introductoryEndsAt ? new Date(profile.introductoryEndsAt) : null;
  const isIntroductoryActive = introEndsAt ? now < introEndsAt : false;
  const daysRemainingInIntro = introEndsAt
    ? Math.max(0, Math.ceil((introEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const jobCreditBalance = Number(profile.jobCreditBalance);
  const canAcceptJobs = isIntroductoryActive || jobCreditBalance >= 100;

  return {
    profileId: profile.id,
    jobCreditBalance,
    introductoryEndsAt: introEndsAt ? introEndsAt.toISOString() : null,
    isIntroductoryActive,
    daysRemainingInIntro,
    canAcceptJobs,
    isOnline: profile.isOnline,
    marketplaceHub: profile.marketplaceHub,
    vehicleType: profile.vehicleType,
    vehiclePlateNumber: profile.vehiclePlateNumber,
    transactions: profile.creditTransactions.map((tx) => ({
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type,
      status: tx.status,
      referenceCode: tx.referenceCode,
      leadId: tx.leadId,
      notes: tx.notes,
      createdAt: tx.createdAt.toISOString(),
    })),
  };
}

/**
 * Top-up agent prepaid job credits (e.g. Telebirr or CBE deposit).
 */
export async function topUpAgentCredits(
  userId: string,
  amount: number,
  referenceCode: string,
  notes?: string
) {
  const profile = await db.agentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Agent profile not found.");
  }

  return db.$transaction(async (tx) => {
    const creditTx = await tx.agentCreditTx.create({
      data: {
        agentProfileId: profile.id,
        amount,
        type: AgentCreditTxType.TOP_UP,
        status: WalletTxStatus.COMPLETED,
        referenceCode: referenceCode.trim(),
        notes: notes?.trim() || `Prepaid job credit deposit via ${referenceCode}`,
      },
    });

    const updatedProfile = await tx.agentProfile.update({
      where: { id: profile.id },
      data: {
        jobCreditBalance: { increment: amount },
      },
    });

    return {
      transaction: creditTx,
      newBalance: Number(updatedProfile.jobCreditBalance),
    };
  });
}

/**
 * Charges ETB 100 lead assignment fee when an agent accepts a lead.
 * If agent is within the 6-month free introductory period, charges 0 ETB.
 */
export async function chargeAgentLeadAssignment(
  agentUserId: string,
  leadId: string
) {
  const profile = await db.agentProfile.findUnique({
    where: { userId: agentUserId },
  });

  if (!profile) {
    throw new Error("Agent profile not found.");
  }

  const now = new Date();
  const introEndsAt = profile.introductoryEndsAt ? new Date(profile.introductoryEndsAt) : null;
  const isIntroductoryActive = introEndsAt ? now < introEndsAt : false;

  // 6-month free introductory period: zero fee deducted!
  if (isIntroductoryActive) {
    return { charged: false, amount: 0, reason: "6_MONTH_INTRODUCTORY_FREE" };
  }

  // Post-introductory: 100 ETB per assigned lead
  const currentBalance = Number(profile.jobCreditBalance);
  if (currentBalance < 100) {
    throw new Error(
      "Insufficient job credits. You need at least 100 ETB in your wallet to accept this assignment. Please top up your wallet."
    );
  }

  return db.$transaction(async (tx) => {
    const creditTx = await tx.agentCreditTx.create({
      data: {
        agentProfileId: profile.id,
        amount: -100,
        type: AgentCreditTxType.ASSIGNMENT_FEE,
        status: WalletTxStatus.COMPLETED,
        leadId,
        referenceCode: `LEAD-${leadId.slice(-6).toUpperCase()}`,
        notes: `Platform assignment fee for lead ${leadId}`,
      },
    });

    const updatedProfile = await tx.agentProfile.update({
      where: { id: profile.id },
      data: {
        jobCreditBalance: { decrement: 100 },
      },
    });

    return {
      charged: true,
      amount: 100,
      transaction: creditTx,
      newBalance: Number(updatedProfile.jobCreditBalance),
    };
  });
}

/**
 * Handles dispute refunds for unreachable or fraudulent buyer requests.
 */
export async function disputeAgentLeadAssignment(
  agentUserId: string,
  leadId: string,
  reason: string
) {
  const profile = await db.agentProfile.findUnique({
    where: { userId: agentUserId },
  });

  if (!profile) {
    throw new Error("Agent profile not found.");
  }

  // Check if fee was deducted for this lead
  const existingFee = await db.agentCreditTx.findFirst({
    where: {
      agentProfileId: profile.id,
      leadId,
      type: AgentCreditTxType.ASSIGNMENT_FEE,
    },
  });

  if (existingFee) {
    return db.$transaction(async (tx) => {
      const refundTx = await tx.agentCreditTx.create({
        data: {
          agentProfileId: profile.id,
          amount: 100,
          type: AgentCreditTxType.DISPUTE_REFUND,
          status: WalletTxStatus.COMPLETED,
          leadId,
          referenceCode: `REFUND-${leadId.slice(-6).toUpperCase()}`,
          notes: `Dispute credit refund: ${reason}`,
        },
      });

      const updatedProfile = await tx.agentProfile.update({
        where: { id: profile.id },
        data: {
          jobCreditBalance: { increment: 100 },
        },
      });

      return {
        refunded: true,
        amount: 100,
        transaction: refundTx,
        newBalance: Number(updatedProfile.jobCreditBalance),
      };
    });
  }

  return { refunded: false, amount: 0, reason: "No fee was deducted during intro period" };
}

