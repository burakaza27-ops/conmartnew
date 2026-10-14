// =============================================================================
// ECON — Buyer Orders Client View
// =============================================================================
// Fully localized orders list table supporting Amharic & English.
// =============================================================================

"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatETB, type OrderStatus } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedStatus, getLocalizedUnit } from "@/lib/i18n/translations";
import { CancelOrderButton } from "./cancel-order-button";
import type { BuyerOrderRow } from "@/lib/data/catalog";

const STATUS_BADGE_VARIANT: Record<
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

interface OrdersViewProps {
  orders: BuyerOrderRow[];
}

export function OrdersView({ orders }: OrdersViewProps) {
  const { t, locale } = useLanguage();

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("orders_page_title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("orders_page_subtitle")}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("orders_empty_title")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t("orders_empty_desc")}
          </p>
        </div>
      ) : (
        <Card className="border-border/50 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>
                {locale === "am"
                  ? `የባንክ ፕሮፎርማዎች (${orders.length})`
                  : `Bank Proforma Invoices (${orders.length})`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orders_col_ref")}</TableHead>
                  <TableHead>{t("orders_col_product")}</TableHead>
                  <TableHead>{t("orders_col_qty")}</TableHead>
                  <TableHead>{t("orders_col_total")}</TableHead>
                  <TableHead>{t("orders_col_status")}</TableHead>
                  <TableHead>{t("orders_col_date")}</TableHead>
                  <TableHead className="text-right">{t("orders_col_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const localizedStatus = getLocalizedStatus(order.status, locale);
                  const unitLabel = getLocalizedUnit(order.productUnit, locale);

                  return (
                    <TableRow
                      key={order.id}
                      className={order.status === "CANCELLED" ? "opacity-60" : ""}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        #{order.referenceCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {order.productTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.sellerCompany}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {(order.qty ?? 0).toLocaleString()} {unitLabel}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatETB(order.grandTotal, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_BADGE_VARIANT[order.status as OrderStatus] ??
                            "outline"
                          }
                          className="text-xs"
                        >
                          {localizedStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(
                          locale === "am" ? "am-ET" : "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/buyer/proforma/${order.referenceCode}`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "h-7 text-xs px-2.5"
                            )}
                          >
                            {t("orders_btn_view")}
                          </Link>
                          {order.status === "GENERATED" && (
                            <CancelOrderButton
                              orderId={order.id}
                              referenceCode={order.referenceCode}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
