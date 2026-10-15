"use client";

// =============================================================================
// ECON — Seller Stats Summary Cards
// =============================================================================
// Quick KPI metric counters showing total active listings, order inquiries,
// and buyer messages.
// =============================================================================

import { Package, ShoppingCart, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface SellerStatsCardsProps {
  listingsCount: number;
  ordersCount: number;
  enquiriesCount: number;
}

export function SellerStatsCards({
  listingsCount,
  ordersCount,
  enquiriesCount,
}: SellerStatsCardsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Package className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("seller_stat_listings", "Active listings")}
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none mt-0.5">{listingsCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <ShoppingCart className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("seller_stat_orders", "Purchase orders")}
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none mt-0.5">{ordersCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <MessageCircle className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("seller_stat_enquiries", "Buyer enquiries")}
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none mt-0.5">{enquiriesCount}</p>
        </div>
      </div>
    </div>
  );
}
