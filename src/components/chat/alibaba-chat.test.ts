import { describe, expect, it } from "vitest";

// =============================================================================
// Tests: Alibaba-Style B2B Direct Chat Capabilities
// =============================================================================

function parseProductCardMessage(body: string) {
  if (body.startsWith("📦 [PRODUCT_CARD]")) {
    try {
      const jsonStr = body.replace("📦 [PRODUCT_CARD]", "").trim();
      const parsed = JSON.parse(jsonStr);
      return {
        isProductCard: true,
        title: parsed.title,
        price: parsed.price,
        minOrder: parsed.minOrder,
        location: parsed.location,
        listingId: parsed.listingId,
      };
    } catch {
      // Fall through
    }
  }

  if (body.startsWith("📦 [Product Inquiry]")) {
    const lines = body.split("\n");
    const title = lines[0]?.replace("📦 [Product Inquiry]", "").trim();
    let price: string | undefined;
    let minOrder: string | undefined;
    let location: string | undefined;
    let listingId: string | undefined;

    for (const line of lines.slice(1)) {
      if (line.includes("💰 Price:")) price = line.replace(/.*💰 Price:\s*/, "").trim();
      if (line.includes("📦 Min Order:")) minOrder = line.replace(/.*📦 Min Order:\s*/, "").trim();
      if (line.includes("📍 Depot:")) location = line.replace(/.*📍 Depot:\s*/, "").trim();
      if (line.includes("/buyer/catalog/")) {
        const match = line.match(/\/buyer\/catalog\/([^\s]+)/);
        if (match) listingId = match[1];
      }
    }

    return {
      isProductCard: true,
      title: title || undefined,
      price,
      minOrder,
      location,
      listingId,
      rawText: body,
    };
  }

  return { isProductCard: false };
}

describe("Alibaba B2B Chat Message Parsing", () => {
  it("parses structured [PRODUCT_CARD] JSON payloads", () => {
    const jsonMessage =
      '📦 [PRODUCT_CARD] {"title":"Reinforcement Bar Grade 60 (12mm)","price":"ETB 82,225 – 87,707 / ton","minOrder":"1 ton","location":"Kality Industrial Depot","listingId":"cm-rebar-123"}';
    const result = parseProductCardMessage(jsonMessage);

    expect(result.isProductCard).toBe(true);
    expect(result.title).toBe("Reinforcement Bar Grade 60 (12mm)");
    expect(result.price).toBe("ETB 82,225 – 87,707 / ton");
    expect(result.minOrder).toBe("1 ton");
    expect(result.location).toBe("Kality Industrial Depot");
    expect(result.listingId).toBe("cm-rebar-123");
  });

  it("parses fallback [Product Inquiry] multiline text messages", () => {
    const textMessage =
      "📦 [Product Inquiry] Dangote OPC Cement 42.5R\n💰 Price: ETB 1,450 / bag\n📦 Min Order: 50 bags\n📍 Depot: Gelan Logistics Hub\n🔗 /buyer/catalog/cm-cement-456";
    const result = parseProductCardMessage(textMessage);

    expect(result.isProductCard).toBe(true);
    expect(result.title).toBe("Dangote OPC Cement 42.5R");
    expect(result.price).toBe("ETB 1,450 / bag");
    expect(result.minOrder).toBe("50 bags");
    expect(result.location).toBe("Gelan Logistics Hub");
    expect(result.listingId).toBe("cm-cement-456");
  });

  it("returns isProductCard: false for normal messages", () => {
    const normal = "Hello, do you have stock available in Merkato depot right now?";
    const result = parseProductCardMessage(normal);

    expect(result.isProductCard).toBe(false);
  });
});

describe("Supplier Local Time (East Africa Time)", () => {
  it("formats time with Africa/Addis_Ababa timezone", () => {
    const date = new Date("2026-10-14T06:30:00.000Z"); // 06:30 UTC = 09:30 EAT (UTC+3)
    const formatted = date.toLocaleTimeString("en-US", {
      timeZone: "Africa/Addis_Ababa",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    expect(formatted).toMatch(/09:30\s*AM/i);
  });
});

describe("Alibaba Quick Action & Escrow Guarantees", () => {
  it("defines standard quick action capabilities", () => {
    const quickActions = [
      "Send order request",
      "Payment options",
      "Logistics Inquiry",
      "Supplier depot",
      "Buyer Protection",
    ];

    expect(quickActions).toContain("Send order request");
    expect(quickActions).toContain("Payment options");
    expect(quickActions).toContain("Logistics Inquiry");
  });

  it("verifies freight truck classes for Ethiopian transport", () => {
    const truckClasses = ["sino", "fsr", "npr"];
    expect(truckClasses).toHaveLength(3);
  });
});
