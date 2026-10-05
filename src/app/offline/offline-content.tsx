"use client";

// =============================================================================
// ECON — Offline Experience Client Component
// =============================================================================
// Handles interactive reconnect actions and retry buttons for offline users.
// =============================================================================

import Link from "next/link";
import { WifiOff, RefreshCw, PhoneCall, ArrowLeft } from "lucide-react";

export function OfflineContent() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-md shadow-xl flex flex-col items-center">
        {/* Animated Offline Icon */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10 text-warning border border-warning/25">
          <WifiOff className="h-10 w-10 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-warning"></span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          No Internet Connection
        </h1>
        <p className="text-sm font-medium text-primary mb-3">
          የኢንተርኔት ግንኙነት ተቋርጧል
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          You are currently in offline mode. If you are on an active construction
          site or basement yard, ECON will automatically reconnect as soon as
          cellular or Wi-Fi signal is restored.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 px-4 shadow-sm hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection (እንደገና ሞክር)
          </button>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-accent py-2.5 px-4 text-sm font-medium text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Link>
        </div>

        {/* Support contact info for urgent delivery verification */}
        <div className="mt-8 pt-6 border-t border-border/60 w-full text-xs text-muted-foreground flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <PhoneCall className="h-3.5 w-3.5 text-primary" />
            <span>Urgent Dispatch Support</span>
          </div>
          <p>
            Direct Depot Line:{" "}
            <a
              href="tel:+251911000000"
              className="text-primary hover:underline font-mono"
            >
              +251 91 100 0000
            </a>
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Addis Ababa, Ethiopia
          </p>
        </div>
      </div>
    </main>
  );
}
