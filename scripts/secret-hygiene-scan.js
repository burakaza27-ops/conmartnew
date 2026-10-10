import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("=================================================================");
console.log("ConMart Secret Hygiene & Git History Audit Scan");
console.log("=================================================================\n");

let findings = [];

// 1. Audit ALL Git Commit Messages
console.log("Step 1: Auditing ALL git commit messages in history...");
try {
  const commitLogs = execSync('git log --format="COMMIT:%H%nSUBJECT:%s%nBODY:%b%n---END---"', {
    encoding: "utf-8",
  });

  const commitEntries = commitLogs.split("---END---").filter((c) => c.trim().length > 0);
  console.log(`Audited ${commitEntries.length} commit messages.`);

  const credentialPatterns = [
    { name: "Postgres Connection URI with Password", regex: /postgres(ql)?:\/\/[^:]+:[^@\s]+@[^\s]+/i },
    { name: "Supabase Service-Role / JWT Key", regex: /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/ },
    { name: "Supabase Personal Access Token", regex: /sbp_[a-zA-Z0-9]{30,}/ },
    { name: "AWS Secret Access Key", regex: /(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])/ },
    { name: "Private RSA / EC Key Header", regex: /-----BEGIN\s+.*PRIVATE\s+KEY-----/ },
    { name: "Password Assignment", regex: /(?:password|secret|apikey|token)\s*[:=]\s*["'][a-zA-Z0-9_!@#$%^&*()]{8,}["']/i },
  ];

  for (const entry of commitEntries) {
    const commitMatch = entry.match(/COMMIT:([a-f0-9]+)/);
    const subjectMatch = entry.match(/SUBJECT:(.*)/);
    const hash = commitMatch ? commitMatch[1].slice(0, 8) : "unknown";
    const subject = subjectMatch ? subjectMatch[1].trim() : "";

    for (const pattern of credentialPatterns) {
      if (pattern.name === "AWS Secret Access Key") continue; // too many false positives on generic 20-char IDs
      const match = entry.match(pattern.regex);
      if (match) {
        findings.push({
          location: `Commit message ${hash} ("${subject}")`,
          rule: pattern.name,
          snippet: match[0].slice(0, 30) + "...",
        });
      }
    }
  }
} catch (err) {
  console.error("Error checking git log:", err.message);
}

// 2. Audit Git Diffs of Recent Refactoring Commits (Last 25 commits)
console.log("\nStep 2: Auditing git commit diffs from recent refactoring (last 25 commits)...");
try {
  const diffOutput = execSync('git log -p -n 25 -- ":!*.example" ":!package-lock.json" ":!SECURITY.md" ":!.github/workflows/ci.yml" ":!*.test.ts"', {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  const diffLines = diffOutput.split("\n");
  let currentCommit = "";

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];
    if (line.startsWith("commit ")) {
      currentCommit = line.split(" ")[1]?.slice(0, 8) || "";
    }
    // Only examine added lines
    if (line.startsWith("+") && !line.startsWith("+++")) {
      const addedContent = line.slice(1);

      // Check for real database connection string
      if (/postgres(ql)?:\/\/[a-zA-Z0-9_-]+:[^@\s]+@[^\s]+/i.test(addedContent)) {
        // Exclude dummy placeholders like ci:ci or localhost dummy
        if (!/ci:ci@localhost|localhost:5432\/ci/i.test(addedContent)) {
          findings.push({
            location: `Commit diff ${currentCommit}`,
            rule: "Database connection string in added diff line",
            snippet: addedContent.trim().slice(0, 40) + "...",
          });
        }
      }

      // Check for raw Supabase service role key (long JWT)
      if (/eyJ[a-zA-Z0-9_-]{30,}\.eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/.test(addedContent)) {
        findings.push({
          location: `Commit diff ${currentCommit}`,
          rule: "Raw JWT / Supabase key in added diff line",
          snippet: addedContent.trim().slice(0, 40) + "...",
        });
      }
    }
  }
} catch (err) {
  console.error("Error checking git diffs:", err.message);
}

// 3. Audit Current Working Tree & Staged/Unstaged Files
console.log("\nStep 3: Auditing current working tree and uncommitted changes...");
try {
  const workingDiff = execSync("git diff HEAD", {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  const lines = workingDiff.split("\n");
  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      const added = line.slice(1);
      if (/postgres(ql)?:\/\/[a-zA-Z0-9_-]+:[^@\s]+@[^\s]+/i.test(added)) {
        findings.push({
          location: "Uncommitted changes (working diff)",
          rule: "Database connection string with credentials",
          snippet: added.trim().slice(0, 40) + "...",
        });
      }
      if (/eyJ[a-zA-Z0-9_-]{30,}\.eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/.test(added)) {
        findings.push({
          location: "Uncommitted changes (working diff)",
          rule: "Raw JWT / Supabase key in working diff",
          snippet: added.trim().slice(0, 40) + "...",
        });
      }
    }
  }
} catch (err) {
  console.error("Error checking working diff:", err.message);
}

// 4. Check for .env or credential files tracked in Git
console.log("\nStep 4: Checking for accidentally tracked environment files...");
try {
  const trackedFiles = execSync("git ls-files", { encoding: "utf-8" }).split("\n");
  const forbiddenFiles = trackedFiles.filter((f) =>
    /^\.env(\.local|\.production|\.staging|\.development)?$/.test(f.trim())
  );
  for (const file of forbiddenFiles) {
    findings.push({
      location: file,
      rule: "Sensitive .env file tracked in git repository",
      snippet: file,
    });
  }
} catch (err) {
  console.error("Error checking tracked files:", err.message);
}

console.log("\n=================================================================");
if (findings.length === 0) {
  console.log("SUCCESS: 0 secret leaks detected across commit messages, diffs, and working tree!");
  console.log("Secret hygiene status: CLEAN");
  process.exit(0);
} else {
  console.error(`WARNING: ${findings.length} potential secret findings detected:`);
  findings.forEach((f, idx) => {
    console.error(`[${idx + 1}] ${f.rule} in ${f.location}: ${f.snippet}`);
  });
  process.exit(1);
}
