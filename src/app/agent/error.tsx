// =============================================================================
// ConMart — Agent Portal Error Boundary (Client Component)
// =============================================================================
// Isolates render errors to the agent content area without breaking the agent nav.
// =============================================================================

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgentErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Agent Portal section error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-border/80 bg-card p-8 text-center shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h3 className="text-lg font-bold text-foreground">
        Unable to load agent view
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
        There was a temporary problem retrieving ticket or dispatch data. Please try again.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button size="sm" onClick={() => reset()} className="gap-1.5 font-semibold">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
        <Link href="/agent">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Job Board
          </Button>
        </Link>
      </div>
    </div>
  );
}
