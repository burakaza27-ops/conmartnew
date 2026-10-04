import { describe, expect, it } from "vitest";

import {
  coarsenLocation,
  filterLeakedContactText,
  getMaskedSellerLabel,
  maskListingForPublic,
  sanitizeEnquiryForViewer,
} from "@/lib/security/masking";

const BUYER_ID = "user-buyer-1";
const SELLER_ID = "user-seller-1";
const OUTSIDER_ID = "user-outsider-1";

function buildEnquiry(overrides: { unlocked?: boolean } = {}) {
  return {
    id: "enq-1",
    buyerId: BUYER_ID,
    sellerId: SELLER_ID,
    buyer: {
      name: "Abebe Bekele",
      phone: "+251 91 234 5678",
      companyName: "Bekele Construction PLC",
    },
    seller: {
      name: "Tigist Haile",
      phone: "+251 92 876 5432",
      companyName: "Haile Cement Depot PLC",
    },
    listing: { location: "Addis Ababa, Kaliti Steel Depot" },
    unlockRecord: overrides.unlocked ? { id: "unlock-1" } : null,
  };
}

describe("filterLeakedContactText", () => {
  it.each([
    ["+251 91 234 5678", "international, spaced"],
    ["+251912345678", "international, unseparated"],
    ["0912345678", "local, unseparated"],
    ["0912 345 678", "local, 4-3-3 grouping"],
    ["09 12 345 678", "local, 2-2-3-3 grouping"],
    ["251-91-234-5678", "hyphenated"],
    ["251.91.234.5678", "dotted"],
    ["0712345678", "07 prefix"],
  ])("masks %s (%s)", (phone) => {
    const masked = filterLeakedContactText(`Call me on ${phone} today`);
    expect(masked).toContain("[Contact Number Masked]");
    // No fragment of the number may survive for the reader to reassemble.
    expect(masked).not.toMatch(/\d/);
  });

  it("masks email addresses", () => {
    expect(filterLeakedContactText("Reach me at abebe@example.com")).toBe(
      "Reach me at [Email Masked]"
    );
  });

  it("masks telegram handles", () => {
    expect(filterLeakedContactText("Ping @abebecement")).toBe("Ping [Handle Masked]");
  });

  it("masks t.me links", () => {
    expect(filterLeakedContactText("t.me/abebedepot")).toBe("[Handle Masked]");
  });

  it("masks whatsapp deep links", () => {
    expect(filterLeakedContactText("https://wa.me/251912345678")).toBe("[Link Masked]");
  });

  it("leaves a genuine site address untouched", () => {
    const address = "Behind Total Station, Bole Road, near the blue gate";
    expect(filterLeakedContactText(address)).toBe(address);
  });

  it("returns an empty string for null or undefined", () => {
    expect(filterLeakedContactText(null)).toBe("");
    expect(filterLeakedContactText(undefined)).toBe("");
  });
});

describe("coarsenLocation", () => {
  it("reduces a depot address to its city", () => {
    expect(coarsenLocation("Addis Ababa, Kaliti Steel Depot")).toBe("Addis Ababa");
  });

  it("recognizes a city that is not the leading segment", () => {
    expect(coarsenLocation("Industrial Zone, Bahir Dar")).toBe("Bahir Dar");
  });

  it("handles a city with no comma", () => {
    expect(coarsenLocation("Adama (Nazret) Logistics Hub")).toBe("Adama");
  });

  it("keeps the leading segment of an unrecognized locality", () => {
    expect(coarsenLocation("Ziway, Rift Valley Yard")).toBe("Ziway");
  });

  it("falls back when given nothing", () => {
    expect(coarsenLocation(null)).toBe("Addis Ababa");
    expect(coarsenLocation("")).toBe("Addis Ababa");
  });

  it("never returns the yard-level detail", () => {
    expect(coarsenLocation("Addis Ababa, Merkato Yard")).not.toContain("Merkato");
  });
});

