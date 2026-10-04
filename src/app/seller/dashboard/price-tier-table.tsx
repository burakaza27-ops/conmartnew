"use client";

// =============================================================================
// ConMart — Responsive Price Tier Component
// =============================================================================
// Displays volume-based price tiers with a dual-layout design:
// 1. Desktop: Clean, structured table with clear columns.
// 2. Mobile: Stacked card view optimized for touchscreens, preventing table
//    squishing or awkward horizontal scrolling.
// =============================================================================

import { Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import type { PriceTierItem } from "./types";

interface PriceTierTableProps {
  priceTiers: PriceTierItem[];
  unitLabel: string;
}

export function PriceTierTable({ priceTiers, unitLabel }: PriceTierTableProps) {
  const { t, locale } = useLanguage();

  if (priceTiers.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        {t("seller_no_tiers", "No pricing tiers configured")}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table Layout (sm and up) */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="text-xs font-semibold">{t("seller_col_tier", "Tier (Quantity)")}</TableHead>
              <TableHead className="text-xs font-semibold">{t("seller_col_price", "Unit Price")}</TableHead>
              <TableHead className="text-xs font-semibold">{t("seller_col_valid", "Valid Until")}</TableHead>
              <TableHead className="text-xs font-semibold">{t("seller_col_status", "Status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceTiers.map((tier) => (
              <TableRow key={tier.id} className={tier.isExpired ? "opacity-50" : ""}>
                <TableCell className="font-medium text-xs">
                  {tier.minQty.toLocaleString()} – {tier.maxQty.toLocaleString()} {unitLabel}
                </TableCell>
                <TableCell className="font-bold text-xs text-foreground">
                  {formatETB(tier.unitPrice, locale)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">
                    /{unitLabel}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground/70" />
                    {new Date(tier.validUntil).toLocaleDateString(
                      locale === "am" ? "am-ET" : "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={tier.isExpired ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {tier.isExpired
                      ? t("detail_tier_expired", "Expired")
                      : t("detail_tier_active", "Active")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout (< sm) */}
      <div className="sm:hidden divide-y divide-border/40 p-3 space-y-2.5">
        {priceTiers.map((tier) => (
          <div
            key={tier.id}
            className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 ${
              tier.isExpired ? "opacity-50" : ""
            }`}
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-foreground">
                  {tier.minQty.toLocaleString()} – {tier.maxQty.toLocaleString()} {unitLabel}
                </span>
                <Badge
                  variant={tier.isExpired ? "destructive" : "secondary"}
                  className="text-[9px] px-1.5 py-0"
                >
                  {tier.isExpired
                    ? t("detail_tier_expired", "Expired")
                    : t("detail_tier_active", "Active")}
                </Badge>
              </div>
              <p className="flex items-center gap-1 text-2xs text-muted-foreground">
                <Calendar className="h-2.5 w-2.5 text-muted-foreground/60" />
                {new Date(tier.validUntil).toLocaleDateString(
                  locale === "am" ? "am-ET" : "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold text-sm text-foreground">
                {formatETB(tier.unitPrice, locale)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                /{unitLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
