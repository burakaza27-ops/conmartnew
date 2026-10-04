"use client";

// =============================================================================
// ConMart — Seller Stats Summary Cards
// =============================================================================
// Quick KPI metric counters showing total active listings, order inquiries,
// and buyer messages.
// =============================================================================

import { Package, ShoppingCart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="border-border/60">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Package className="size-4" />
          </div>
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("seller_stat_listings", "Listings")}
            </p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{listingsCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="size-4" />
          </div>
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("seller_stat_orders", "Orders")}
            </p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{ordersCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <MessageCircle className="size-4" />
          </div>
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("seller_stat_enquiries", "Enquiries")}
            </p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{enquiriesCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
