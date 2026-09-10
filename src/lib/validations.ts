// =============================================================================
// ConMart — Zod Validation Schemas
// =============================================================================
// Centralized validation schemas used across forms and server actions.
// Localized for Ethiopian market (phone format, currency, etc.)
// =============================================================================

import { z } from "zod";

// =============================================================================
// SHARED FIELD SCHEMAS
// =============================================================================

/**
 * Roles a visitor may choose for themselves at sign-up.
 *
 * ADMIN is deliberately excluded — a public form that mints admin accounts is
 * the same as no access control. FIELD_AGENT is allowed because local agents
 * self-register against a specific zone; operations can deactivate them later.
 */
export const SELF_REGISTERABLE_ROLES = ["BUYER", "SELLER", "FIELD_AGENT"] as const;
export type SelfRegisterableRole = (typeof SELF_REGISTERABLE_ROLES)[number];

/** Ethiopian mobile number in international format, e.g. +251 91 234 5678. */
export const ethiopianPhoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^\+251\s?\d{2}\s?\d{3}\s?\d{4}$/,
    "Enter a valid Ethiopian phone number (e.g., +251 91 234 5678)"
  );

/**
 * Canonical Ethiopian mobile form: `+251 91 234 5678`.
 * Signup and settings both store this so unlocks, agent lookups, and uniqueness
 * checks compare the same string rather than spacing variants of one number.
 */
