// =============================================================================
// ECON — Unauthorized Page
// =============================================================================

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2">
        <h1 className="heading-display text-3xl text-foreground">Access denied</h1>
          <p className="max-w-md text-muted-foreground">
            You don&apos;t have permission to access this page. This area is
            restricted to authorized personnel only.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Go Home
          </Link>
          <Link href="/login" className={cn(buttonVariants())}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
