import type { ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface AppShellProps {
  /** Wordmark subtitle: "Buyer", "Seller", "Admin". */
  portal: string;
  userName: string;
  userEmail: string;
  sidebarNav: ReactNode;
  sidebarFooter?: ReactNode;
  mobileNav: ReactNode;
  mobileActions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

/**
 * Shared chrome for buyer, seller, and admin portals.
 *
 * Three copies of this layout drifted independently: different paddings,
 * different active-nav treatments, and a door-emoji sign-out on mobile.
 * One shell keeps the product feeling like one product.
 */
export function AppShell({
  portal,
  userName,
  userEmail,
  sidebarNav,
  sidebarFooter,
  mobileNav,
  mobileActions,
  children,
  contentClassName,
}: AppShellProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <Logo size="sm" subtitle={portal} />
          <div className="flex items-center">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">{sidebarNav}</div>

        <div className="mt-auto border-t border-sidebar-border p-3">
          <Link
            href="/account/settings"
            className="mb-3 flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {initials || "U"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="truncate text-2xs text-muted-foreground">{userEmail}</p>
            </div>
            <Settings className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Account settings</span>
          </Link>
          {sidebarFooter}
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-3 backdrop-blur-md md:hidden">
        <Logo size="sm" subtitle={portal} />
        <div className="flex items-center gap-0.5">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/account/settings"
            aria-label="Account settings"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-5" />
          </Link>
          {mobileActions}
        </div>
      </header>

      <main id="main-content" className="flex-1 bg-background pb-20 md:pb-0">
        <div
          className={cn(
            "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8",
            contentClassName
          )}
        >
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-safe backdrop-blur-md md:hidden">
        <div className="flex items-stretch justify-around pt-1">{mobileNav}</div>
      </nav>
    </div>
  );
}
