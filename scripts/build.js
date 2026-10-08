#!/usr/bin/env node
// =============================================================================
// ConMart — Robust Build Runner with Guaranteed Heap Allocation
// =============================================================================
// Sets NODE_OPTIONS to ensure both the coordinator and all Next.js Turbopack /
// compilation child worker threads receive adequate V8 heap space (4096MB).
// =============================================================================

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const currentOptions = process.env.NODE_OPTIONS || "";
if (!currentOptions.includes("--max-old-space-size")) {
  process.env.NODE_OPTIONS = `${currentOptions} --max-old-space-size=4096`.trim();
}

// Build-time compilation does not have or require live production Redis credentials
if (!process.env.SKIP_ENV_VALIDATION) {
  process.env.SKIP_ENV_VALIDATION = "true";
}

const res = spawnSync(process.execPath, [NEXT_BIN, "build"], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});

process.exit(res.status ?? 0);
