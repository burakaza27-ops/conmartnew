import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  Search,
  ArrowRight,
  ShieldCheck,
  Building2,
  Container,
  Columns3,
  Mountain,
  LayoutGrid,
  Home,
  Pipette,
  TreePine,
  Zap,
  Coins,
  SendHorizontal,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  fetchCategoriesWithCounts,
  fetchRecentBuyerEnquiries,
} from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Container,
  Columns3,
  Mountain,
  LayoutGrid,
  Home,
  Pipette,
  TreePine,
  Zap,
};

export default async function BuyerCategoryHubPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/buyer");
  }

  const buyerName = (user.user_metadata?.name as string) ?? "Contractor";
  const companyName =
    (user.user_metadata?.companyName as string) ?? "your company";

  const [categories, recentEnquiries] = await Promise.all([
    fetchCategoriesWithCounts(),
    fetchRecentBuyerEnquiries(user.id, 3),
  ]);

  const totalOffers = categories.reduce((sum, c) => sum + c.listingCount, 0);

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 cm-glow opacity-70" />
        <div className="relative max-w-2xl space-y-4">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            Direct introduction · Addis Ababa
          </p>
          <PageHeader
            className="border-0 pb-0"
            title={`Welcome back, ${buyerName.split(" ")[0]}`}
            description={`${companyName} — compare depot-direct wholesale offers, then send a purchase request. Contacts stay masked until the supplier unlocks.`}
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
            <QuickChip href="/buyer/category/cement?brand=Dangote">Dangote</QuickChip>
            <QuickChip href="/buyer/category/steel">Rebar Ø16</QuickChip>
            <QuickChip href="/buyer/category/aggregates">River sand</QuickChip>
          </div>
        </div>
      </div>

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
              Categories are being prepared. Refresh this page in a moment.
            </p>
          ) : (
            categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.iconName] || Package;
            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.slug}`}
                className="group flex min-h-[7.5rem] flex-col justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-elevated"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <IconComponent className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {cat.listingCount} {cat.listingCount === 1 ? "depot" : "depots"}
                  </p>
                </div>
              </Link>
            );
          })
          )}
        </div>
      </section>

      {recentEnquiries.length > 0 && (
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

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-center text-lg font-semibold">How introductions work</h2>
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

function QuickChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
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
