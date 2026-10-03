// =============================================================================
// ConMart — Admin Orders Table (Client Component)
// =============================================================================
// Interactive table with status advancement buttons for each order.
// =============================================================================

"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Phone,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
  ExternalLink,
  Package,
  Search,
  X,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
  formatETB,
} from "@/lib/types";
import { updateOrderStatusAction } from "@/app/actions/orders";
import type { AdminOrderRow } from "@/lib/data/admin";
import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedStatus, getLocalizedUnit, getLocalizedLocation } from "@/lib/i18n/translations";

/** Maps order status to badge variant */
const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  GENERATED: "outline",
  CALL_RECEIVED: "secondary",
  PROCURED: "secondary",
  IN_TRANSIT: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

interface OrdersTableProps {
  orders: AdminOrderRow[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    for (const s of ORDER_STATUSES) {
      counts[s] = orders.filter((o) => o.status === s).length;
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedStatus !== "ALL" && order.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = order.referenceCode.toLowerCase().includes(q);
        const matchBuyer = order.buyerName.toLowerCase().includes(q);
        const matchCompany = order.buyerCompany.toLowerCase().includes(q);
        const matchPhone = order.buyerPhone.toLowerCase().includes(q);
        const matchMaterial = order.productTitle.toLowerCase().includes(q);
        const matchItems = order.items.some(
          (item) =>
            item.productTitle.toLowerCase().includes(q) ||
            item.sellerCompany.toLowerCase().includes(q) ||
            item.sellerPhone.toLowerCase().includes(q)
        );
        return (
          matchRef ||
          matchBuyer ||
          matchCompany ||
          matchPhone ||
          matchMaterial ||
          matchItems
        );
      }
      return true;
    });
  }, [orders, selectedStatus, searchQuery]);

  function toggleExpand(orderId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }

  function handleAdvanceStatus(orderId: string, nextStatus: OrderStatus) {
    setPendingOrderId(orderId);

    startTransition(async () => {
      const result = await updateOrderStatusAction({
        orderId,
        newStatus: nextStatus,
      });

      if (!result.success) {
        alert(result.error);
      }

      setPendingOrderId(null);
      router.refresh();
    });
  }

  function handleExportCSV() {
    const headers = [
      "Order Reference",
      "Date (EAT)",
      "Status",
      "Buyer Company",
      "Buyer Contact",
      "Buyer Phone",
      "Materials Summary",
      "Supplier Depot",
      "Subtotal (ETB)",
      "Platform Fee (ETB)",
      "VAT (ETB)",
      "Grand Total (ETB)",
    ];

    const rows = filteredOrders.map((order) => {
      const materialsSummary =
        order.items && order.items.length > 0
          ? order.items
              .map((i) => `${i.productTitle} (${i.qty} ${i.productUnit})`)
              .join("; ")
          : `${order.productTitle} (${order.qty} ${order.productUnit})`;

      const depotSummary =
        order.items && order.items.length > 0
          ? Array.from(
              new Set(
                order.items.map((i) => `${i.sellerCompany} [${i.location}]`)
              )
            ).join("; ")
          : `${order.sellerCompany} [${order.location}]`;

      return [
        order.referenceCode,
        new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19),
        ORDER_STATUS_LABELS[order.status] ?? order.status,
        order.buyerCompany || "Commercial Buyer",
        order.buyerName,
        order.buyerPhone,
        materialsSummary,
        depotSummary,
        order.baseSubtotal.toFixed(2),
        order.platformFee.toFixed(2),
        order.tax.toFixed(2),
        order.grandTotal.toFixed(2),
      ];
    });

    const escapeField = (val: unknown) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent =
      "\uFEFF" +
      [
        headers.map(escapeField).join(","),
        ...rows.map((row) => row.map(escapeField).join(",")),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `conmart-financial-orders-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (orders.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {locale === "am"
            ? "እስካሁን ምንም ትዕዛዝ የለም። ገዢዎች ፕሮፎርማ ሲያወጡ እዚህ ይታያሉ።"
            : "No orders yet. Orders will appear here when buyers generate proformas."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-xs">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">
              {t("admin_title")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("admin_subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
              {filteredOrders.length} / {orders.length}{" "}
              {locale === "am" ? "ትዕዛዞች" : "orders"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
              title="Download CSV for Excel / Accounting"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>{t("admin_btn_export")}</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("admin_search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Pills / Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatus("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5",
              selectedStatus === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{t("admin_all_statuses")}</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                selectedStatus === "ALL"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {statusCounts.ALL || 0}
            </span>
          </button>

          {ORDER_STATUSES.map((status) => {
            const count = statusCounts[status] || 0;
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{getLocalizedStatus(status, locale)}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px]",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground border-t border-border/40">
            <p className="font-medium text-foreground">
              {locale === "am"
                ? "የተፈለገውን መስፈርት የሚያሟላ ትዕዛዝ አልተገኘም።"
                : "No orders match your search criteria."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "am"
                ? "በሌላ ማጣቀሻ ቁጥር ይፈልጉ ወይም ማጣሪያዎችን ያጽዱ።"
                : "Try searching a different reference or clearing your filters."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
              }}
              className="mt-4 text-xs font-semibold h-8"
            >
              {t("filter_reset")}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>{t("orders_col_ref")}</TableHead>
                  <TableHead>{t("proforma_buyer")}</TableHead>
                  <TableHead>{t("admin_col_materials_vendors")}</TableHead>
                  <TableHead>{t("orders_col_total")}</TableHead>
                  <TableHead>{t("admin_col_fee")}</TableHead>
                  <TableHead>{t("orders_col_status")}</TableHead>
                  <TableHead>{t("orders_col_date")}</TableHead>
                  <TableHead className="text-right">{t("admin_col_action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                const nextStatus = ORDER_STATUS_TRANSITIONS[order.status];
                const isThisPending = isPending && pendingOrderId === order.id;
                const isExpanded = expandedIds.has(order.id);

                return (
                  <React.Fragment key={order.id}>
                    <TableRow className={isExpanded ? "bg-muted/20" : ""}>
                      <TableCell className="p-2">
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title={isExpanded ? "Collapse items" : "Expand vendor line items"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>#{order.referenceCode}</span>
                          <Link
                            href={`/buyer/proforma/${order.referenceCode}`}
                            target="_blank"
                            className="text-muted-foreground hover:text-primary"
                            title="View Official Proforma"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {order.buyerCompany}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.buyerName}
                          </p>
                          <a
                            href={`tel:${order.buyerPhone}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {order.buyerPhone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">
                            {order.productTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.sellerCompany}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-bold text-foreground">
                        {formatETB(order.grandTotal, locale)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600">
                        {formatETB(order.platformFee, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANT[order.status]}
                          className="text-xs"
                        >
                          {getLocalizedStatus(order.status, locale)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(
                          locale === "am" ? "am-ET" : "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {nextStatus ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isThisPending}
                            onClick={() =>
                              handleAdvanceStatus(order.id, nextStatus)
                            }
                            className="text-xs font-medium"
                          >
                            {isThisPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <ArrowRight className="mr-1 h-3 w-3" />
                                {getLocalizedStatus(nextStatus, locale)}
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("admin_complete_badge")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Vendor Breakdown Row */}
                    {isExpanded && (
                      <TableRow className="bg-muted/10">
                        <TableCell colSpan={9} className="p-4">
                          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-border/60 pb-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                <Package className="h-4 w-4 text-primary" />
                                {locale === "am"
                                  ? `የአቅራቢዎች ክፍፍል (${order.items.length} ዕቃዎች)`
                                  : `Supplier Fulfillment Breakdown (${order.items.length} line item${order.items.length === 1 ? "" : "s"})`}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {locale === "am" ? "የኮንማርት ገቢ (10%): " : "ConMart Cut (10%): "}
                                <strong className="text-emerald-600">{formatETB(order.platformFee, locale)}</strong>
                              </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              {order.items.map((item) => {
                                const unitLabel = getLocalizedUnit(item.productUnit, locale);
                                const locName = getLocalizedLocation(item.location, locale);

                                return (
                                  <div
                                    key={item.id}
                                    className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2 text-xs"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-bold text-foreground">
                                          {item.productTitle}
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">
                                          {locale === "am" ? "መጠን፡ " : "Qty: "}
                                          {item.qty.toLocaleString()} {unitLabel} · {formatETB(item.unitPrice, locale)}/{unitLabel}
                                        </p>
                                      </div>
                                      <span className="font-bold text-foreground">
                                        {formatETB(item.subtotal, locale)}
                                      </span>
                                    </div>

                                    <div className="rounded-md bg-card p-2 border border-border/40 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground flex items-center gap-1">
                                          <Building2 className="h-3 w-3 text-primary" />
                                          {item.sellerCompany}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {locale === "am" ? "ተወካይ፡ " : "Rep: "}
                                          {item.sellerName}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                          <MapPin className="h-3 w-3 text-amber-500" />
                                          {locName}
                                        </span>
                                        <a
                                          href={`tel:${item.sellerPhone}`}
                                          className="font-bold text-primary hover:underline flex items-center gap-1"
                                        >
                                          <Phone className="h-3 w-3" />
                                          {item.sellerPhone}
                                        </a>
                                      </div>
                                    </div>

                                    <div className="text-[10px] text-muted-foreground pt-1">
                                      {locale === "am" ? "ጠቅላላ ንዑስ ድምር፡ " : "Item Subtotal: "}
                                      {formatETB(item.subtotal, locale)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
