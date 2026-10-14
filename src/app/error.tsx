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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6 shadow-sm">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <p className="text-sm font-bold uppercase tracking-wider text-destructive">
        Temporary Operational Interruption
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        Something went wrong loading this view.
      </h1>
      <p className="mt-3 max-w-md text-xs sm:text-sm text-muted-foreground">
        The system encountered an unexpected response while processing your request. 
        Your account and orders are safe. Please try refreshing the view.
      </p>

      {error?.digest && (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground/60">
          Incident Reference: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="gap-2 font-semibold shadow-md">
          <RotateCcw className="h-4 w-4" />
          Retry Action
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Homepage
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
