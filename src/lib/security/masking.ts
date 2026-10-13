// =============================================================================
// ConMart — Pre-Unlock Contact Masking
// =============================================================================
// The platform's only paid asset is the introduction between a buyer and a
// verified supplier. Anything that would let the two parties reach each other
// without an UnlockRecord — a phone number, an email address, a messaging
// handle, a legal business name, or a street-level depot address — has to be
// removed from the payload, not merely hidden in the UI.
//
// Masking happens on the server, before serialization. Hiding a field with CSS
// or a conditional render still ships it in the RSC payload.
// =============================================================================

/**
 * Ethiopian mobile numbers.
 *
 * A subscriber number is nine digits beginning with 9 or 7, optionally behind
 * a +251, 251, or 0 prefix. Separators are allowed between any two digits
 * rather than at fixed positions, because people write the same number as
 * "+251 91 234 5678", "0912 345 678", "09 12 345 678", and "251-91-234-5678".
 * Anchoring to one grouping let the other three straight through.
 */
const PHONE_PATTERN = /(?:\+?251[\s.-]*|0)?[79](?:[\s.-]*\d){8}/g;

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

/** Telegram links and @handles, the common workaround for a masked number. */
const SOCIAL_HANDLE_PATTERN = /(?:t\.me\/|@)[a-zA-Z0-9_]{4,}/gi;

/** Direct links to messaging apps, including wa.me and telegram.me. */
const MESSAGING_LINK_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com|telegram\.me|m\.me|imo\.im)\/\S*/gi;

/**
 * Cities and towns ConMart operates in. A location is generalized to whichever
 * of these it mentions, so buyers can still filter by region before paying.
 */
const KNOWN_LOCALITIES = [
  "Addis Ababa",
  "Adama",
  "Nazret",
  "Bahir Dar",
  "Hawassa",
  "Awassa",
  "Dire Dawa",
  "Sululta",
  "Mekelle",
  "Gelan",
  "Sebeta",
  "Bishoftu",
  "Debre Zeyit",
  "Jimma",
  "Gondar",
  "Dessie",
  "Shashemene",
] as const;

const FALLBACK_LOCALITY = "Addis Ababa";

/**
 * Removes contact details from free text supplied by a user, such as a
 * delivery address or a listing description.
 */
export function filterLeakedContactText(text?: string | null): string {
  if (!text) return "";

  return text
    .replace(MESSAGING_LINK_PATTERN, "[Link Masked]")
    .replace(EMAIL_PATTERN, "[Email Masked]")
    .replace(PHONE_PATTERN, "[Contact Number Masked]")
    .replace(SOCIAL_HANDLE_PATTERN, "[Handle Masked]");
}

/**
 * Reduces a depot address to its city or town.
 *
 * "Addis Ababa, Kaliti Steel Depot" becomes "Addis Ababa" — enough to judge
 * delivery distance, not enough to drive to the yard and bypass the platform.
 */
export function coarsenLocation(location?: string | null): string {
  if (!location) return FALLBACK_LOCALITY;

  const match = KNOWN_LOCALITIES.find((locality) =>
    location.toLowerCase().includes(locality.toLowerCase())
  );

  if (match) return match;

  // Unrecognized locality: keep only the leading segment, which by convention
  // is the city, and drop the yard or landmark that follows it.
  const [leadingSegment] = location.split(",");
  const trimmed = leadingSegment?.trim();

  return trimmed && trimmed.length <= 40 ? trimmed : FALLBACK_LOCALITY;
}

/** Stable pseudonym for a supplier, derived from their ID. */
export function getMaskedSellerLabel(sellerId: string): string {
  const shortId = sellerId.slice(-4).toUpperCase();
  return `Econ Verified Supplier Depot (#DEPOT-${shortId})`;
}

export interface MaskedSeller {
  id: string;
  name: string;
  companyName: string;
  phone?: undefined;
}

/**
 * Strips supplier identity from a catalog listing shown to anonymous visitors
 * and to buyers who have not been introduced.
 */
export function maskListingForPublic<
  T extends {
    seller?: { id?: string; name?: string; phone?: string; companyName?: string | null } | null;
    location?: string;
  }
>(listing: T): T {
  if (!listing) return listing;

  const sanitized: T = { ...listing };

  if (sanitized.seller) {
    const sellerId = sanitized.seller.id || "GEN";
    sanitized.seller = {
      id: sellerId,
      name: "Verified Depot Coordinator",
      companyName: getMaskedSellerLabel(sellerId),
      // Omitted rather than nulled so the key never reaches the client payload.
    } satisfies MaskedSeller;
  }

  if (sanitized.location) {
    sanitized.location = coarsenLocation(sanitized.location);
  }

  return sanitized;
}

export interface SanitizedEnquiryContact {
  /** True once the supplier has paid the introduction fee for this enquiry. */
  isUnlocked: boolean;
  buyer: {
    name: string;
    companyName?: string | null;
    phone?: string;
  };
  seller: {
    name: string;
    companyName?: string | null;
    phone?: string;
    location: string;
  };
}

export interface SanitizeEnquiryInput {
  enquiry: {
    id: string;
    buyerId: string;
    sellerId: string;
    buyer: { name: string; phone: string; companyName?: string | null };
    seller: { name: string; phone: string; companyName?: string | null };
    listing?: { location?: string } | null;
    unlockRecord?: { id: string } | null;
  };
  viewerUserId: string;
  viewerRole: string;
}

/**
 * Produces the view of an enquiry's counterparties that a specific viewer is
 * entitled to.
 *
 * Administrators see both sides unmasked because they mediate disputes, which
 * requires contacting each party directly.
 */
export function sanitizeEnquiryForViewer({
  enquiry,
  viewerUserId,
  viewerRole,
}: SanitizeEnquiryInput): SanitizedEnquiryContact {
  const isAdmin = viewerRole === "ADMIN";
  const isBuyer = viewerUserId === enquiry.buyerId;
  const isSeller = viewerUserId === enquiry.sellerId;
  const maskedLocation = coarsenLocation(enquiry.listing?.location);

  if (!isAdmin && !isBuyer && !isSeller) {
    return {
      isUnlocked: false,
      buyer: {
        name: "Prospective Commercial Contractor",
        companyName: null,
      },
      seller: {
        name: "Verified Depot Coordinator",
        companyName: getMaskedSellerLabel(enquiry.sellerId),
        location: maskedLocation,
      },
    };
  }

  const isUnlocked = Boolean(enquiry.unlockRecord);

  if (isUnlocked || isAdmin) {
    return {
      isUnlocked,
      buyer: {
        name: enquiry.buyer.name,
        companyName: enquiry.buyer.companyName,
        phone: enquiry.buyer.phone,
      },
      seller: {
        name: enquiry.seller.name,
        companyName: enquiry.seller.companyName,
        phone: enquiry.seller.phone,
        location: enquiry.listing?.location || FALLBACK_LOCALITY,
      },
    };
  }

  // Before the introduction is paid for, each party sees only their own
  // details. The supplier's exact yard address is withheld from the buyer.
  return {
    isUnlocked: false,
    buyer: {
      name: isBuyer ? enquiry.buyer.name : "Prospective Commercial Contractor",
      companyName: isBuyer ? enquiry.buyer.companyName : null,
      phone: isBuyer ? enquiry.buyer.phone : undefined,
    },
    seller: {
      name: "Verified Depot Coordinator",
      companyName: getMaskedSellerLabel(enquiry.sellerId),
      location: maskedLocation,
    },
  };
}
