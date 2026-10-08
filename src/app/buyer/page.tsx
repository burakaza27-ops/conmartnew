import Link from "next/link";
import {
  Package,
  Search,
  ArrowRight,
  ShieldCheck,
  Building2,
  Coins,
  SendHorizontal,
  Store,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getSessionUser } from "@/lib/auth/session";
import {
  fetchCategoriesWithCounts,
  fetchRecentBuyerEnquiries,
} from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

import { getCategoryImage } from "@/lib/data/category-images";

export default async function BuyerCategoryHubPage() {
  const user = await getSessionUser();

  const buyerName = user?.name?.split(" ")[0] ?? "Contractor";
  const companyName = user?.companyName ?? "your company";

  const [categories, recentEnquiries] = await Promise.all([
    fetchCategoriesWithCounts(),
    user?.authId ? fetchRecentBuyerEnquiries(user.authId, 3) : Promise.resolve([]),
  ]);

  const isAnonymous = !user;
  const totalOffers = categories.reduce((sum, c) => sum + c.listingCount, 0);

  return (
    <div className="space-y-10">
      {/* ============================================================
          HERO BANNER
      ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 cm-glow opacity-70" />
        <div className="relative max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" />
              Direct introduction · Addis Ababa
            </p>
            {isAnonymous && (
              <Link
                href="/landing"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Learn how ConMart works
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
          <PageHeader
            className="border-0 pb-0"
            title={
              isAnonymous
                ? "Compare wholesale construction prices"
                : `Welcome back, ${buyerName}`
            }
            description={
              isAnonymous
                ? "Browse depot-direct wholesale offers from verified yards. No account needed to see prices — sign up free when you're ready to buy."
                : `${companyName} — compare depot-direct wholesale offers, then send a purchase request. Contacts stay masked until the supplier unlocks.`
            }
          />
          <form
            action="/buyer/category/all"
            method="GET"
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                placeholder="Dangote, Zuquala rebar, river sand…"
                className="h-11 rounded-xl bg-background pl-10"
              />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-xl font-semibold"
              )}
            >
              Browse
              <ArrowRight className="size-4" />
            </button>
          </form>
          <div className="flex flex-wrap gap-2 text-xs">
            <QuickChip href="/buyer/category/cement">Cement</QuickChip>
            <QuickChip href="/buyer/category/steel">Rebar Ø16</QuickChip>
            <QuickChip href="/buyer/category/aggregates">River sand</QuickChip>
            <QuickChip href="/buyer/stores">
              <Store className="size-3 mr-0.5" />
              All Stores
            </QuickChip>
          </div>
        </div>
      </div>

      {/* ============================================================
          BROWSE BY CATEGORY — IMAGE CARDS
      ============================================================ */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
            <p className="text-sm text-muted-foreground">
              {totalOffers} live depot offers from verified yards.
            </p>
          </div>
          <Link
            href="/buyer/category/all"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.length === 0 ? (
            <p className="col-span-full rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Categories are being prepared. Refresh in a moment.
            </p>
          ) : (
            categories.map((cat) => {
              const image =
                cat.imageUrl ||
                getCategoryImage(cat.slug, 600);
              return (
                <Link
                  key={cat.id}
                  href={`/buyer/category/${cat.slug}`}
                  className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border aspect-[4/3] shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200"
                >
                  {/* Background image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                  {/* Text */}
                  <div className="relative p-3">
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      {cat.listingCount}{" "}
                      {cat.listingCount === 1 ? "depot" : "depots"}
                    </p>
                  </div>
                </Link>
              );
            })
          )}

          {/* Stores tile */}
          <Link
            href="/buyer/stores"
            className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-primary/5 aspect-[4/3] shadow-xs hover:shadow-md hover:border-primary transition-all duration-200"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="h-12 w-12 text-primary/30 group-hover:text-primary/50 transition-colors" />
            </div>
            <div className="relative p-3">
              <h3 className="text-sm font-bold text-foreground leading-tight">
                All Stores
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Browse by supplier
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================================
          RECENT ENQUIRIES (authenticated only)
      ============================================================ */}
      {!isAnonymous && recentEnquiries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <SendHorizontal className="size-4 text-primary" />
              Recent enquiries
            </h2>
            <Link
              href="/buyer/enquiries"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recentEnquiries.map((enq) => (
              <Link
                key={enq.id}
                href="/buyer/enquiries"
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-semibold">
                    {enq.referenceCode}
                  </span>
                  <StatusBadge domain="enquiry" status={enq.status} size="sm" />
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium">
                  {enq.productTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {enq.qty.toLocaleString()} {enq.unit} · {enq.categoryName}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
          HOW IT WORKS
      ============================================================ */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-center text-lg font-semibold">
          How introductions work
        </h2>
        <p className="mx-auto mt-1 max-w-lg text-center text-sm text-muted-foreground">
          You never pay to see a listing. The supplier pays to see you.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Guarantee
            icon={Building2}
            title="Verified depots"
            body="Trade licenses and mill certificates before a listing is published."
          />
          <Guarantee
            icon={Coins}
            title="Prepaid unlock"
            body="The supplier pays the category fee from their wallet to open your request."
          />
          <Guarantee
            icon={ShieldCheck}
            title="80% credit if it fails"
            body="If the deal does not close, most of the fee returns as non-withdrawable credit."
          />
        </div>
      </section>
    </div>
  );
}

function QuickChip({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function Guarantee({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Building2;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/50 p-4">
      <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="size-4" />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
