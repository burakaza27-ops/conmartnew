// =============================================================================
// ECON — Admin Command Center Error Boundary (Client Component)
// =============================================================================

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Command Center error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-card p-8 text-center shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h3 className="text-lg font-bold text-foreground">
        Command Center Interruption
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
        A temporary error occurred loading administrative orders or stats. Click retry to reconnect to the database.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button size="sm" onClick={() => reset()} className="gap-1.5 font-semibold">
          <RotateCcw className="h-3.5 w-3.5" />
          Reconnect
        </Button>
        <Link href="/admin/command-center">
          <Button size="sm" variant="outline" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Command Center
          </Button>
        </Link>
      </div>
    </div>
  );
}
