"use client";

// =============================================================================
// ConMart — Seller Dashboard Client View (Bilingual English & Amharic)
// =============================================================================
// Clean orchestrator component displaying inventory, subscription tier,
// referral progress, metrics, and listing cards with responsive pricing tiers.
// =============================================================================

import Link from "next/link";
import { Package, PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

import { SellerSubscriptionCard } from "./seller-subscription-card";
import { SellerReferralCard } from "./seller-referral-card";
import { SellerStatsCards } from "./seller-stats-cards";
import { SellerListingCard } from "./seller-listing-card";
import type {
  SellerListingItem,
  ReferralData,
  SellerSubscriptionInfo,
} from "./types";

export type { SellerListingItem, ReferralData, SellerSubscriptionInfo };

export interface SellerDashboardViewProps {
  listings: SellerListingItem[];
  subscription: SellerSubscriptionInfo;
  referral: ReferralData | null;
}

export function SellerDashboardView({
  listings,
  subscription,
  referral,
}: SellerDashboardViewProps) {
  const { t } = useLanguage();

  const totalOrders = listings.reduce((sum, listing) => sum + listing.orderCount, 0);
  const totalEnquiries = listings.reduce((sum, listing) => sum + listing.enquiryCount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("seller_inventory_title", "Material Inventory")}
        description={t(
          "seller_inventory_subtitle",
          "Manage catalog products, volume price tiers, and buyer inquiries."
        )}
        actions={
          <Link
            href="/seller/listings/new"
            className={cn(buttonVariants({ size: "default" }), "font-semibold")}
          >
            <PlusCircle className="size-4" />
            {t("seller_btn_add", "List New Material")}
          </Link>
        }
      />

      {/* Subscription Tier Card */}
      <SellerSubscriptionCard subscription={subscription} />

      {/* Referral Program Card */}
      {referral && <SellerReferralCard referral={referral} />}

      {/* Metrics Summary */}
      {listings.length > 0 ? (
        <SellerStatsCards
          listingsCount={listings.length}
          ordersCount={totalOrders}
          enquiriesCount={totalEnquiries}
        />
      ) : null}

      {/* Material Listings */}
      {listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("seller_empty_title", "No materials listed yet")}
          description={t(
            "seller_empty_desc",
            "Add your construction materials with volume pricing tiers to start receiving buyer enquiries."
          )}
          action={
            <Link
              href="/seller/listings/new"
              className={cn(buttonVariants(), "font-semibold")}
            >
              <PlusCircle className="size-4" />
              {t("seller_btn_list_first", "List Your First Material")}
            </Link>
          }
          className="rounded-2xl border border-dashed border-border bg-card/40"
        />
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => (
            <SellerListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
