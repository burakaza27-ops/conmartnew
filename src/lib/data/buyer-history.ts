// =============================================================================
// ConMart — Buyer History & Transaction Fetchers
// =============================================================================
// Isolated bounded context for historical buyer orders and purchase enquiries.
// Keeps catalog listing and product fetchers focused and distinct from user history.
// =============================================================================

import { db } from "@/lib/db";

/**
 * Fetches a buyer's orders with listing/product details.
 */
export async function fetchBuyerOrders(buyerAuthId: string) {
  try {
    const dbUser = await db.user.findUnique({
      where: { authId: buyerAuthId },
      select: { id: true },
    });

    if (!dbUser) {
      return [];
    }

    const orders = await db.order.findMany({
      where: { buyerId: dbUser.id },
      include: {
        listing: {
          include: {
            product: {
              select: { title: true, unit: true },
            },
          },
        },
        seller: {
          select: { companyName: true },
        },
        items: {
          include: {
            listing: {
              include: {
                product: {
                  select: { title: true, unit: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => {
      const totalQty =
        order.qty ?? order.items.reduce((sum, item) => sum + item.qty, 0);
      const title =
        order.items.length > 1
          ? `${order.items.length} Materials (${order.items
              .map((i) => i.listing.product.title)
              .slice(0, 2)
              .join(", ")}${order.items.length > 2 ? "..." : ""})`
          : order.items[0]?.listing?.product?.title ??
            order.listing?.product?.title ??
            "Construction Materials";
      const unit =
        order.items.length > 1
          ? "Items"
          : order.items[0]?.listing?.product?.unit ??
            order.listing?.product?.unit ??
            "UNIT";
      const location =
        order.items[0]?.listing?.location ??
        order.listing?.location ??
        "Addis Ababa";

      return {
        id: order.id,
        referenceCode: order.referenceCode,
        qty: totalQty,
        grandTotal: Number(order.grandTotal),
        status: order.status,
        createdAt: order.createdAt,
        productTitle: title,
        productUnit: unit,
        sellerCompany: `ConMart Verified Depot (${location})`,
      };
    });
  } catch (err) {
    console.error("[buyer-history] fetchBuyerOrders failed:", err);
    return [];
  }
}

export type BuyerOrderRow = Awaited<ReturnType<typeof fetchBuyerOrders>>[number];

/**
 * Fetches recent buyer purchase enquiries for the category hub.
 */
export async function fetchRecentBuyerEnquiries(
  buyerAuthId: string,
  limit: number = 3
) {
  try {
    const dbUser = await db.user.findUnique({
      where: { authId: buyerAuthId },
      select: { id: true },
    });

    if (!dbUser) {
      return [];
    }

    const enquiries = await db.enquiry.findMany({
      where: { buyerId: dbUser.id },
      include: {
        listing: {
          include: {
            product: {
              select: {
                title: true,
                unit: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        unlockRecord: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return enquiries.map((enq) => ({
      id: enq.id,
      referenceCode: enq.referenceCode,
      qty: enq.qty,
      unit: enq.unit,
      status: enq.status,
      productTitle: enq.listing.product.title,
      categoryName: enq.listing.product.category.name,
      isUnlocked: !!enq.unlockRecord,
      createdAt: enq.createdAt,
    }));
  } catch (err) {
    console.error("[buyer-history] fetchRecentBuyerEnquiries failed:", err);
    return [];
  }
}

/**
 * Fetches top recent buyer orders for the Category Hub dashboard.
 */
export async function fetchRecentBuyerOrders(
  buyerAuthId: string,
  limit: number = 3
) {
  try {
    const dbUser = await db.user.findUnique({
      where: { authId: buyerAuthId },
      select: { id: true },
    });

    if (!dbUser) {
      return [];
    }

    const orders = await db.order.findMany({
      where: { buyerId: dbUser.id },
      include: {
        listing: {
          include: {
            product: {
              select: { title: true, unit: true },
            },
          },
        },
        seller: {
          select: { companyName: true },
        },
        items: {
          include: {
            listing: {
              include: {
                product: {
                  select: { title: true, unit: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return orders.map((order) => ({
      id: order.id,
      referenceCode: order.referenceCode,
      grandTotal: Number(order.grandTotal),
      status: order.status,
      createdAt: order.createdAt,
      productTitle:
        order.items[0]?.listing?.product?.title ??
        order.listing?.product?.title ??
        "Construction Material",
    }));
  } catch (err) {
    console.error("[buyer-history] fetchRecentBuyerOrders failed:", err);
    return [];
  }
}
