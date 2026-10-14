// =============================================================================
// ECON — Global Root Error Boundary (Client Component)
// =============================================================================
// Renders when the root layout itself encounters a fatal error.
// =============================================================================

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ECON Global Root Layout Fatal Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#09090b", color: "#fafafa" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", fontSize: "28px" }}>
            ⚠️
          </div>

          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 12px 0", letterSpacing: "-0.025em" }}>
            Application Runtime Recovery
          </h1>

          <p style={{ fontSize: "14px", color: "#a1a1aa", maxWidth: "440px", lineHeight: "1.6", margin: "0 0 28px 0" }}>
            An unexpected error occurred during root initialization. Please click below to refresh the session state.
          </p>

          <button
            onClick={() => reset()}
            style={{
              padding: "10px 24px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