export function normalizeEthiopianPhone(phone: string): string {
  const digits = phone.replace(/\s+/g, "");
  const match = digits.match(/^\+251(\d{9})$/);
  if (!match) {
    return phone.trim();
  }
  const local = match[1];
  return `+251 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}

/** Lookup variants so a number stored without spaces still matches. */
export function ethiopianPhoneLookupVariants(phone: string): string[] {
  const canonical = normalizeEthiopianPhone(phone);
  const compact = canonical.replace(/\s+/g, "");
  return Array.from(new Set([canonical, compact, phone.trim()].filter(Boolean)));
}

/** Password rules shared by registration, settings, and reset. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const personNameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters");

export const companyNameSchema = z
  .string()
  .min(2, "Company name must be at least 2 characters")
  .max(200, "Company name must be less than 200 characters");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

/** Positive whole-number quantity of a material unit. */
export const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .positive("Quantity must be greater than zero")
  .max(1_000_000, "Quantity exceeds the maximum supported order size");

/** Monetary amount in ETB, capped to two decimal places. */
export const etbAmountSchema = z
  .number()
  .positive("Amount must be greater than zero")
  .max(10_000_000, "Amount exceeds the maximum supported transaction size")
  .multipleOf(0.01, "Amount can have at most 2 decimal places");

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

/** Login form validation */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

/** Registration form validation */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  name: personNameSchema,
  phone: ethiopianPhoneSchema,
  companyName: companyNameSchema,
  role: z.enum(SELF_REGISTERABLE_ROLES, {
    error: "Please select your account type",
  }),
  zoneId: z.string().optional(),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => data.role !== "FIELD_AGENT" || Boolean(data.zoneId?.trim()),
    {
      message: "Select the location zone you will cover as a local agent",
      path: ["zoneId"],
    }
  );
export type RegisterFormData = z.infer<typeof registerSchema>;

/** Signed-in user editing name, phone, and company. Email is not editable. */
export const updateProfileSchema = z.object({
  name: personNameSchema,
  phone: ethiopianPhoneSchema,
  companyName: companyNameSchema,
});
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

/** Signed-in user changing password from Account Settings. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/** Forgot-password form: email only. */
export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});
export type RequestPasswordResetFormData = z.infer<typeof requestPasswordResetSchema>;

/** Set a new password after clicking the email recovery link. */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// =============================================================================
// PRICE TIER SCHEMAS
// =============================================================================

/** Price tier form validation (Seller dashboard) */
export const priceTierSchema = z.object({
  minQty: z
    .number()
    .int("Minimum quantity must be a whole number")
    .positive("Minimum quantity must be positive"),
  maxQty: z
    .number()
    .int("Maximum quantity must be a whole number")
    .positive("Maximum quantity must be positive"),
  unitPrice: z
    .number()
    .positive("Unit price must be positive")
    .multipleOf(0.01, "Unit price can have at most 2 decimal places"),
  validUntil: z
    .string()
    .min(1, "Expiry date is required")
    .refine(
      (dateStr) => new Date(dateStr) > new Date(),
      "Expiry date must be in the future"
    ),
}).refine((data) => data.maxQty >= data.minQty, {
  message: "Maximum quantity must be greater than or equal to minimum quantity",
  path: ["maxQty"],
});
export type PriceTierFormData = z.infer<typeof priceTierSchema>;

// =============================================================================
// PROFORMA / ORDER SCHEMAS
// =============================================================================

/** Proforma generation request validation */
export const generateProformaSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  qty: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be positive"),
});
export type GenerateProformaData = z.infer<typeof generateProformaSchema>;

/** Order status update validation (Admin only) */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  newStatus: z.enum([
    "GENERATED",
    "CALL_RECEIVED",
    "PROCURED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ]),
});
export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>;

// =============================================================================
// ENQUIRY SCHEMAS
// =============================================================================

/** Buyer purchase request submitted against a seller listing. */
export const purchaseEnquirySchema = z.object({
  listingId: z.string().min(1, "Listing is required"),
  qty: quantitySchema,
  deliveryPreference: z
    .enum(["SELLER_DELIVERED", "SELF_COLLECT", "PLATFORM_ARRANGED"])
    .default("SELLER_DELIVERED"),
  deliveryAddress: z
    .string()
    .min(5, "Please provide a delivery or collection address")
    .max(500, "Address must be less than 500 characters"),
  accessConstraints: z
    .string()
    .max(1000, "Access notes must be less than 1000 characters")
    .optional(),
  requiredDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date")
    .optional(),
  // Field-agent assisted capture, ignored for every other role.
  onBehalfOfBuyerPhone: ethiopianPhoneSchema.optional(),
  onBehalfOfBuyerName: z
    .string()
    .min(2, "Contractor name must be at least 2 characters")
    .max(100, "Contractor name must be less than 100 characters")
    .optional(),
});
export type PurchaseEnquiryData = z.infer<typeof purchaseEnquirySchema>;
/** Caller-facing shape: fields with defaults are optional. */
export type PurchaseEnquiryInput = z.input<typeof purchaseEnquirySchema>;

// =============================================================================
// WALLET SCHEMAS
// =============================================================================

/** Seller-submitted deposit awaiting administrative settlement. */
export const topUpRequestSchema = z.object({
  amount: etbAmountSchema.min(50, "Minimum deposit is ETB 50.00"),
  paymentMethod: z.enum(["TELEBIRR", "CBE_BANK", "AWASH_BANK", "CASH_DEPOSIT"]),
  referenceCode: z
    .string()
    .trim()
    .min(4, "Enter the bank or Telebirr transaction reference")
    .max(64, "Reference must be less than 64 characters"),
  slipUrl: z.string().url("Deposit slip must be a valid URL").optional(),
});
export type TopUpRequestData = z.infer<typeof topUpRequestSchema>;

// =============================================================================
// DISPUTE SCHEMAS
// =============================================================================

/** Counterparty claim raised against an unlocked introduction. */
export const raiseDisputeSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry is required"),
  claimType: z.enum([
    "SHORTAGE",
    "DAMAGE",
    "WRONG_SPECIFICATION",
    "NON_DELIVERY",
    "NON_PAYMENT",
  ]),
  description: z
    .string()
    .trim()
    .min(20, "Describe the issue in at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
  evidenceUrls: z
    .array(z.string().url("Evidence must be a valid URL"))
    .max(10, "At most 10 evidence files can be attached")
    .default([]),
});
export type RaiseDisputeData = z.infer<typeof raiseDisputeSchema>;
export type RaiseDisputeInput = z.input<typeof raiseDisputeSchema>;

/** Administrative resolution of a dispute case. */
export const resolveDisputeSchema = z.object({
  disputeId: z.string().min(1, "Dispute is required"),
  status: z.enum(["RESOLVED_SELLER_CREDIT", "RESOLVED_NO_REFUND", "CLOSED"]),
  resolutionNotes: z
    .string()
    .trim()
    .min(10, "Resolution notes must be at least 10 characters")
    .max(2000, "Resolution notes must be less than 2000 characters"),
  grantRefund: z.boolean(),
});
export type ResolveDisputeData = z.infer<typeof resolveDisputeSchema>;
export type ResolveDisputeInput = z.input<typeof resolveDisputeSchema>;

/** Seller's report of how an unlocked deal concluded. */
export const dealOutcomeSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry is required"),
  outcome: z.enum(["SUCCESS", "FAILURE"]),
  reason: z
    .string()
    .trim()
    .max(1000, "Reason must be less than 1000 characters")
    .optional(),
});
export type DealOutcomeData = z.infer<typeof dealOutcomeSchema>;
export type DealOutcomeInput = z.input<typeof dealOutcomeSchema>;

// =============================================================================
// MARKETPLACE / AGENT ROUTING SCHEMAS
// =============================================================================

export const initiateConversationSchema = z.object({
  listingId: z.string().min(1, "Listing is required").optional(),
  enquiryId: z.string().min(1, "Enquiry is required").optional(),
  briefing: z
    .string()
    .trim()
    .max(2000, "Briefing must be less than 2000 characters")
    .optional(),
}).refine((data) => Boolean(data.listingId || data.enquiryId), {
  message: "A listing or an enquiry is required to start a conversation.",
});
export type InitiateConversationInput = z.infer<typeof initiateConversationSchema>;

export const sendChatMessageSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be less than 2000 characters"),
});
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

export const claimDealTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket is required"),
});
export type ClaimDealTicketInput = z.infer<typeof claimDealTicketSchema>;

export const transitionDealTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket is required"),
  to: z.enum(["IN_INSPECTION", "CANCELLED"]),
});
export type TransitionDealTicketInput = z.infer<typeof transitionDealTicketSchema>;

export const completeDealTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket is required"),
  orderTotal: etbAmountSchema,
});
export type CompleteDealTicketInput = z.infer<typeof completeDealTicketSchema>;

export const setSellerSubscriptionSchema = z.object({
  sellerProfileId: z.string().min(1, "Seller profile is required"),
  status: z.enum(["FREE", "ACTIVE"]),
  expiresAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid expiry date")
    .optional(),
});
export type SetSellerSubscriptionInput = z.infer<typeof setSellerSubscriptionSchema>;
