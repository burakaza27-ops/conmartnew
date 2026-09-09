import { describe, expect, it } from "vitest";

import {
  ethiopianPhoneSchema,
  initiateConversationSchema,
  purchaseEnquirySchema,
  registerSchema,
  topUpRequestSchema,
} from "@/lib/validations";

function validRegistration(overrides: Record<string, unknown> = {}) {
  return {
    email: "abebe@example.com",
    password: "Password1",
    confirmPassword: "Password1",
    name: "Abebe Bekele",
    phone: "+251 91 234 5678",
    companyName: "Bekele Construction PLC",
    role: "BUYER",
    ...overrides,
  };
}

describe("registerSchema", () => {
  it("accepts a buyer registration", () => {
    expect(registerSchema.safeParse(validRegistration()).success).toBe(true);
  });

  it("accepts a supplier registration", () => {
    expect(
      registerSchema.safeParse(validRegistration({ role: "SELLER" })).success
    ).toBe(true);
  });

  it("refuses to let a visitor register themselves as an administrator", () => {
    const result = registerSchema.safeParse(validRegistration({ role: "ADMIN" }));
    expect(result.success).toBe(false);
  });

  it("accepts a field agent registration when a zone is selected", () => {
    expect(
      registerSchema.safeParse(
        validRegistration({ role: "FIELD_AGENT", zoneId: "zone-koye-feche" })
      ).success
    ).toBe(true);
  });

  it("requires a zone when registering as a field agent", () => {
    const result = registerSchema.safeParse(
      validRegistration({ role: "FIELD_AGENT" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a blank coverage area for a field agent", () => {
    const result = registerSchema.safeParse(
      validRegistration({ role: "FIELD_AGENT", zoneId: "   " })
    );
    expect(result.success).toBe(false);
  });

  it("requires the two password entries to match", () => {
    const result = registerSchema.safeParse(
      validRegistration({ confirmPassword: "Password2" })
    );
    expect(result.success).toBe(false);
  });

  it.each([
    ["short1A", "fewer than 8 characters"],
    ["alllowercase1", "no uppercase letter"],
    ["ALLUPPERCASE1", "no lowercase letter"],
    ["NoDigitsHere", "no digit"],
  ])("rejects the password %s (%s)", (password) => {
    const result = registerSchema.safeParse(
      validRegistration({ password, confirmPassword: password })
    );
    expect(result.success).toBe(false);
  });
});

describe("ethiopianPhoneSchema", () => {
  it.each(["+251 91 234 5678", "+251912345678", "+251 71 234 5678"])(
    "accepts %s",
    (phone) => {
      expect(ethiopianPhoneSchema.safeParse(phone).success).toBe(true);
    }
  );

  it.each(["0912345678", "+1 555 123 4567", "912345678", ""])(
    "rejects %s",
    (phone) => {
      expect(ethiopianPhoneSchema.safeParse(phone).success).toBe(false);
    }
  );
});

describe("purchaseEnquirySchema", () => {
  const base = {
    listingId: "listing-1",
    qty: 50,
    deliveryAddress: "Bole Sub-City, behind Total station",
  };

  it("defaults the delivery preference", () => {
    const result = purchaseEnquirySchema.parse(base);
    expect(result.deliveryPreference).toBe("SELLER_DELIVERED");
  });

  it("rejects a zero or negative quantity", () => {
    expect(purchaseEnquirySchema.safeParse({ ...base, qty: 0 }).success).toBe(false);
    expect(purchaseEnquirySchema.safeParse({ ...base, qty: -5 }).success).toBe(false);
  });

  it("rejects a fractional quantity of a discrete unit", () => {
    expect(purchaseEnquirySchema.safeParse({ ...base, qty: 1.5 }).success).toBe(false);
  });

  it("caps the quantity so a typo cannot generate an absurd invoice", () => {
    expect(
      purchaseEnquirySchema.safeParse({ ...base, qty: 10_000_000 }).success
    ).toBe(false);
  });

  it("requires a usable delivery address", () => {
    expect(
      purchaseEnquirySchema.safeParse({ ...base, deliveryAddress: "x" }).success
    ).toBe(false);
  });

  it("rejects an unparseable required date", () => {
    expect(
      purchaseEnquirySchema.safeParse({ ...base, requiredDate: "next tuesday" })
        .success
    ).toBe(false);
  });
});

describe("topUpRequestSchema", () => {
  const base = {
    amount: 5_000,
    paymentMethod: "TELEBIRR",
    referenceCode: "TB2401993",
  };

  it("accepts a well-formed deposit", () => {
    expect(topUpRequestSchema.safeParse(base).success).toBe(true);
  });

  it("enforces the minimum deposit", () => {
    expect(topUpRequestSchema.safeParse({ ...base, amount: 10 }).success).toBe(false);
  });

  it("rejects a negative deposit, which would drain the wallet", () => {
    expect(topUpRequestSchema.safeParse({ ...base, amount: -5_000 }).success).toBe(
      false
    );
  });

  it("rejects sub-cent precision", () => {
    expect(topUpRequestSchema.safeParse({ ...base, amount: 100.001 }).success).toBe(
      false
    );
  });

  it("requires a bank or Telebirr reference to reconcile against", () => {
    expect(topUpRequestSchema.safeParse({ ...base, referenceCode: "" }).success).toBe(
      false
    );
  });

  it("rejects an unknown payment method", () => {
    expect(
      topUpRequestSchema.safeParse({ ...base, paymentMethod: "BITCOIN" }).success
    ).toBe(false);
  });
});

describe("initiateConversationSchema", () => {
  it("accepts a listing-scoped start", () => {
    expect(
      initiateConversationSchema.safeParse({ listingId: "listing-1" }).success
    ).toBe(true);
  });

  it("accepts an enquiry-scoped start", () => {
    expect(
      initiateConversationSchema.safeParse({ enquiryId: "enquiry-1" }).success
    ).toBe(true);
  });

  it("rejects a request with neither listing nor enquiry — no way to invent a room", () => {
    expect(initiateConversationSchema.safeParse({}).success).toBe(false);
  });

  it("has no forceDirect / bypass field a FREE supplier could set", () => {
    const result = initiateConversationSchema.safeParse({
      listingId: "listing-1",
      forceDirect: true,
      skipAgent: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("forceDirect");
      expect(result.data).not.toHaveProperty("skipAgent");
    }
  });
});
