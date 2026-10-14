// =============================================================================
// ECON — Seller Dashboard Error Boundary (Client Component)
// =============================================================================

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellerErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Seller Dashboard section error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-border/80 bg-card p-8 text-center shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h3 className="text-lg font-bold text-foreground">
        Unable to load seller management data
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
        A temporary server issue prevented your listings or inventory from displaying.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button size="sm" onClick={() => reset()} className="gap-1.5 font-semibold">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
        <Link href="/seller/dashboard">
          <Button size="sm" variant="outline" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
