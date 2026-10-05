// =============================================================================
// ConMart — Proforma PDF Download API Route
// =============================================================================
// GET /api/proforma/[code]/pdf
//
// Authenticates the caller, fetches the order, renders it with
// @react-pdf/renderer, and streams the resulting PDF to the client.
//
// Security:
//   - Caller must be authenticated (session cookie required).
//   - Caller must be the buyer of the order OR an admin.
//   - Rate-limited: 20 downloads / user / hour.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { getSessionUser } from "@/lib/auth/session";
import { getOrderByReference } from "@/app/actions/orders";
import { ProformaDocument } from "@/lib/pdf/proforma-document";
import { rateLimit, getClientIdentifier } from "@/lib/security/rate-limit";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  // -------------------------------------------------------------------------
  // 1. Authenticate
  // -------------------------------------------------------------------------
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  // -------------------------------------------------------------------------
  // 2. Rate limit — 20 PDF downloads / user / hour
  // -------------------------------------------------------------------------
  const clientId = await getClientIdentifier();
  const [byUser, byIp] = await Promise.all([
    rateLimit(`pdf:user:${user.id}`, { limit: 20, windowSeconds: 3600 }),
    rateLimit(`pdf:ip:${clientId}`, { limit: 40, windowSeconds: 3600 }),
  ]);

  if (!byUser.allowed || !byIp.allowed) {
    const retryAfter = Math.max(
      byUser.retryAfterSeconds,
      byIp.retryAfterSeconds
    );
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minutes.` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  // -------------------------------------------------------------------------
  // 3. Fetch order (getOrderByReference already enforces auth + ownership)
  // -------------------------------------------------------------------------
  const { code } = await context.params;
  const order = await getOrderByReference(code);

  if (!order) {
    return NextResponse.json(
      { error: "Proforma not found or access denied." },
      { status: 404 }
    );
  }

  // -------------------------------------------------------------------------
  // 4. Verify ownership (buyer, seller, or admin) — defence in depth
  // -------------------------------------------------------------------------
  const isOwner = order.buyer.id === user.id;
  const isSeller =
    order.seller.id === user.id ||
    (order.items && order.items.some((item) => item.seller?.id === user.id));
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isSeller && !isAdmin) {
    return NextResponse.json(
      { error: "Access denied." },
      { status: 403 }
    );
  }

  // -------------------------------------------------------------------------
  // 5. Render PDF buffer
  // -------------------------------------------------------------------------
  const adminPhone =
    process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docElement = createElement(ProformaDocument, { order, adminPhone }) as any;
    const buffer = await renderToBuffer(docElement);

    const filename = `ConMart-Proforma-${order.referenceCode}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        // Don't cache — order status can change
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[PDF generation error]", error);
    return NextResponse.json(
      { error: "Failed to generate PDF. Please try again." },
      { status: 500 }
    );
  }
}
