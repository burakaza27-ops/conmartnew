// =============================================================================
// ECON — Admin Error Boundary (Client Component)
// =============================================================================
// Catches rendering errors in the /admin route group.
//
// Auto-recovers from stale deployment errors: after a new Vercel deployment,
// browsers with cached JS try to call server action IDs that no longer exist.
// Rather than showing the user an error screen, we automatically reload the
// page (once) so the fresh JS loads.
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Error names / messages that indicate a stale deployment cache. */
function isStaleDeploymentError(error: Error): boolean {
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    msg.includes("unrecognizedactionerror") ||
    msg.includes("server action") ||
    msg.includes("was not found on the server") ||
    msg.includes("chunkloaderror") ||
    msg.includes("loading chunk") ||
    msg.includes("failed to fetch dynamically imported module")
  );
}

const AUTO_RELOAD_KEY = "econ_admin_auto_reload_ts";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hasAutoReloaded = useRef(false);

  useEffect(() => {
    console.error("Admin error caught:", error);

    // Auto-reload ONCE for stale deployment errors.
    // We store a timestamp in sessionStorage so we don't reload in a loop.
    if (isStaleDeploymentError(error) && typeof window !== "undefined" && !hasAutoReloaded.current) {
      hasAutoReloaded.current = true;
      const lastReload = sessionStorage.getItem(AUTO_RELOAD_KEY);
      const now = Date.now();
      // Only auto-reload if we haven't done so in the last 30 seconds
      if (!lastReload || now - Number(lastReload) > 30_000) {
        sessionStorage.setItem(AUTO_RELOAD_KEY, String(now));
        window.location.reload();
        return;
      }
    }
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
        A temporary error occurred loading the admin dashboard. This usually
        resolves with a page refresh after a new deployment.
      </p>
      {error?.digest && (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
          Digest: {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="sm"
          onClick={() => {
            // Clear the auto-reload guard so a manual click always refreshes
            if (typeof window !== "undefined") {
              sessionStorage.removeItem(AUTO_RELOAD_KEY);
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reconnect
        </Button>
        <Link href="/admin/command-center">
          <Button size="sm" variant="outline" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Command Center
          </Button>
        </Link>
        <Link href="/admin/subscriptions">
          <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground">
            Subscriptions
          </Button>
        </Link>
        <Link href="/admin/agents">
          <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground">
            Agents
          </Button>
        </Link>
      </div>
    </div>
  );
}
