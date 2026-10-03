import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// SiteHeader is intentionally a server component — the nav links are static.
// Language-dependent strings (nav_sign_in, nav_get_started) are the only
// parts that need the client, so they are inlined here in both languages
// and the visible one toggled by CSS via the :lang selector to avoid making
// this a client component just for translated button labels.
//
// The LanguageToggle and ThemeToggle are client components but they are
// small, self-contained islands that do not require this shell to opt in.

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Main navigation">
          <Link
            href="/buyer/category/all"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Materials
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
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
  );
}
