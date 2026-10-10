// =============================================================================
// ConMart — Zod Validation Schemas
// =============================================================================
// Centralized validation schemas used across forms and server actions.
// Localized for Ethiopian market (phone format, currency, etc.)
// =============================================================================

import { z } from "zod";
import { ProductUnit } from "@prisma/client";

// =============================================================================
// SHARED FIELD SCHEMAS
// =============================================================================

/**
 * Roles a visitor may choose for themselves at sign-up.
 *
 * ADMIN and FIELD_AGENT are excluded — a public form that mints privileged
 * accounts is the same as no access control. Promote those roles with
 * `scripts/grant-role.ts`.
 */
export const SELF_REGISTERABLE_ROLES = ["BUYER", "SELLER", "COMMISSION_AGENT"] as const;
export type SelfRegisterableRole = (typeof SELF_REGISTERABLE_ROLES)[number];

/**
 * Normalizes any Ethiopian mobile input (e.g. 0911234567, 911234567, 0711234567, +251911234567)
 * into canonical international format: `+251 91 234 5678`.
 * Users never have to type "+" or "+251".
 */
export function normalizeEthiopianPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+251")) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith("251")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Matches 9-digit Ethiopian mobile number (Telebirr 09... or Safaricom 07...)
  if (/^[97]\d{8}$/.test(cleaned)) {
    return `+251 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }

  return phone.trim();
}

/** Ethiopian mobile number schema that automatically normalizes local formats */
export const ethiopianPhoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((val) => normalizeEthiopianPhone(val))
  .refine(
    (val) => /^\+251\s?[97]\d\s?\d{3}\s?\d{4}$/.test(val),
    "Enter a valid Ethiopian phone number (e.g. 0911 234 567 or +251 91 234 5678)"
  );

/** Lookup variants so a number stored with or without spaces/prefixes still matches */
export function ethiopianPhoneLookupVariants(phone: string): string[] {
  const canonical = normalizeEthiopianPhone(phone);
  const compact = canonical.replace(/\s+/g, "");
  const local = compact.replace(/^\+251/, "0");
  return Array.from(new Set([canonical, compact, local, phone.trim()].filter(Boolean)));
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
    .min(8, "Password must be at least 8 characters"),
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
  referralCode: z.string().max(20, "Invalid referral code").optional(),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
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

/**
 * Wallet/dashboard tier with an absolute expiry date.
 * Used by admin screens that edit existing tiers.
 */
export const walletPriceTierSchema = z.object({
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
export type WalletPriceTierFormData = z.infer<typeof walletPriceTierSchema>;

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
// LISTING SCHEMAS
// =============================================================================

/** Listing creation tier using a relative validity window (days from now). */
export const priceTierSchema = z
  .object({
    minQty: z.number().int().positive("Minimum quantity must be greater than 0"),
    maxQty: z.number().int().positive("Maximum quantity must be greater than 0"),
    unitPrice: z.number().positive("Unit price must be greater than 0"),
    /** Default 180 is supplied by react-hook-form defaultValues, not Zod, to keep types strict. */
    validDays: z.number().int().positive(),
  })
  .refine((tier) => tier.maxQty >= tier.minQty, {
    message: "Max quantity must be greater than or equal to min quantity",
    path: ["maxQty"],
  });
export type PriceTierFormData = z.infer<typeof priceTierSchema>;

export const createListingSchema = z.object({
  categoryId: z.string().min(1, "Please select a product category"),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  unit: z.nativeEnum(ProductUnit),
  location: z
    .string()
    .trim()
    .min(2, "Please enter your warehouse or yard location")
    .max(150),
  imageUrl: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  brand: z.string().trim().max(80).optional(),
  grade: z.string().trim().max(80).optional(),
  standard: z.string().trim().max(80).optional(),
  origin: z.string().trim().max(80).optional(),
  existingProductId: z.string().optional(),
  priceTiers: z
    .array(priceTierSchema)
    .min(1, "Please configure at least one volume pricing tier"),
});
export type CreateListingFormData = z.infer<typeof createListingSchema>;


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

// =============================================================================
// SUBSCRIPTION DIRECTORY & GUIDED LEADS SCHEMAS
// =============================================================================

export const submitSubscriptionPaymentSchema = z.object({
  tier: z.enum(["BASIC", "PREMIUM", "FEATURED"]),
  paymentMethod: z.enum(["TELEBIRR", "CBE_BANK", "AWASH_BANK", "CASH_DEPOSIT"]),
  referenceCode: z.string().trim().min(3, "Transaction reference code is required").max(100),
  slipUrl: z.string().trim().optional(),
});
export type SubmitSubscriptionPaymentInput = z.infer<typeof submitSubscriptionPaymentSchema>;


export const createGuidedLeadSchema = z.object({
  materialNeeded: z.string().trim().min(2, "Material needed is required").max(200),
  quantity: z.string().trim().min(1, "Quantity / scale is required").max(100),
  areaLocation: z.string().trim().min(2, "Area or project location is required").max(200),
  buyerPhone: ethiopianPhoneSchema,
  buyerName: z.string().trim().max(100).optional(),
  preferredVisitTime: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  targetSellerId: z.string().trim().optional(),
});
export type CreateGuidedLeadInput = z.infer<typeof createGuidedLeadSchema>;

export const updateGuidedLeadStatusSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  status: z.enum(["NEW", "ASSIGNED", "GUIDING", "DELIVERED", "CLOSED"]),
  closeReason: z.string().trim().max(500).optional(),
});
export type UpdateGuidedLeadStatusInput = z.infer<typeof updateGuidedLeadStatusSchema>;

// =============================================================================
// 01B — ONLINE AGENT APPLICATION & VETTING SCHEMAS
// =============================================================================

export const submitAgentApplicationSchema = z.object({
  // Personal Details & Education (Screen 2)
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  phone: ethiopianPhoneSchema,
  city: z.string().trim().min(2, "City is required").default("Addis Ababa"),
  subCity: z.string().trim().min(2, "Sub-city / woreda is required"),
  grade12DocUrl: z.string().trim().min(1, "Grade 12 completion document is required"),
  identityDocUrl: z.string().trim().min(1, "National identity document (ID) is required"),

  // Work Area & Availability (Screen 3)
  serviceArea: z.string().trim().min(2, "Service area is required"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  travelRadiusKm: z.number().min(1).max(50).default(5),
  availableDaysHours: z.string().trim().min(2, "Available days & hours are required").default("Mon - Fri, 9:00 - 17:00"),
  isAvailableForAssignments: z.boolean().default(true),

  // Guarantee & Consent (Screen 4)
  guarantorType: z.enum(["GOVERNMENT_EMPLOYEE", "COMMUNITY_OR_OTHER"]),
  guarantorName: z.string().trim().min(2, "Guarantor name is required"),
  guarantorPhone: ethiopianPhoneSchema,
  guarantorEmployer: z.string().trim().optional(),
  guarantorRelationship: z.string().trim().optional(),
  guarantorDocUrl: z.string().trim().optional(),
  guarantorDescription: z.string().trim().optional(),
  guarantorConsentObtained: z.boolean().refine((val) => val === true, {
    message: "You must confirm that guarantor consent has been obtained",
  }),
});
export type SubmitAgentApplicationInput = z.infer<typeof submitAgentApplicationSchema>;

export const reviewAgentApplicationSchema = z.object({
  agentProfileId: z.string().min(1, "Agent profile ID is required"),
  action: z.enum(["APPROVE", "REQUEST_CORRECTION", "REJECT", "SUSPEND"]),
  rejectionReason: z.string().trim().max(1000).optional(),
  checklistPhoneVerified: z.boolean().optional(),
  checklistGrade12Reviewed: z.boolean().optional(),
  checklistIdentityReviewed: z.boolean().optional(),
  checklistGuaranteeVerified: z.boolean().optional(),
  checklistAreaConfirmed: z.boolean().optional(),
});
export type ReviewAgentApplicationInput = z.infer<typeof reviewAgentApplicationSchema>;


