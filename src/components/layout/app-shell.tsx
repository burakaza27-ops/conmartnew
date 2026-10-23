import type { ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { PortalSwitcher } from "@/components/layout/portal-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface AppShellProps {
  /** Wordmark subtitle: "Buyer", "Seller", "Admin". */
  portal: string;
  userName: string;
  userEmail: string;
  userRole?: UserRole | string;
  /** Authenticated user ID — used to subscribe to Realtime notifications. */
  userId?: string;
  unreadNotifications?: number;
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
  userRole,
  userId,
  unreadNotifications = 0,
  sidebarNav,
  sidebarFooter,
  mobileNav,
  mobileActions,
  children,
  contentClassName,
}: AppShellProps) {
  const initials = (userName || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "A";

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {/* Sidebar header: logo + utilities */}
        <div className="flex h-14 items-center justify-between gap-2 border-b border-sidebar-border/60 px-4">
          <Logo size="sm" subtitle={portal} />
          <div className="flex items-center gap-0.5">
            <NotificationBell initialUnread={unreadNotifications} userId={userId} />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Portal switcher — admin only */}
        <div className="px-2 pt-2">
          <PortalSwitcher
            currentPortal={portal}
            userRole={userRole}
            userEmail={userEmail}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">{sidebarNav}</div>

        <div className="border-t border-sidebar-border/60 p-3">
          <Link
            href="/account/settings"
            className="group mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent"
          >
            {/* Avatar — amber ring matches brand primary */}
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary ring-1 ring-primary/30">
              {initials || "U"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
              <p className="truncate text-2xs text-muted-foreground">{userEmail}</p>
            </div>
            <Settings className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
            <span className="sr-only">Account settings</span>
          </Link>
          {sidebarFooter}
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar/95 px-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <Logo size="sm" subtitle={portal} />
          <PortalSwitcher
            currentPortal={portal}
            userRole={userRole}
            userEmail={userEmail}
            isMobile
          />
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell initialUnread={unreadNotifications} userId={userId} />
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/account/settings"
            aria-label="Account settings"
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            <Settings className="size-4.5" />
          </Link>
          <SignOutButton variant="header-icon" />
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-sidebar-border bg-sidebar/98 pb-safe backdrop-blur-md md:hidden">
        <div className="flex items-stretch justify-around pt-0.5">{mobileNav}</div>
      </nav>
    </div>
  );
}
