import Link from "next/link";
import {
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
import { CategoryGlanceView } from "./category-glance-view";

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
    <div className="space-y-6 sm:space-y-8">
      {/* ============================================================
          HERO BANNER — COMPACT & ACTION-FIRST
      ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs">
        <div className="pointer-events-none absolute inset-0 cm-glow opacity-60" />
        <div className="relative max-w-2xl space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              Depot-direct wholesale · Addis Ababa
            </p>
            {isAnonymous && (
              <Link
                href="/landing"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How ConMart works
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>

          <PageHeader
            className="border-0 pb-0"
            title={
              isAnonymous
                ? "What do you want to buy?"
                : `Welcome back, ${buyerName} — What do you want to buy?`
            }
            description={
              isAnonymous
                ? "Find construction materials near you — free. Search suppliers, see their location, and get help from our team if you need it."
                : `${companyName} — search verified depots, see direct contact details, or request a free agent visit.`
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
                placeholder="Search Dangote, Zuquala rebar, river sand, HCB, pipes…"
                className="h-10 sm:h-11 rounded-xl bg-background pl-10 text-sm"
              />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants({ size: "default" }),
                "h-10 sm:h-11 rounded-xl font-semibold px-5"
              )}
            >
              Search
              <ArrowRight className="size-4" />
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Quick:
            </span>
            <QuickChip href="/buyer/category/cement">1. Cement</QuickChip>
            <QuickChip href="/buyer/category/steel">2. Rebar</QuickChip>
            <QuickChip href="/buyer/category/aggregates">3. Sand</QuickChip>
            <QuickChip href="/buyer/category/ready-mix-concrete">4. Concrete</QuickChip>
            <QuickChip href="/buyer/category/blocks">12. HCB</QuickChip>
            <QuickChip href="/buyer/stores">
              <Store className="size-3 mr-0.5" />
              All Stores
            </QuickChip>
          </div>
        </div>
      </div>

      {/* ============================================================
          20 CATEGORIES — VISIBLE & SEEN AT ONE GLANCE (MOBILE & PC)
      ============================================================ */}
      <section>
        <CategoryGlanceView categories={categories} totalOffers={totalOffers} />
      </section>

      {/* ============================================================
          RECENT ENQUIRIES (authenticated only)
      ============================================================ */}
      {!isAnonymous && recentEnquiries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight">
              <SendHorizontal className="size-4 text-primary" />
              Recent enquiries
            </h2>
            <Link
              href="/buyer/enquiries"
              className="text-xs sm:text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {recentEnquiries.map((enq) => (
              <Link
                key={enq.id}
                href="/buyer/enquiries"
                className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {enq.referenceCode}
                  </span>
                  <StatusBadge domain="enquiry" status={enq.status} size="sm" />
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-semibold">
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
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <h2 className="text-center text-base sm:text-lg font-bold">
          How introductions work
        </h2>
        <p className="mx-auto mt-1 max-w-lg text-center text-xs sm:text-sm text-muted-foreground">
          You never pay to browse listings. The supplier pays to unlock your purchase request.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Guarantee
            icon={Building2}
            title="Verified depots"
            body="Trade licenses and mill certificates verified before any listing is published."
          />
          <Guarantee
            icon={Coins}
            title="Prepaid unlock"
            body="The supplier pays the introduction fee from their wallet to unlock your proforma."
          />
          <Guarantee
            icon={ShieldCheck}
            title="80% credit if deal fails"
            body="If a deal does not close, 80% of the fee returns to the supplier's wallet as credit."
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
      className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
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
    <div className="rounded-xl border border-border/70 bg-background/50 p-3.5">
      <span className="mb-2 flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="size-3.5" />
      </span>
      <h3 className="text-xs sm:text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
