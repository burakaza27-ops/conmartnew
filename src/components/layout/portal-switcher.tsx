// =============================================================================
// ECON — Unified Portal & Role Switcher
// =============================================================================
// Gives administrators (and authorized multi-role users) seamless 1-click
// switching across the 4 platform portals: Admin, Buyer, Seller, and Field Agent.
// =============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  ShoppingCart,
  Store,
  Compass,
  ChevronDown,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface PortalSwitcherProps {
  currentPortal: string;
  userRole?: UserRole | string;
  userEmail?: string;
  isMobile?: boolean;
}

interface PortalOption {
  id: string;
  name: string;
  href: string;
  badge: string;
  description: string;
  icon: typeof ShieldAlert;
  accentClass: string;
}

const PORTALS: PortalOption[] = [
  {
    id: "admin",
    name: "Admin Console",
    href: "/admin/command-center",
    badge: "Operations",
    description: "Command center, subscriptions, vetting & ledger",
    icon: ShieldAlert,
    accentClass: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "buyer",
    name: "Buyer Marketplace",
    href: "/buyer",
    badge: "Public / Browse",
    description: "Browse catalog, request RFQs & place orders",
    icon: ShoppingCart,
    accentClass: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "seller",
    name: "Supplier Portal",
    href: "/seller/dashboard",
    badge: "Merchant",
    description: "Catalog listings, pricing tiers & sales wallet",
    icon: Store,
    accentClass: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "agent",
    name: "Field Agent Inbox",
    href: "/agent/leads",
    badge: "01B Protocol",
    description: "Guided leads, nearby requests & commission deals",
    icon: Compass,
    accentClass: "text-orange-600 bg-orange-500/10 border-orange-500/20",
  },
];

export function PortalSwitcher({
  currentPortal,
  userRole,
  userEmail,
  isMobile = false,
}: PortalSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Esc key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Only render switcher for ADMIN accounts (or known admin email)
  const isAdmin = userRole === "ADMIN" || userEmail === "brooknew25@gmail.com";
  if (!isAdmin) {
    return null;
  }

  const normalizedCurrent = currentPortal.toLowerCase();
  const currentOption =
    PORTALS.find((p) => normalizedCurrent.includes(p.id)) || PORTALS[0];
  const CurrentIcon = currentOption.icon;

  if (isMobile) {
    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Switch portal"
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-2xs font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          <CurrentIcon className="size-3" />
          <span className="capitalize">{currentPortal}</span>
          <ChevronDown className={cn("size-3 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 border-b border-border/60 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-primary" /> Admin Portal Switcher
              </span>
              <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold">
                Admin Mode
              </span>
            </div>
            <div className="space-y-1">
              {PORTALS.map((portal) => {
                const Icon = portal.icon;
                const isActive = normalizedCurrent.includes(portal.id);
                return (
                  <Link
                    key={portal.id}
                    href={portal.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{portal.name}</span>
                        {isActive && <Check className="size-3.5" />}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative mb-3 px-1" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/60 p-2 text-left transition-all",
          "hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring",
          isOpen && "border-primary ring-2 ring-primary/15 bg-muted/40"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("flex size-7 items-center justify-center rounded-lg border", currentOption.accentClass)}>
            <CurrentIcon className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-bold text-foreground">
                {currentOption.name}
              </span>
            </div>
            <span className="block truncate text-[10px] font-medium text-muted-foreground">
              Admin — Switch Portal
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-1 right-1 top-full mt-2 rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-2xl z-50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 border-b border-border/50 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-[11px] font-bold text-foreground">Switch Active Portal</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
              Full Access
            </span>
          </div>

          <div className="space-y-1">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const isActive = normalizedCurrent.includes(portal.id);
              return (
                <Link
                  key={portal.id}
                  href={portal.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl p-2.5 transition-all text-left",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "hover:bg-muted/70 text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 items-center justify-center rounded-lg shrink-0",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : portal.accentClass
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">{portal.name}</span>
                      {isActive ? (
                        <span className="flex items-center gap-1 text-[10px] bg-primary-foreground/20 px-1.5 py-0.2 rounded font-mono font-bold">
                          <Check className="size-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {portal.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] line-clamp-1 mt-0.5",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {portal.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-border/50 px-1">
            <Link
              href="/account/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground py-1 px-2 rounded-lg hover:bg-muted transition-colors font-medium"
            >
              <span>Manage Roles in Account Settings</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
