// =============================================================================
// ECON — Root Error Boundary (Client Component)
// =============================================================================
// Catches unhandled client and server errors gracefully, prevents blank screens,
// and provides instant retry recovery without crashing the session.
// =============================================================================

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log exception for telemetry/monitoring
    console.error("ECON Root Error Boundary caught exception:", {
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-5">
        <AlertTriangle className="size-7" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        The system hit an unexpected error loading this view.
        Your account and orders are safe — try refreshing.
      </p>

      {error?.digest && (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground/60">
          Ref: {error.digest}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="gap-2 font-semibold">
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="size-4" />
            Home
          </Button>
        </Link>
      </div>

      <div className="mt-12 text-xs text-muted-foreground">
        Urgent order issue? ECON Ops Desk:{" "}
        <span className="font-semibold text-foreground">
          {process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000"}
        </span>
      </div>
    </div>
  );
}
