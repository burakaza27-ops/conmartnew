// =============================================================================
// ECON — shadcn/ui Utility Functions
// =============================================================================
// Core utility for merging Tailwind CSS class names with proper precedence.
// Used by all shadcn/ui components.
// =============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names with intelligent conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
