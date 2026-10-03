import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// ConMart — Marketing Landing Page (Server Component)
// =============================================================================
// Fully server-rendered for optimal SEO and LCP.
// No useLanguage() — static copy; i18n wrapper can be added per section.
// =============================================================================

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" aria-label="Hero">
          <div className="pointer-events-none absolute inset-0 cm-glow" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 cm-grid opacity-60" aria-hidden="true" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
            <div>
              <p className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <MapPin className="size-3 text-primary" aria-hidden="true" />
                {"Ethiopia\u2019s B2B construction materials platform"}
              </p>

              <h1 className="heading-display text-4xl text-foreground sm:text-5xl lg:text-6xl">
                Source materials{" "}
                <span className="text-primary">direct from verified depots</span>
              </h1>

              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg" style={{ textWrap: "pretty" } as React.CSSProperties}>
                Contractors post what they need. Verified suppliers pay a small fee to be
                introduced. Contacts stay masked until the supplier unlocks — no middleman margin.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/buyer/category/all"
                  id="hero-cta-browse"
                  className={cn(buttonVariants({ size: "lg" }), "font-semibold")}
                >
                  Browse materials — free
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/register"
                  id="hero-cta-register"
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }), "font-semibold")}
                >
                  List your depot
                </Link>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border/70 pt-6">
                <TrustStat label="Business model" value="Direct intro" />
                <TrustStat label="Deal protection" value="80% credit" />
                <TrustStat label="Coverage" value="49 zones" />
              </dl>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* ── FEATURE BAR ──────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-card/40" aria-label="Platform features">
          <div className="mx-auto grid max-w-6xl gap-px px-4 sm:grid-cols-3 sm:px-6">
            <Feature
              icon={ShoppingCart}
              title="Zero commission on materials"
              description="ConMart sells introductions, not a cut of the trade. Suppliers keep their full margin."
            />
            <Feature
              icon={Building2}
              title="Proforma invoices generated instantly"
              description="Volume-tiered pricing, VAT, and loading charges calculated and downloadable as PDF."
            />
            <Feature
              icon={ShieldCheck}
              title="Mediated for free-tier suppliers"
              description="Local field agents handle deals for suppliers not yet on the subscription tier."
            />
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="hiw-heading"
        >
          <p className="text-center text-xs font-medium tracking-wide text-primary uppercase">
            How it works
          </p>
          <h2
            id="hiw-heading"
            className="heading-display mx-auto mt-2 max-w-xl text-center text-3xl text-foreground"
          >
            From a purchase request to a verified depot — in three steps
          </h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-3" aria-label="Steps">
            <Step
              n="01"
              title="Browse or post a request"
              description="Search the catalog by category, brand, or location. Or post a purchase enquiry with quantity and delivery date."
            />
            <Step
              n="02"
              title="Supplier unlocks and responds"
              description="The supplier pays a small category-based fee from their prepaid wallet. Both parties' contact details are revealed."
            />
            <Step
              n="03"
              title="Deal, delivery, and protection"
              description="Trade directly. If the deal collapses, 80% of the unlock fee returns as non-withdrawable credit to the supplier."
            />
          </ol>
        </section>

        {/* ── FOR BUYERS ───────────────────────────────────────────────────── */}
        <section
          className="border-t border-border bg-card/30 py-16 sm:py-20"
          aria-labelledby="buyers-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  For contractors &amp; buyers
                </p>
                <h2
                  id="buyers-heading"
                  className="heading-display mt-3 text-3xl text-foreground"
                >
                  Compare wholesale prices without revealing your identity first
                </h2>
                <p className="mt-4 text-base text-muted-foreground" style={{ textWrap: "pretty" } as React.CSSProperties}>
                  Browse hundreds of listings from verified depots across Addis Ababa and
                  regional cities. Send a purchase request — your phone number stays masked
                  until the supplier decides to engage.
                </p>
                <ul className="mt-6 space-y-3" aria-label="Buyer benefits">
                  {[
                    "Free to browse and enquire — always",
                    "Proforma invoices for procurement approval",
                    "See depot city before contacting",
                    "Agent-mediated deals for smaller suppliers",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/buyer/category/all"
                  id="buyer-section-cta"
                  className={cn(buttonVariants(), "mt-8 font-semibold")}
                >
                  Browse the catalog
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* ── FOR SUPPLIERS ────────────────────────────────────────────────── */}
        <section
          className="py-16 sm:py-20"
          aria-labelledby="suppliers-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <WalletPreview />
              <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  For suppliers &amp; depots
                </p>
                <h2
                  id="suppliers-heading"
                  className="heading-display mt-3 text-3xl text-foreground"
                >
                  Pay only when you see a real buyer — not per listing
                </h2>
                <p className="mt-4 text-base text-muted-foreground" style={{ textWrap: "pretty" } as React.CSSProperties}>
                  List your materials for free. Top up a prepaid wallet. Accept enquiries
                  from verified contractors — the fee unlocks both contacts simultaneously.
                  Only pay for deals you choose to pursue.
                </p>
                <ul className="mt-6 space-y-3" aria-label="Supplier benefits">
                  {[
                    "Free listings — no subscription required to list",
                    "Category-based unlock fees (250 – 1,200 ETB)",
                    "80% credit refund if the deal falls through",
                    "Verified status visible to all buyers",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  id="supplier-section-cta"
                  className={cn(buttonVariants(), "mt-8 font-semibold")}
                >
                  Register your depot
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST STATS ──────────────────────────────────────────────────── */}
        <section
          className="border-t border-border bg-card/30 py-16 sm:py-20"
          aria-labelledby="trust-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="trust-heading"
              className="heading-display text-center text-3xl text-foreground"
            >
              Built for how Ethiopian construction actually works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground">
              Payment by Telebirr, CBE, or Awash Bank. Prices in Ethiopian Birr. Interface
              in Amharic and English. 49 coverage zones from Koye Feche to Mekelle.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <TrustCard
                icon={Users}
                stat="49"
                label="Coverage zones"
                description="From Addis neighbourhoods to regional cities including Adama, Hawassa, Bahir Dar, and Dire Dawa."
              />
              <TrustCard
                icon={TrendingUp}
                stat="ETB"
                label="Birr-native pricing"
                description="All prices, fees, and proforma invoices are denominated in Ethiopian Birr with 15% VAT."
              />
              <TrustCard
                icon={Zap}
                stat="80%"
                label="Refund on failed deals"
                description="If a deal collapses after introduction, most of the unlock fee returns as non-withdrawable credit."
              />
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden py-20 sm:py-28"
          aria-label="Sign up call to action"
        >
          <div className="pointer-events-none absolute inset-0 cm-glow opacity-80" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 cm-grid opacity-30" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              Ready to start?
            </p>
            <h2 className="heading-display mt-3 text-4xl text-foreground sm:text-5xl">
              {"Ethiopia\u2019s construction materials marketplace is open"}
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Browse for free as a buyer. List for free as a supplier. Pay only when you
              choose to connect.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                href="/buyer/category/all"
                id="footer-cta-browse"
                className={cn(buttonVariants({ size: "lg" }), "font-semibold")}
              >
                Browse materials — free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/register"
                id="footer-cta-register"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "font-semibold")}
              >
                Register as supplier
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TrustStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShoppingCart;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 bg-background/40 px-1 py-8 sm:px-6">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary"
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Step({ n, title, description }: { n: string; title: string; description: string }) {
  return (
    <li className="relative rounded-2xl border border-border bg-card p-6">
      <span className="font-mono text-xs font-semibold tracking-widest text-primary">{n}</span>
      <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </li>
  );
}

