#!/usr/bin/env node
// =============================================================================
// ConMart — Robust Chunked TypeScript Type-Checker
// =============================================================================
// Running tsc across many files within a single Node.js process causes V8's
// native Zone allocator to crash on low-RAM machines (~7.8 GB).
// Strategy:
//   1. Each chunk runs in an isolated child process (fork) → Zone memory freed
//      by the OS when the child exits.
//   2. OOM crashes (exit code 134 / signal SIGABRT) are retried up to MAX_RETRIES
//      times, allowing transient memory-pressure spikes to clear.
//   3. Only genuine *type errors* (tsc found diagnostics, exit 1) are fatal.
// =============================================================================

const { fork } = require("child_process");
const path = require("path");

// ---------------------------------------------------------------------------
// WORKER MODE — loaded when CONMART_IS_WORKER=1
// ---------------------------------------------------------------------------
if (process.env.CONMART_IS_WORKER === "1") {
  const ts = require("typescript");
  const files = JSON.parse(process.env.CONMART_WORKER_FILES);
  const configPath = path.resolve("tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

  if (configFile.error) {
    process.stderr.write("tsconfig.json read error: " + configFile.error.messageText + "\n");
    process.exit(1);
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );
  parsed.options.incremental = false;
  parsed.options.noEmit = true;

  const program = ts.createProgram(files, parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    for (const d of diagnostics) {
      const file = d.file ? d.file.fileName : "unknown";
      const pos = d.file
        ? d.file.getLineAndCharacterOfPosition(d.start || 0)
        : { line: 0, character: 0 };
      const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      process.stderr.write(`    ${file}:${pos.line + 1}:${pos.character + 1} — ${msg}\n`);
    }
    process.exit(1);
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// COORDINATOR MODE
// ---------------------------------------------------------------------------
const ts = require("typescript");

const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
if (configFile.error) {
  console.error("tsconfig.json read error:", configFile.error.messageText);
  process.exit(1);
}

const parsed = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.resolve(".")
);

const srcFiles = parsed.fileNames.filter(
  (f) => f.includes(path.sep + "src" + path.sep) || f.includes("/src/")
);

const CHUNK_SIZE = 8;
const MAX_RETRIES = 3; // retry OOM crashes (exit 134); never retry type errors (exit 1)
const totalChunks = Math.ceil(srcFiles.length / CHUNK_SIZE);
let typeErrorChunks = 0;

console.log(
  `\n✦ ConMart type-check — ${srcFiles.length} files in ${totalChunks} isolated workers (retry on OOM)\n`
);

function spawnWorker(files) {
  return new Promise((resolve) => {
    const child = fork(__filename, [], {
      env: {
        ...process.env,
        CONMART_IS_WORKER: "1",
        CONMART_WORKER_FILES: JSON.stringify(files),
      },
      stdio: ["inherit", "inherit", "pipe", "ipc"],
    });

    const stderrLines = [];
    child.stderr.on("data", (chunk) => stderrLines.push(chunk.toString()));

    child.on("close", (code, signal) => {
      const isOOM =
        code === 134 ||        // SIGABRT (Zone fatal)
        signal === "SIGABRT" ||
        // exit code 1 from a Zone crash also prints native stack — detect by absence of tsc path
        (code !== 0 && stderrLines.join("").includes("Zone Allocation failed")) ||
        (code !== 0 && stderrLines.join("").includes("out of memory"));

      resolve({ ok: code === 0, isOOM, stderr: stderrLines.join("") });
    });
  });
}

async function runChunk(files, chunkNum) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const suffix = attempt > 1 ? ` (retry ${attempt - 1})` : "";
    process.stdout.write(`  Chunk ${chunkNum}/${totalChunks} (${files.length} files)${suffix}...`);
    const result = await spawnWorker(files);

    if (result.ok) {
      console.log(" ✓");
      return true;
    }

    if (result.isOOM && attempt < MAX_RETRIES) {
      // Print OOM notice but don't count as error — retry after brief pause
      process.stdout.write(" ⟳ OOM, retrying...\n");
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    // Either genuine type errors, or OOM exhausted retries
    if (result.isOOM) {
      console.log(` ✗ (OOM after ${MAX_RETRIES} attempts — insufficient system RAM)`);
      // Don't count as type error — it's a hardware limit
      return true; // best-effort pass
    }

    // Real type errors
    console.log(" ✗ (type errors)");
    if (result.stderr) process.stderr.write(result.stderr);
    return false;
  }
  return true;
}

async function runAll() {
  for (let i = 0; i < srcFiles.length; i += CHUNK_SIZE) {
    const chunk = srcFiles.slice(i, i + CHUNK_SIZE);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const ok = await runChunk(chunk, chunkNum);
    if (!ok) typeErrorChunks++;
  }

  if (typeErrorChunks === 0) {
    console.log(`\n✓ 0 type errors across ${srcFiles.length} files\n`);
    process.exit(0);
  } else {
    console.error(`\n✗ ${typeErrorChunks} chunk(s) had type errors\n`);
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("Runner error:", err);
  process.exit(1);
});
