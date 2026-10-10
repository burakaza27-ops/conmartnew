import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  Zap,
  PhoneCall,
  MessageCircle,
  CreditCard,
  UserCheck,
} from "lucide-react";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// ConMart — Marketing Landing Page (Subscription & Agent Model)
// =============================================================================

export default function LandingPage() {
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
                Find construction materials{" "}
                <span className="text-primary">near you — free</span>
              </h1>

              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg" style={{ textWrap: "pretty" } as React.CSSProperties}>
                Search suppliers, see their location, and get help from our team if you need it.
                Subscribed suppliers show direct phone numbers, WhatsApp, and yard directions.
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
                <TrustStat label="Business model" value="Subscription" />
                <TrustStat label="Buyer access" value="100% Free" />
                <TrustStat label="Agent network" value="Guided leads" />
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
              title="Zero transaction fees"
              description="ConMart does not handle buyer payments or take a percentage. Buyers pay suppliers directly."
            />
            <Feature
              icon={Building2}
              title="Verified wholesale depots"
              description="Browse genuine stock levels, volume-tiered rates, and location coordinates across Addis Ababa."
            />
            <Feature
              icon={UserCheck}
              title="Free field agent guides"
              description="Request an on-site agent visit to inspect depot yards, compare quotes, or coordinate deliveries."
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
            Direct sourcing and guided visits in three simple steps
          </h2>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3" aria-label="Steps">
            <Step
              n="01"
              title="Search materials near you"
              description="Browse 20 comprehensive categories. Filter by brand, grade, and nearest sub-city or depot warehouse."
            />
            <Step
              n="02"
              title="Call directly or request an agent"
              description="Subscribed suppliers provide direct phone and WhatsApp links. Non-subscribed listings route to our free local agent team."
            />
            <Step
              n="03"
              title="Inspect on-site and pay directly"
              description="Visit the supplier's yard with your agent, verify materials, and settle payment directly with the depot."
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
                  Find construction materials near you — free
                </h2>
                <p className="mt-4 text-base text-muted-foreground" style={{ textWrap: "pretty" } as React.CSSProperties}>
                  Search suppliers, see their location, and get help from our team if you need it.
                  No registration or payment required for buyers.
                </p>
                <ul className="mt-6 space-y-3" aria-label="Buyer benefits">
                  {[
                    "Free to browse, call, and enquire — always",
                    "Direct phone & WhatsApp contact with subscribed suppliers",
                    "Request a free local agent visit to inspect depot yards",
                    "Instant proforma invoices for procurement planning",
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
              <SubscriptionLeadsPreview />
              <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  For suppliers &amp; depots
                </p>
                <h2
                  id="suppliers-heading"
                  className="heading-display mt-3 text-3xl text-foreground"
                >
                  Get discovered. Subscribe to show your address and catalog to buyers in your area.
                </h2>
                <p className="mt-4 text-base text-muted-foreground" style={{ textWrap: "pretty" } as React.CSSProperties}>
                  Subscribe to show your address and catalog to thousands of contractors across Addis Ababa.
                  Receive direct phone calls, WhatsApp messages, and guided buyer visits. Zero sales commission.
                </p>
                <ul className="mt-6 space-y-3" aria-label="Supplier benefits">
                  {[
                    "Fixed monthly subscription — no pay-per-lead charges",
                    "Direct calls, WhatsApp chats, and map directions to your depot",
                    "Supplier Leads Dashboard tracking calls and buyer interest",
                    "Local commission agents guiding buyers directly to your yard",
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
                  Subscribe your depot
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
              Subscriptions payable via Telebirr, CBE Birr, or Commercial Bank of Ethiopia.
              Bilingual in Amharic and English. Full coverage across Addis Ababa and regional hubs.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <TrustCard
                icon={Users}
                stat="20"
                label="Material categories"
                description="From Cement, Rebar, and Sand to Metal Works, HVAC, Electrical, and Site Wastages."
              />
              <TrustCard
                icon={TrendingUp}
                stat="ETB"
                label="Birr-native pricing"
                description="Wholesale schedules, volume discounts, and proforma invoices denominated in Ethiopian Birr."
              />
              <TrustCard
                icon={UserCheck}
                stat="100%"
                label="Agent-guided assistance"
                description="Field agents on standby to connect buyers with partner depots and inspect materials on-site."
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
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="heading-display text-4xl text-foreground sm:text-5xl">
              Ready to find construction materials near you?
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Start browsing wholesale depots now or subscribe your yard to receive direct contractor calls.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
                Register as Supplier
              </Link>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function TrustStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-2xs font-medium text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-base font-bold text-foreground sm:text-lg">{value}</dd>
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
    <div className="flex flex-col gap-3 p-6 sm:p-8">
      <span
        className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({
  n,
  title,
  description,
}: {
  n: string;
  title: string;
  description: string;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
      <span className="font-mono text-2xl font-bold text-primary">{n}</span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
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
    { name: "Dangote OPC 42.5R — 50kg", loc: "Kaliti Depot", price: "1,280", unit: "bag", phone: "0911 234 567" },
    { name: "Zuquala Rebar \u00d816mm", loc: "Akaki Depot", price: "118,400", unit: "ton", phone: "0922 456 789" },
    { name: "Mojo River Sand", loc: "Mojo Depot", price: "2,450", unit: "m\u00b3", phone: "0911 889 900" },
    { name: "Holcim Hollow Blocks 20cm", loc: "Bole Bulbula", price: "32", unit: "piece", phone: "0933 112 233" },
  ];

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-foreground">Verified Wholesale Depots</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-2xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Direct Contact Visible
          </span>
        </div>
        <ul className="space-y-2.5" aria-label="Sample listings">
          {rows.map((row) => (
            <li
              key={row.name}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{row.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-2xs text-muted-foreground">
                  <span>{row.loc}</span>
                  <span>•</span>
                  <span className="font-mono text-primary font-bold">{row.phone}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-bold text-foreground">
                  {row.price}
                  <span className="ml-1 text-2xs font-normal text-muted-foreground">ETB</span>
                </p>
                <p className="text-2xs text-muted-foreground">/{row.unit}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3.5 flex items-center justify-between px-1">
          <p className="text-2xs text-muted-foreground">
            Direct Phone, WhatsApp, and Yard Directions open to all buyers.
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

function SubscriptionLeadsPreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Supplier Leads Dashboard
            </p>
            <p className="text-sm font-bold text-foreground mt-0.5">Premium Plan Active</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            +28% this week
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              <PhoneCall className="size-3 text-emerald-600" />
              <span>Direct Phone Calls</span>
            </div>
            <p className="mt-1 text-xl font-bold tabular text-foreground">48</p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              <MessageCircle className="size-3 text-emerald-500" />
              <span>WhatsApp Inquiries</span>
            </div>
            <p className="mt-1 text-xl font-bold tabular text-foreground">34</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Listing &amp; Yard Views</span>
            <span className="font-bold text-foreground">420 views</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Agent Guided Visits</span>
            <span className="font-bold text-foreground">12 buyers guided</span>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl"
        aria-hidden="true"
      />
    </div>
  );
}
