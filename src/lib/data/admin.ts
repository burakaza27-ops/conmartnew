// =============================================================================
// ConMart — Admin Data Fetchers (Server-Side)
// =============================================================================
// Data fetching for the Admin Command Center.
// =============================================================================

import "server-only";

import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

/** Line item details for admin inspection */
export interface AdminOrderItem {
  id: string;
  productTitle: string;
  productUnit: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  sellerName: string;
  sellerCompany: string;
  sellerPhone: string;
  location: string;
}

/** Order row for the admin command center table */
export interface AdminOrderRow {
  id: string;
  referenceCode: string;
  qty: number;
  grandTotal: number;
  platformFee: number;
  status: OrderStatus;
  createdAt: Date;
  buyerName: string;
  buyerCompany: string;
  buyerPhone: string;
  sellerCompany: string;
  productTitle: string;
  productUnit: string;
  location: string;
  items: AdminOrderItem[];
}

/** Dashboard summary stats */
export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalEnquiries: number;
  unlockedEnquiries: number;
  unlockRevenue: number;
  openDisputes: number;
  pendingTopUps: number;
  activeCategories: number;
}

/**
 * Fetches all orders for the admin command center.
 * Returns orders sorted by creation date (newest first).
 */
export async function fetchAllOrders(): Promise<AdminOrderRow[]> {
  const orders = await db.order.findMany({
    include: {
      buyer: {
        select: { name: true, companyName: true, phone: true },
      },
      seller: {
        select: { name: true, companyName: true, phone: true },
      },
      listing: {
        include: {
          product: {
            select: { title: true, unit: true },
          },
        },
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
          seller: {
            select: { name: true, companyName: true, phone: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => {
    const mappedItems: AdminOrderItem[] =
      order.items.length > 0
        ? order.items.map((item) => ({
            id: item.id,
            productTitle: item.listing.product.title,
            productUnit: item.listing.product.unit,
            qty: item.qty,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            sellerName: item.seller.name,
            sellerCompany: item.seller.companyName,
            sellerPhone: item.seller.phone,
            location: item.listing.location,
          }))
        : order.listing && order.seller
        ? [
            {
              id: order.id,
              productTitle: order.listing.product.title,
              productUnit: order.listing.product.unit,
              qty: order.qty ?? 0,
              unitPrice: order.qty ? Number(order.baseSubtotal) / order.qty : 0,
              subtotal: Number(order.baseSubtotal),
              sellerName: order.seller.name,
              sellerCompany: order.seller.companyName,
              sellerPhone: order.seller.phone,
              location: order.listing.location,
            },
          ]
        : [];

    return {
      id: order.id,
      referenceCode: order.referenceCode,
      qty: order.qty ?? mappedItems.reduce((acc, i) => acc + i.qty, 0),
      grandTotal: Number(order.grandTotal),
      platformFee: Number(order.platformFee),
      status: order.status as OrderStatus,
      createdAt: order.createdAt,
      buyerName: order.buyer.name,
      buyerCompany: order.buyer.companyName,
      buyerPhone: order.buyer.phone,
      sellerCompany:
        mappedItems.length === 1
          ? mappedItems[0].sellerCompany
          : `${mappedItems.length} Suppliers (${Array.from(new Set(mappedItems.map((i) => i.sellerCompany))).join(", ")})`,
      productTitle:
        mappedItems.length === 1
          ? mappedItems[0].productTitle
          : `${mappedItems.length} Materials: ${mappedItems.map((i) => i.productTitle).join(", ")}`,
      productUnit: mappedItems.length === 1 ? mappedItems[0].productUnit : "Items",
      location:
        Array.from(new Set(mappedItems.map((i) => i.location))).join(", ") ||
        (order.listing?.location ?? "Addis Ababa"),
      items: mappedItems,
    };
  });
}

/**
 * Fetches dashboard summary statistics.
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    revenueResult,
    totalEnquiries,
    unlockedEnquiries,
    unlockRevenueResult,
    openDisputes,
    pendingTopUps,
    activeCategories,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({
      where: {
        status: { notIn: ["DELIVERED"] },
      },
    }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.order.aggregate({
      _sum: { platformFee: true },
    }),
    db.enquiry.count(),
    db.unlockRecord.count(),
    db.unlockRecord.aggregate({
      _sum: { feeAmount: true },
    }),
    db.disputeCase.count({ where: { status: "OPEN" } }),
    db.topUpRequest.count({ where: { status: "PENDING" } }),
    db.category.count({ where: { isActive: true } }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalRevenue: Number(revenueResult._sum.platformFee ?? 0),
    totalEnquiries,
    unlockedEnquiries,
    unlockRevenue: Number(unlockRevenueResult._sum.feeAmount ?? 0),
    openDisputes,
    pendingTopUps,
    activeCategories,
  };
}

/**
 * Distinct proforma/order count per listing.
 *
 * Cart checkouts write line items (`OrderItem`) and only stamp `Order.listingId`
 * on the first material. Single-item proformas write the header and no items.
 * Counting either relation alone leaves the supplier dashboard stuck at zero.
 */
async function countOrdersByListing(
  listingIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, Set<string>>();
  for (const id of listingIds) {
    counts.set(id, new Set());
  }
  if (listingIds.length === 0) {
    return new Map();
  }

  const [headerOrders, lineItems] = await Promise.all([
    db.order.findMany({
      where: { listingId: { in: listingIds } },
      select: { id: true, listingId: true },
    }),
    db.orderItem.findMany({
      where: { listingId: { in: listingIds } },
      select: { orderId: true, listingId: true },
    }),
  ]);

  for (const order of headerOrders) {
    if (order.listingId) {
      counts.get(order.listingId)?.add(order.id);
    }
  }
  for (const item of lineItems) {
    counts.get(item.listingId)?.add(item.orderId);
  }

  return new Map(
    [...counts.entries()].map(([listingId, orderIds]) => [listingId, orderIds.size])
  );
}

/**
 * Fetches seller listings with product, tier, order, and enquiry info.
 */
export async function fetchSellerListings(sellerAuthId: string) {
  const dbUser = await db.user.findUnique({
    where: { authId: sellerAuthId },
    select: { id: true },
  });

  if (!dbUser) return [];

  const listings = await db.listing.findMany({
    where: { sellerId: dbUser.id },
    include: {
      product: {
        include: {
          category: { select: { name: true } },
        },
      },
      priceTiers: {
        orderBy: { minQty: "asc" },
      },
      _count: { select: { enquiries: true } },
    },
    orderBy: { id: "desc" },
  });

  const now = new Date();
  const orderCounts = await countOrdersByListing(listings.map((listing) => listing.id));

  return listings.map((listing) => ({
    id: listing.id,
    active: listing.active,
    location: listing.location,
    imageUrl: listing.imageUrl || listing.product.imageUrl || null,
    productTitle: listing.product.title,
    productUnit: listing.product.unit,
    categoryName: listing.product.category.name,
    orderCount: orderCounts.get(listing.id) ?? 0,
    enquiryCount: listing._count.enquiries,
    priceTiers: listing.priceTiers.map((t) => ({
      id: t.id,
      minQty: t.minQty,
      maxQty: t.maxQty,
      unitPrice: Number(t.unitPrice),
      validUntil: t.validUntil.toISOString(),
      isExpired: t.validUntil < now,
    })),
  }));
}
