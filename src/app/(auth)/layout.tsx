import type { Metadata } from "next";
import { Lock, ShieldCheck, Wallet } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to ECON, Ethiopia’s B2B construction marketplace.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 cm-glow" />
        <div className="pointer-events-none absolute inset-0 cm-grid opacity-50" />

        <Logo size="lg" />

        <div className="relative max-w-md space-y-8">
          <div>
            <h1 className="heading-display text-4xl text-foreground">
              Depot-direct materials.
              <span className="mt-2 block text-primary">Contacts stay behind the paywall.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Contractors compare wholesale tiers. Suppliers unlock a verified
              introduction from a prepaid wallet. ECON mediates if the deal
              does not close.
            </p>
          </div>

          <ul className="space-y-4 text-sm">
            <AuthPoint
              icon={ShieldCheck}
              title="Verified depots"
              body="Trade licenses and mill certificates before a listing goes live."
            />
            <AuthPoint
              icon={Lock}
              title="Masked until paid"
              body="Phone and yard details never appear in the catalog."
            />
            <AuthPoint
              icon={Wallet}
              title="80% credit on failure"
              body="If a deal does not materialize, most of the fee returns as non-withdrawable credit."
            />
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Addis Ababa · Bole
        </p>
      </aside>

      <div className="relative flex flex-col items-center justify-center px-4 py-12">
        <div className="absolute top-4 right-4 flex items-center">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="mb-8 lg:hidden">
          <Logo size="md" />
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function AuthPoint({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Lock;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-muted-foreground">{body}</span>
      </span>
    </li>
  );
}
