// =============================================================================
// ConMart — 01B Online Agent Onboarding & Privacy Tests
// =============================================================================

import { describe, expect, it } from "vitest";
import {
  submitAgentApplicationSchema,
  reviewAgentApplicationSchema,
} from "@/lib/validations";
import { maskPhoneNumber } from "@/lib/agents/agent-onboarding-service";

describe("01B — Online Agent Registration & Vetting Tests", () => {
  const validApp = {
    fullName: "Abebe Kifle",
    phone: "+251 912 345 678",
    city: "Addis Ababa",
    subCity: "Bole",
    grade12DocUrl: "https://example.com/docs/grade12.pdf",
    identityDocUrl: "https://example.com/docs/national_id.jpg",
    serviceArea: "Bole",
    latitude: 9.0054,
    longitude: 38.7891,
    travelRadiusKm: 5,
    availableDaysHours: "Mon - Fri, 9:00 - 17:00",
    isAvailableForAssignments: true,
    guarantorType: "GOVERNMENT_EMPLOYEE" as const,
    guarantorName: "Tesfaye Degu",
    guarantorPhone: "0912345678",
    guarantorEmployer: "City Administration",
    guarantorRelationship: "Colleague",
    guarantorDocUrl: "https://example.com/docs/guarantor.pdf",
    guarantorConsentObtained: true,
  };

  it("validates a complete Grade 12 and government guarantor application", () => {
    const res = submitAgentApplicationSchema.safeParse(validApp);
    expect(res.success).toBe(true);
  });

  it("validates a community/other guarantee application", () => {
    const communityApp = {
      ...validApp,
      guarantorType: "COMMUNITY_OR_OTHER" as const,
      guarantorName: "Woreda 03 Elder Committee",
      guarantorDescription: "Community elder reference and property guarantee",
      guarantorEmployer: undefined,
    };
    const res = submitAgentApplicationSchema.safeParse(communityApp);
    expect(res.success).toBe(true);
  });

  it("rejects application if guarantor consent is not confirmed", () => {
    const invalidApp = {
      ...validApp,
      guarantorConsentObtained: false,
    };
    const res = submitAgentApplicationSchema.safeParse(invalidApp);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("guarantor consent");
    }
  });

  it("rejects application if Grade 12 document is missing", () => {
    const invalidApp = {
      ...validApp,
      grade12DocUrl: "",
    };
    const res = submitAgentApplicationSchema.safeParse(invalidApp);
    expect(res.success).toBe(false);
  });

  it("rejects application if National ID document is missing", () => {
    const invalidApp = {
      ...validApp,
      identityDocUrl: "",
    };
    const res = submitAgentApplicationSchema.safeParse(invalidApp);
    expect(res.success).toBe(false);
  });

  it("rejects invalid Ethiopian phone format for applicant or guarantor", () => {
    const invalidApp = {
      ...validApp,
      guarantorPhone: "12345",
    };
    const res = submitAgentApplicationSchema.safeParse(invalidApp);
    expect(res.success).toBe(false);
  });

  describe("Admin Review Actions & Checklist Schema", () => {
    it("validates approval with complete checklist", () => {
      const res = reviewAgentApplicationSchema.safeParse({
        agentProfileId: "prof-123",
        action: "APPROVE",
        checklistPhoneVerified: true,
        checklistGrade12Reviewed: true,
        checklistIdentityReviewed: true,
        checklistGuaranteeVerified: true,
        checklistAreaConfirmed: true,
      });
      expect(res.success).toBe(true);
    });

    it("validates request correction with reason", () => {
      const res = reviewAgentApplicationSchema.safeParse({
        agentProfileId: "prof-123",
        action: "REQUEST_CORRECTION",
        rejectionReason: "Grade 12 certificate is blurry. Please re-upload a clear scan.",
      });
      expect(res.success).toBe(true);
    });

    it("validates rejection and suspension actions", () => {
      expect(
        reviewAgentApplicationSchema.safeParse({
          agentProfileId: "prof-123",
          action: "REJECT",
          rejectionReason: "Fraudulent guarantor document",
        }).success
      ).toBe(true);

      expect(
        reviewAgentApplicationSchema.safeParse({
          agentProfileId: "prof-123",
          action: "SUSPEND",
          rejectionReason: "Unresponsive to assigned buyers",
        }).success
      ).toBe(true);
    });
  });

  describe("Privacy Masking (Screen 6 Rule)", () => {
    it("masks Ethiopian phone numbers correctly before assignment", () => {
      const masked = maskPhoneNumber("+251912345678");
      expect(masked).toBe("+251 91 ••• ••78");
    });

    it("handles spaced phone numbers cleanly", () => {
      const masked = maskPhoneNumber("+251 91 123 4567");
      expect(masked).toContain("••• ••");
    });

    it("provides safe fallback on empty or short phone strings", () => {
      expect(maskPhoneNumber("")).toBe("+251 •• ••• ••••");
      expect(maskPhoneNumber("123")).toBe("+251 •• ••• ••••");
    });
  });
});
