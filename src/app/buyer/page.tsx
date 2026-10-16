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
import { getSessionUser } from "@/lib/auth/session";
import { fetchCategoriesWithCounts } from "@/lib/data/catalog";
import { fetchRecentBuyerEnquiries } from "@/lib/data/buyer-history";
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
          HERO BANNER — COMMANDING & ACTION-FIRST
      ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Structural grid overlay — construction-site blueprint atmosphere */}
        <div className="pointer-events-none absolute inset-0 cm-grid opacity-35" />
        <div className="pointer-events-none absolute inset-0 cm-glow opacity-55" />

        <div className="relative px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              Depot-direct wholesale · Addis Ababa
            </p>
            {isAnonymous && (
              <Link
                href="/landing"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How Econ works
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>

          <div className="max-w-2xl space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isAnonymous
                ? "What do you want to buy?"
                : `Welcome back, ${buyerName} — what do you need today?`}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isAnonymous
                ? "Find construction materials from verified depots in Addis Ababa — free. See direct contact details or request a free field agent visit."
                : `${companyName} — search verified depots, see their contact details, or request a free agent visit.`}
            </p>

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
                  placeholder="Search Dangote, Rebar, river sand, HCB, pipes…"
                  className="h-11 rounded-xl bg-background/70 pl-10 text-sm"
                />
              </div>
              <button
                type="submit"
                className={cn(
                  buttonVariants({ size: "default" }),
                  "h-11 rounded-xl font-semibold px-6 shrink-0"
                )}
              >
                Search
                <ArrowRight className="size-4" />
              </button>
            </form>

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Jump to:</span>
              <QuickChip href="/buyer/category/cement">Cement</QuickChip>
              <QuickChip href="/buyer/category/steel">Rebar</QuickChip>
              <QuickChip href="/buyer/category/aggregates">Sand</QuickChip>
              <QuickChip href="/buyer/category/ready-mix-concrete">Concrete</QuickChip>
              <QuickChip href="/buyer/category/blocks">HCB</QuickChip>
              <QuickChip href="/buyer/stores">
                <Store className="size-3 mr-0.5" />
                All Stores
              </QuickChip>
            </div>
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
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold tracking-tight">
          How introductions work
        </h2>
        <p className="mt-1 max-w-lg text-xs sm:text-sm leading-relaxed text-muted-foreground">
          You never pay to browse. If the supplier subscribes, you get their direct phone number — otherwise our agents take you to their shop at no extra cost.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Guarantee
            icon={Building2}
            title="Verified depots"
            body="Trade licenses and mill certificates verified before any listing is published."
          />
          <Guarantee
            icon={Coins}
            title="Direct supplier contact"
            body="Subscribers share their phone number with you instantly — no middleman, no markup."
          />
          <Guarantee
            icon={Store}
            title="Free agent-guided visit"
            body="If a deal is agent-led, our local agent takes you to the supplier's shop. You pay nothing extra."
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
      className="inline-flex items-center rounded-full border border-border/80 bg-background/50 px-2.5 py-0.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
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
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="size-4" />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
