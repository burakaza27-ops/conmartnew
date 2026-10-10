import { describe, expect, it } from "vitest";
import {
  submitSubscriptionPaymentSchema,
  createGuidedLeadSchema,
  updateGuidedLeadStatusSchema,
} from "@/lib/validations";
import { SYSTEM_CONTACTS } from "@/lib/config/system-contacts";

describe("Subscription & Guided Lead Schemas", () => {
  it("validates subscription payment submissions", () => {
    const valid = submitSubscriptionPaymentSchema.safeParse({
      tier: "PREMIUM",
      paymentMethod: "TELEBIRR",
      referenceCode: "TB-98234-XYZ",
    });
    expect(valid.success).toBe(true);

    const invalidTier = submitSubscriptionPaymentSchema.safeParse({
      tier: "ULTIMATE",
      paymentMethod: "TELEBIRR",
      referenceCode: "TB-98234-XYZ",
    });
    expect(invalidTier.success).toBe(false);

    const shortCode = submitSubscriptionPaymentSchema.safeParse({
      tier: "BASIC",
      paymentMethod: "CBE_BANK",
      referenceCode: "1",
    });
    expect(shortCode.success).toBe(false);

    const invalidMethod = submitSubscriptionPaymentSchema.safeParse({
      tier: "BASIC",
      paymentMethod: "PAYPAL",
      referenceCode: "12345",
    });
    expect(invalidMethod.success).toBe(false);
  });

  it("validates guided lead submissions and normalizes buyer phone", () => {
    const valid = createGuidedLeadSchema.safeParse({
      materialNeeded: "Dangote 42.5R Cement",
      quantity: "200 Quintals",
      areaLocation: "Bole Bulbula, Addis Ababa",
      buyerPhone: "0911234567",
      preferredVisitTime: "Tomorrow morning 10am",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.buyerPhone).toBe("+251 91 123 4567");
    }

    const invalid = createGuidedLeadSchema.safeParse({
      materialNeeded: "",
      quantity: "",
      areaLocation: "",
      buyerPhone: "123",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates guided lead status workflow transitions", () => {
    const validDelivered = updateGuidedLeadStatusSchema.safeParse({
      leadId: "lead-123",
      status: "DELIVERED",
    });
    expect(validDelivered.success).toBe(true);

    const closedWithReason = updateGuidedLeadStatusSchema.safeParse({
      leadId: "lead-123",
      status: "CLOSED",
      closeReason: "Buyer canceled project",
    });
    expect(closedWithReason.success).toBe(true);
  });

  it("contains official ConMart system contact phone numbers", () => {
    expect(SYSTEM_CONTACTS.primaryPhone).toBe("0911122226");
    expect(SYSTEM_CONTACTS.secondaryPhone).toBe("0961622226");
    expect(SYSTEM_CONTACTS.displayPhone).toContain("0911122226");
  });
});
