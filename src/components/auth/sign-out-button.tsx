// =============================================================================
// ECON — Universal Resilient Sign-Out Component (Client Component)
// =============================================================================
// Provides 100% reliable logout across every role, browser, and device:
// 1. Instant tactile feedback with loading spinner (prevents duplicate taps).
// 2. Client-side browser storage purge (localStorage, sessionStorage, document.cookie).
// 3. Client-side Supabase signOut with a strict 1.5s timeout.
// 4. Server-side cookie invalidation via the signOut Server Action.
// 5. Hard browser reload to /login (wipes in-memory React state and router cache).
// =============================================================================

"use client";

import React, { useState, useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { signOut as serverSignOut } from "@/app/actions/auth";

export interface SignOutButtonProps {
  /** Visual presentation mode. */
  variant?: "header-icon" | "mobile-tab" | "sidebar-item" | "button";
  /** Optional custom CSS classes. */
  className?: string;
  /** Optional custom icon classes. */
  iconClassName?: string;
  /** Optional destination after logout (default: "/login"). */
  redirectTo?: string;
  /** Optional custom button content. */
  children?: React.ReactNode;
}

export function SignOutButton({
  variant = "sidebar-item",
  className,
  iconClassName,
  redirectTo = "/login",
  children,
}: SignOutButtonProps) {
  const { locale, t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isExecuting, setIsExecuting] = useState(false);

  const busy = isPending || isExecuting;

  const handleSignOut = () => {
    if (busy) return;
    setIsExecuting(true);

    startTransition(async () => {
      try {
        // 1. Client-side storage purge
        if (typeof window !== "undefined") {
          try {
            // Clear all auth-related localStorage keys
            const localKeysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (
                key &&
                (key.startsWith("sb-") ||
                  key.includes("supabase") ||
                  key.includes("auth") ||
                  key.includes("session"))
              ) {
                localKeysToRemove.push(key);
              }
            }
            localKeysToRemove.forEach((k) => localStorage.removeItem(k));

            // Clear sessionStorage
            sessionStorage.clear();

            // Expire any accessible auth cookies on document.cookie
            const cookies = document.cookie.split(";");
            for (const cookie of cookies) {
              const eqPos = cookie.indexOf("=");
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
              if (
                name.startsWith("sb-") ||
                name.includes("auth") ||
                name.includes("token") ||
                name.includes("session")
              ) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
              }
            }
          } catch (e) {
            console.warn("[SignOutButton] Client storage wipe warning:", e);
          }

          // 2. Client-side Supabase signOut with timeout guard
          try {
            const supabase = createSupabaseBrowserClient();
            await Promise.race([
              supabase.auth.signOut(),
              new Promise((res) => setTimeout(res, 1500)),
            ]);
          } catch (e) {
            console.warn("[SignOutButton] Browser Supabase signOut warning:", e);
          }
        }

        // 3. Server-side cookie purge & session revocation
        try {
          await Promise.race([
            serverSignOut(),
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch (e) {
          console.warn("[SignOutButton] Server signOut action warning:", e);
        }
      } finally {
        // 4. Guaranteed hard redirect to clean destination
        if (typeof window !== "undefined") {
          window.location.href = redirectTo;
        }
      }
    });
  };

  const label = locale === "am" ? "ውጣ" : "Sign out";
  const busyLabel = locale === "am" ? "በመውጣት ላይ..." : "Signing out...";

  // 1. Header icon variant (Compact for top nav bar)
  if (variant === "header-icon") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={busy}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 touch-target",
          className
        )}
      >
        {busy ? (
          <Loader2 className={cn("size-4.5 animate-spin text-destructive", iconClassName)} />
        ) : (
          <LogOut className={cn("size-4.5", iconClassName)} />
        )}
      </button>
    );
  }

  // 2. Mobile tab variant (For bottom tab bar)
  if (variant === "mobile-tab") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={busy}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 px-1 py-1 text-2xs font-medium text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60 touch-target",
          className
        )}
      >
        {busy ? (
          <Loader2 className={cn("size-5 animate-spin text-destructive", iconClassName)} />
        ) : (
          <LogOut className={cn("size-5", iconClassName)} />
        )}
        <span className="truncate max-w-[64px]">{busy ? busyLabel : label}</span>
      </button>
    );
  }

  // 3. Button variant (e.g. for Account Settings page)
  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={handleSignOut}
        disabled={busy}
        className={cn("w-full sm:w-auto font-semibold gap-2 touch-target", className)}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        <span>{busy ? busyLabel : (children ?? label)}</span>
      </Button>
    );
  }

  // 4. Default: Sidebar item variant
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={busy}
      className={cn(
        "w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors touch-target",
        className
      )}
    >
      {busy ? (
        <Loader2 className={cn("size-4 animate-spin text-destructive", iconClassName)} />
      ) : (
        <LogOut className={cn("size-4", iconClassName)} />
      )}
      <span>{busy ? busyLabel : (children ?? label)}</span>
    </Button>
  );
}