function TrustCard({
  icon: Icon,
  stat,
  label,
  description,
}: {
  icon: typeof Users;
  stat: string;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <span
        className="flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary"
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{stat}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function HeroPreview() {
  const rows = [
    { name: "Dangote OPC 42.5R — 50kg", loc: "Kaliti", price: "1,280", unit: "bag" },
    { name: "Zuquala Rebar \u00d816mm", loc: "Akaki", price: "118,400", unit: "ton" },
    { name: "Mojo River Sand", loc: "Mojo", price: "2,450", unit: "m\u00b3" },
    { name: "Holcim Hollow Blocks 20cm", loc: "Bole", price: "32", unit: "piece" },
  ];

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-foreground">Live wholesale offers</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-2xs font-medium text-success">
            <Lock className="size-3" aria-hidden="true" />
            Contact masked
          </span>
        </div>
        <ul className="space-y-2" aria-label="Sample listings">
          {rows.map((row) => (
            <li
              key={row.name}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3.5 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{row.name}</p>
                <p className="text-2xs text-muted-foreground">{row.loc}</p>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-semibold text-foreground">
                  {row.price}
                  <span className="ml-1 text-2xs font-normal text-muted-foreground">ETB</span>
                </p>
                <p className="text-2xs text-muted-foreground">/{row.unit}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-2xs text-muted-foreground">
            Prices indicative. Contact unlocks when supplier pays intro fee.
          </p>
          <Link href="/buyer" className="text-2xs font-semibold text-primary hover:underline">
            Browse all
            <ArrowRight className="ml-0.5 inline size-2.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl"
        aria-hidden="true"
      />
    </div>
  );
}

function WalletPreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Supplier Wallet — example
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-2xs text-muted-foreground">Cash balance</p>
            <p className="mt-1 text-xl font-bold tabular text-foreground">
              8,400
              <span className="ml-1 text-xs font-normal text-muted-foreground">ETB</span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-2xs text-muted-foreground">Credit balance</p>
            <p className="mt-1 text-xl font-bold tabular text-success">
              600
              <span className="ml-1 text-xs font-normal text-muted-foreground">ETB</span>
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {[
            { label: "Cement enquiry unlock", amount: "-250 ETB", type: "debit" as const },
            { label: "Telebirr top-up credited", amount: "+5,000 ETB", type: "credit" as const },
            { label: "Deal-failure refund credit", amount: "+600 ETB", type: "credit" as const },
          ].map((tx) => (
            <div
              key={tx.label}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2"
            >
              <p className="text-xs text-muted-foreground">{tx.label}</p>
              <p
                className={cn(
                  "tabular text-xs font-semibold",
                  tx.type === "credit" ? "text-success" : "text-foreground"
                )}
              >
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Star className="size-3 text-primary" aria-hidden="true" />
          <p className="text-2xs text-muted-foreground">
            Credit is spent before cash — protects your withdrawable balance.
          </p>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl"
        aria-hidden="true"
      />
    </div>
  );
}
