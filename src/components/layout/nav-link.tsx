"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function SidebarNavLink({ href, label, icon: Icon, exact }: NavItem) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary/15 text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)]"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      {/* Bold active rail — 3px, not 2px */}
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary"
        />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function MobileTabLink({ href, label, icon: Icon, exact }: NavItem) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center min-h-[50px] gap-1 px-1 py-1 text-2xs font-semibold transition-colors active:scale-95",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-lg transition-colors",
          active && "bg-primary/15"
        )}
      >
        <Icon className={cn("size-4.5", active ? "text-primary" : "text-muted-foreground")} />
      </span>
      <span className="max-w-full truncate leading-tight tracking-tight">{label}</span>
    </Link>
  );
}
