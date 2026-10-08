import { describe, it, expect } from "vitest";
import { registerSchema, SELF_REGISTERABLE_ROLES } from "@/lib/validations";

describe("Public self-registration role constraints", () => {
  const baseValidData = {
    email: "test@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    name: "Abebe Kebede",
    phone: "+251911234567",
    companyName: "Kebede Construction PLC",
  };

  it("exposes only BUYER and SELLER as self-registerable roles", () => {
    expect(SELF_REGISTERABLE_ROLES).toEqual(["BUYER", "SELLER"]);
    expect(SELF_REGISTERABLE_ROLES).not.toContain("ADMIN");
    expect(SELF_REGISTERABLE_ROLES).not.toContain("FIELD_AGENT");
  });

  it("allows registration as BUYER", () => {
    const result = registerSchema.safeParse({
      ...baseValidData,
      role: "BUYER",
    });
    expect(result.success).toBe(true);
  });

  it("allows registration as SELLER", () => {
    const result = registerSchema.safeParse({
      ...baseValidData,
      role: "SELLER",
    });
    expect(result.success).toBe(true);
  });

  it("strictly rejects attempts to register as FIELD_AGENT", () => {
    const result = registerSchema.safeParse({
      ...baseValidData,
      role: "FIELD_AGENT",
    });
    expect(result.success).toBe(false);
  });

  it("strictly rejects attempts to register as ADMIN", () => {
    const result = registerSchema.safeParse({
      ...baseValidData,
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });
});
