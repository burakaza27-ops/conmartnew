// =============================================================================
// ConMart — Public Browse Shell
// =============================================================================
// A lightweight layout shell for anonymous visitors browsing the marketplace.
// Shows the marketing header with sign-in/register CTAs, a minimal sidebar
// for category navigation, and a sticky bottom banner prompting registration
// when the visitor is ready to take action.
//
// Used by the buyer layout when no authenticated session is detected on
// public browse routes (/buyer/catalog, /buyer/category, /buyer/product).
// =============================================================================

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Package, LayoutGrid, LogIn } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicBrowseShellProps {
  children: ReactNode;
}

const PUBLIC_NAV_LINKS = [
  { href: "/buyer/category/all", label: "All materials", icon: Package },
  { href: "/buyer", label: "Categories", icon: LayoutGrid },
];

export function PublicBrowseShell({ children }: PublicBrowseShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <nav
            className="hidden items-center gap-6 text-sm font-medium md:flex"
            aria-label="Browse navigation"
          >
            {PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <link.icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden gap-1.5 sm:inline-flex"
              )}
            >
              <LogIn className="size-3.5" aria-hidden="true" />
              Sign in
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "sm" }), "font-semibold")}
            >
              Get started
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* ── Sticky CTA Banner ───────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Sign up free to send purchase requests
          </p>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "shrink-0 font-semibold"
            )}
          >
            Register
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
