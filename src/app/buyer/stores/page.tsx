// =============================================================================
// ECON — All Supplier Stores Page
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Package,
  MapPin,
  BadgeCheck,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { fetchSellerStores } from "@/lib/data/catalog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Supplier Stores | ECON",
  description:
    "Browse all verified construction material supplier stores on ECON. Each store lists their complete product range and prices.",
};

const SELLER_TYPE_LABELS: Record<string, string> = {
  FACTORY: "Factory Direct",
  IMPORTER: "Importer",
  WHOLESALER: "Wholesaler",
  RETAILER: "Retailer",
  RENTAL: "Rental",
};

const TYPE_COLORS: Record<string, string> = {
  FACTORY: "bg-blue-500/10 text-blue-600 border-blue-200",
  IMPORTER: "bg-purple-500/10 text-purple-600 border-purple-200",
  WHOLESALER: "bg-amber-500/10 text-amber-600 border-amber-200",
  RETAILER: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  RENTAL: "bg-orange-500/10 text-orange-600 border-orange-200",
};

export default async function AllStoresPage() {
  const stores = await fetchSellerStores();

  // Group by seller type for a more organized browse experience
  const verified = stores.filter((s) => s.verificationStatus === "VERIFIED");
  const others = stores.filter((s) => s.verificationStatus !== "VERIFIED");

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href="/buyer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Browse Categories
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Supplier Stores
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Browse by supplier. Each store shows the company&apos;s complete product range
          and wholesale prices. Contact details unlock after submitting a purchase enquiry.
        </p>
        <p className="text-sm">
          <span className="font-semibold text-foreground">{stores.length}</span>{" "}
          <span className="text-muted-foreground">active stores</span>
        </p>
      </div>

      {/* Verified stores section */}
      {verified.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Verified Suppliers
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {verified.length}
            </span>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {verified.map((store) => (
              <StoreCard key={store.sellerId} store={store} />
            ))}
          </div>
        </section>
      )}

      {/* Other active stores */}
      {others.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-foreground">
            Active Stores
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((store) => (
              <StoreCard key={store.sellerId} store={store} />
            ))}
          </div>
        </section>
      )}

      {stores.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
          <Store className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-base font-semibold text-muted-foreground">
            No stores active yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Verified suppliers will appear here once they activate listings.
          </p>
        </div>
      )}
    </div>
  );
}

function StoreCard({
  store,
}: {
  store: Awaited<ReturnType<typeof fetchSellerStores>>[number];
}) {
  const isVerified = store.verificationStatus === "VERIFIED";
  const isPro =
    store.subscriptionStatus === "PRO" ||
    store.subscriptionStatus === "ENTERPRISE";
  const typeColor =
    TYPE_COLORS[store.sellerType] ?? "bg-muted text-muted-foreground border-border";

  return (
    <Link
      href={`/buyer/store/${store.sellerId}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200"
    >
      {/* Store header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-lg font-black text-primary">
          {store.companyName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {store.companyName}
            </h3>
            {isVerified && (
              <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            )}
            {isPro && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0 text-[10px] font-bold text-amber-600">
                PRO
              </span>
            )}
          </div>
          <span
            className={cn(
              "mt-1 inline-flex items-center rounded-full border px-2 py-0 text-[10px] font-semibold",
              typeColor
            )}
          >
            {SELLER_TYPE_LABELS[store.sellerType] ?? store.sellerType}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5 shrink-0 text-primary/60" />
          <span>
            <span className="font-semibold text-foreground">
              {store.activeListingCount}
            </span>{" "}
            {store.activeListingCount === 1 ? "product" : "products"}
          </span>
        </div>
        {store.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{store.location}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-[11px] text-muted-foreground">
          {isVerified ? "Verified & Licensed" : "Pending Verification"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          View Store
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
