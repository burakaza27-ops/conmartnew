// =============================================================================
// ConMart — Printable Proforma Invoice Client View
// =============================================================================
// Renders the official printable proforma invoice in English or Amharic
// based on buyer's active language preference.
// =============================================================================

"use client";

import Link from "next/link";
import { ArrowLeft, Phone, MapPin, Calendar, Send, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getLocalizedUnit,
  getLocalizedStatus,
  getLocalizedLocation,
} from "@/lib/i18n/translations";
import { PrintButton } from "./print-button";
import { CancelOrderButton } from "@/app/buyer/orders/cancel-order-button";

interface ProformaOrderData {
  id: string;
  referenceCode: string;
  createdAt: string | Date;
  status: string;
  buyer: {
    name: string;
    phone: string;
    companyName: string | null;
  };
  seller?: {
    companyName: string | null;
  } | null;
  items: {
    id: string;
    productTitle: string;
    location: string;
    qty: number;
    productUnit: string;
    unitPrice: number;
    subtotal: number;
  }[];
  baseSubtotal: number;
  platformFee: number;
  tax: number;
  grandTotal: number;
}

interface ProformaViewProps {
  order: ProformaOrderData;
  adminPhone: string;
}

export function ProformaView({ order, adminPhone }: ProformaViewProps) {
  const { t, locale } = useLanguage();
  const createdDate = new Date(order.createdAt);

  const formattedDate = createdDate.toLocaleDateString(
    locale === "am" ? "am-ET" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const localizedStatus = getLocalizedStatus(order.status, locale);

  const telegramMessage = encodeURIComponent(
    locale === "am"
      ? `ሰላም የኮንማርት ኦፕሬሽን፣ የፕሮፎርማ ማጣቀሻ #${order.referenceCode} ለ ${order.buyer.companyName || order.buyer.name} (${order.buyer.phone}) አዘጋጅቻለሁ። ጠቅላላ፡ ${formatETB(order.grandTotal, locale)}። እባክዎ ዕቃው መኖሩን ያረጋግጡ።`
      : `Hello ConMart Operations, I generated Proforma #${order.referenceCode} for ${order.buyer.companyName || order.buyer.name} (${order.buyer.phone}). Total: ${formatETB(order.grandTotal)}. Please verify stock availability.`
  );
  const telegramLink = `https://t.me/conmart_ops?text=${telegramMessage}`;

  return (
    <div className="min-h-screen bg-background py-6">
      {/* Screen-only Action Toolbar */}
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 print:hidden">
        <Link
          href="/buyer/orders"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav_back_to_orders")}
        </Link>
        <div className="flex items-center gap-2">
          {order.status === "GENERATED" && (
            <CancelOrderButton
              orderId={order.id}
              referenceCode={order.referenceCode}
            />
          )}
          {order.status !== "CANCELLED" && (
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 text-xs text-primary hover:bg-primary/10"
              )}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("proforma_btn_telegram")}</span>
            </a>
          )}
          {/* PDF Download — hits streaming API route, triggers native save dialog */}
          <a
            href={`/api/proforma/${order.referenceCode}/pdf`}
            download={`ConMart-Proforma-${order.referenceCode}.pdf`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1.5 text-xs"
            )}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </a>
          <PrintButton />
        </div>
      </div>

      {order.status === "CANCELLED" && (
        <div className="mx-auto max-w-3xl mb-4 px-6 print:hidden">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium text-center">
            {t("proforma_cancelled_notice")}
          </div>
        </div>
      )}

      {/* Printable Invoice Container */}
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card px-8 py-10 shadow-sm print:border-none print:shadow-none print:rounded-none print:max-w-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("proforma_title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("proforma_company_sub")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold text-primary">
              #{order.referenceCode}
            </p>
            <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </p>
            <Badge
              variant={
                order.status === "DELIVERED"
                  ? "default"
                  : order.status === "CANCELLED"
                  ? "destructive"
                  : "secondary"
              }
              className="mt-2 text-xs"
            >
              {localizedStatus}
            </Badge>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Buyer & Seller Info */}
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("proforma_buyer")}
            </h3>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {order.buyer.companyName || t("proforma_commercial_buyer")}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.buyer.name}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {order.buyer.phone}
              </p>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("proforma_depot")}
            </h3>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {order.seller?.companyName || t("proforma_verified_depot")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("proforma_coordinator")}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 text-amber-500" />
                {getLocalizedLocation(order.items[0]?.location || "Addis Ababa", locale)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Line Items Table */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("proforma_details")} ({order.items.length}{" "}
            {locale === "am"
              ? "ዕቃዎች"
              : order.items.length === 1
              ? "Item"
              : "Items"}
            )
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-muted-foreground">
                    {t("proforma_material")}
                  </th>
                  <th className="pb-2 text-muted-foreground">
                    {t("proforma_location")}
                  </th>
                  <th className="pb-2 text-right font-semibold text-muted-foreground">
                    {t("proforma_qty")}
                  </th>
                  <th className="pb-2 text-right font-semibold text-muted-foreground">
                    {t("proforma_unit_price")}
                  </th>
                  <th className="pb-2 text-right font-semibold text-muted-foreground">
                    {t("proforma_subtotal")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {order.items.map((item) => {
                  const unitLabel = getLocalizedUnit(item.productUnit, locale);
                  const itemLocation = getLocalizedLocation(item.location, locale);

                  return (
                    <tr key={item.id}>
                      <td className="py-3 font-medium text-foreground">
                        {item.productTitle}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {itemLocation}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {item.qty.toLocaleString()} {unitLabel}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatETB(item.unitPrice, locale)}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatETB(item.subtotal, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("proforma_subtotal_base")}</span>
            <span>{formatETB(order.baseSubtotal, locale)}</span>
          </div>
          {order.platformFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t("proforma_platform_fee")}</span>
              <span>{formatETB(order.platformFee, locale)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>{t("proforma_vat")}</span>
            <span>{formatETB(order.tax, locale)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>{t("proforma_grand_total")}</span>
            <span className="text-primary font-extrabold">{formatETB(order.grandTotal, locale)}</span>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Footer / Notes */}
        <div className="space-y-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{t("proforma_notes_title")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("proforma_note_validity")}</li>
            <li>
              {t("proforma_note_confirm")}{" "}
              <a
                href={`tel:${adminPhone.replace(/\s+/g, "")}`}
                className="font-medium text-foreground underline"
              >
                {adminPhone}
              </a>{" "}
              {locale === "am" ? "ማጣቀሻ ቁጥር" : "and quote reference"}{" "}
              <span className="font-mono font-medium text-foreground">
                #{order.referenceCode}
              </span>
              .
            </li>
            <li>{t("proforma_note_payment")}</li>
            <li>{t("proforma_note_tax")}</li>
          </ul>
        </div>

        {/* Platform Footer */}
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground print:mt-12">
          <p className="font-medium">ConMart Ethiopia</p>
          <p>
            {t("proforma_company_sub")} · {adminPhone}
          </p>
        </div>
      </div>
    </div>
  );
}
