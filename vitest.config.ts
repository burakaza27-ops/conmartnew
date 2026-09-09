import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // The modules that move money or hide contact details. Regressions here
      // cost real birr or give away the product, so they are held to a higher
      // bar than the UI.
      include: [
        "src/lib/money.ts",
        "src/lib/engine/pricing.ts",
        "src/lib/wallet/accounting.ts",
        "src/lib/security/masking.ts",
        "src/lib/engine/reference-code.ts",
        "src/lib/marketplace/subscription.ts",
        "src/lib/marketplace/chat-guard.ts",
        "src/lib/marketplace/zone-matching.ts",
        "src/lib/marketplace/deal-ticket.ts",
        "src/lib/marketplace/commission.ts",
      ],
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