describe("maskListingForPublic", () => {
  it("replaces the supplier identity with a stable pseudonym", () => {
    const masked = maskListingForPublic({
      seller: {
        id: SELLER_ID,
        name: "Tigist Haile",
        phone: "+251 92 876 5432",
        companyName: "Haile Cement Depot PLC",
      },
      location: "Addis Ababa, Kaliti Steel Depot",
    });

    expect(masked.seller?.companyName).toBe(getMaskedSellerLabel(SELLER_ID));
    expect(masked.seller?.name).not.toBe("Tigist Haile");
  });

  it("omits the phone key entirely rather than nulling it", () => {
    const masked = maskListingForPublic({
      seller: { id: SELLER_ID, phone: "+251 92 876 5432" },
    });

    expect(JSON.stringify(masked)).not.toContain("876");
  });

  it("generalizes the depot address", () => {
    const masked = maskListingForPublic({
      seller: { id: SELLER_ID },
      location: "Addis Ababa, Kaliti Steel Depot",
    });

    expect(masked.location).toBe("Addis Ababa");
  });

  it("does not mutate its argument", () => {
    const original = {
      seller: { id: SELLER_ID, name: "Tigist Haile" },
      location: "Addis Ababa, Kaliti Steel Depot",
    };
    maskListingForPublic(original);

    expect(original.seller.name).toBe("Tigist Haile");
  });
});

describe("sanitizeEnquiryForViewer", () => {
  it("hides the supplier from a buyer before the fee is paid", () => {
    const result = sanitizeEnquiryForViewer({
      enquiry: buildEnquiry(),
      viewerUserId: BUYER_ID,
      viewerRole: "BUYER",
    });

    expect(result.isUnlocked).toBe(false);
    expect(result.seller.phone).toBeUndefined();
    expect(result.seller.companyName).not.toContain("Haile");
    expect(result.seller.location).toBe("Addis Ababa");
  });

  it("still shows a buyer their own details", () => {
    const result = sanitizeEnquiryForViewer({
      enquiry: buildEnquiry(),
      viewerUserId: BUYER_ID,
      viewerRole: "BUYER",
    });

    expect(result.buyer.phone).toBe("+251 91 234 5678");
  });

  it("hides the buyer from a supplier who has not paid", () => {
    const result = sanitizeEnquiryForViewer({
      enquiry: buildEnquiry(),
      viewerUserId: SELLER_ID,
      viewerRole: "SELLER",
    });

    expect(result.buyer.phone).toBeUndefined();
    expect(result.buyer.name).not.toBe("Abebe Bekele");
  });

  it("reveals both parties once the introduction is unlocked", () => {
    const result = sanitizeEnquiryForViewer({
      enquiry: buildEnquiry({ unlocked: true }),
      viewerUserId: SELLER_ID,
      viewerRole: "SELLER",
    });

    expect(result.isUnlocked).toBe(true);
    expect(result.buyer.phone).toBe("+251 91 234 5678");
    expect(result.seller.phone).toBe("+251 92 876 5432");
    expect(result.seller.location).toBe("Addis Ababa, Kaliti Steel Depot");
  });

  it("gives an unrelated signed-in user nothing, even after unlock", () => {
    const result = sanitizeEnquiryForViewer({
      enquiry: buildEnquiry({ unlocked: true }),
      viewerUserId: OUTSIDER_ID,
      viewerRole: "BUYER",
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("234");
    expect(serialized).not.toContain("876");
    expect(serialized).not.toContain("Abebe");
    expect(serialized).not.toContain("Haile");
  });

  it("lets an administrator see both parties in order to mediate", () => {
    const result = sanitizeEnquiryForViewer({
      enquiry: buildEnquiry(),
      viewerUserId: "user-admin-1",
      viewerRole: "ADMIN",
    });

    expect(result.buyer.phone).toBe("+251 91 234 5678");
    expect(result.seller.phone).toBe("+251 92 876 5432");
  });

  it("reports an admin view of an unpaid enquiry as still locked", () => {
    const result = sanitizeEnquiryForViewer({
      enquiry: buildEnquiry(),
      viewerUserId: "user-admin-1",
      viewerRole: "ADMIN",
    });

    expect(result.isUnlocked).toBe(false);
  });

  it("handles enquiry with missing listing gracefully", () => {
    const enq = buildEnquiry({ unlocked: true });
    enq.listing = null as never;
    const result = sanitizeEnquiryForViewer({
      enquiry: enq,
      viewerUserId: SELLER_ID,
      viewerRole: "SELLER",
    });
    expect(result.seller.location).toBe("Addis Ababa");
  });

  it("handles maskListingForPublic edge cases", () => {
    expect(maskListingForPublic(null as never)).toBeNull();
    const noSellerListing = { id: "list-1", location: "Bole" };
    expect(maskListingForPublic(noSellerListing)).toEqual(noSellerListing);
  });

  it("coarsenLocation falls back to default if segment exceeds 40 characters", () => {
    const longLoc = "A".repeat(45) + ", Secondary Detail";
    expect(coarsenLocation(longLoc)).toBe("Addis Ababa");
  });
});
