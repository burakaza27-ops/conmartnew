// =============================================================================
// ConMart — Auth Gate Modal
// =============================================================================
// A "soft" auth gate that replaces hard redirects. Instead of bouncing the
// anonymous visitor to /login mid-browse, this modal slides in when they
// attempt a high-intent action (e.g. "Send Purchase Enquiry", "Calculate
// Proforma"). It explains the value proposition and offers sign-in or
// registration without losing their browsing context.
//
// Usage:
//   <AuthGateButton fallback={<Button>Send enquiry</Button>} redirectTo="/buyer/category/cement">
//     <Button onClick={...}>Send enquiry</Button>  {/* rendered for authed users */}
//   </AuthGateButton>
// =============================================================================

"use client";

import React, { useState, type ReactNode, type ReactElement } from "react";
import Link from "next/link";
import { LogIn, UserPlus, ShieldCheck, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface AuthGateModalProps {
  /** The current page path — used as ?redirect= after sign-in. */
  redirectTo: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen modal overlay prompting anonymous users to sign in or register.
 * Preserves the browsing context (URL) so they return to the same page.
 */
export function AuthGateModal({ redirectTo, isOpen, onClose }: AuthGateModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const loginHref = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in required"
    >
      <div className="relative mx-4 w-full max-w-md animate-in fade-in-0 zoom-in-95 rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <ShieldCheck className="size-7" />
          </span>

          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {t("auth_gate_title", "Create a free account to continue")}
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t(
              "auth_gate_description",
              "Browsing is free and always will be. To send a purchase request, calculate a proforma, or message a supplier, you just need a quick free account."
            )}
          </p>

          <ul className="mt-5 space-y-2 text-left text-sm text-muted-foreground">
            {[
              t("auth_gate_benefit_1", "Free to browse, enquire, and compare"),
              t("auth_gate_benefit_2", "Your phone stays masked until the supplier unlocks"),
              t("auth_gate_benefit_3", "Takes less than 30 seconds"),
            ].map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
            <Link
              href={registerHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "flex-1 gap-1.5 font-semibold"
              )}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              {t("auth_gate_register", "Register free")}
            </Link>
            <Link
              href={loginHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "flex-1 gap-1.5 font-semibold"
              )}
            >
              <LogIn className="size-4" aria-hidden="true" />
              {t("auth_gate_sign_in", "Sign in")}
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("auth_gate_dismiss", "Continue browsing")}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AuthGateButton — Convenience wrapper
// =============================================================================
// Wraps an action button so it either renders the authenticated version
// (children) or a visual clone that triggers the AuthGateModal.
//
// isAuthenticated is passed as a prop from the server-rendered layout,
// avoiding a client-side auth check.
// =============================================================================

interface AuthGateButtonProps {
  /** Whether the current visitor has an active session. */
  isAuthenticated: boolean;
  /** The URL to redirect back to after sign-in/register. */
  redirectTo: string;
  /** The element to render for authenticated users. */
  children: ReactNode;
  /** A visual clone button to show anonymous users (triggers the gate modal). */
  fallbackLabel: string;
  /** Optional className for the fallback button. */
  fallbackClassName?: string;
  /** Optional icon to render before the fallback label. */
  fallbackIcon?: ReactElement;
  /** Button variant for the fallback. */
  fallbackVariant?: "default" | "outline" | "secondary" | "ghost";
  /** Button size for the fallback. */
  fallbackSize?: "sm" | "default" | "lg" | "icon";
}

export function AuthGateButton({
  isAuthenticated,
  redirectTo,
  children,
  fallbackLabel,
  fallbackClassName,
  fallbackIcon,
  fallbackVariant = "default",
  fallbackSize = "sm",
}: AuthGateButtonProps) {
  const [showGate, setShowGate] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <Button
        type="button"
        variant={fallbackVariant}
        size={fallbackSize}
        className={fallbackClassName}
        onClick={() => setShowGate(true)}
      >
        {fallbackIcon}
        {fallbackLabel}
      </Button>

      <AuthGateModal
        redirectTo={redirectTo}
        isOpen={showGate}
        onClose={() => setShowGate(false)}
      />
    </>
  );
}
