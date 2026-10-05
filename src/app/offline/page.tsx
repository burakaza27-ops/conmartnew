import type { Metadata } from "next";
import { OfflineContent } from "./offline-content";

// =============================================================================
// ECON — Offline Experience Page (Server Component)
// =============================================================================
// Rendered when connection drops; provides status, instructions, and reconnection.
// =============================================================================

export const metadata: Metadata = {
  title: "Offline Mode | ECON",
  description: "You are currently offline. Please check your network connection.",
};

export default function OfflinePage() {
  return <OfflineContent />;
}
