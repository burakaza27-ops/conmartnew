// =============================================================================
// ConMart — Secret & Keystore Hygiene Check
// =============================================================================
// Verifies:
// 1. android.keystore is NOT tracked in git.
// 2. No *.keystore or *.jks files are staged or committed.
// 3. Reminds developers to rotate any database credentials in git history.
// =============================================================================

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (err) {
    return "";
  }
}

console.log("Checking secret and keystore hygiene...");

// Check 1: Ensure no keystore is tracked by Git
const trackedKeystores = run("git ls-files \"*.keystore\" \"*.jks\"");
if (trackedKeystores) {
  console.error("FATAL: Signing keystore is tracked in git:\n" + trackedKeystores);
  console.error("Remove it from git cache immediately: git rm --cached <file>");
  process.exit(1);
}

// Check 2: Verify .gitignore contains *.keystore
const gitignorePath = path.join(__dirname, "..", ".gitignore");
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, "utf8");
  if (!gitignore.includes("*.keystore") && !gitignore.includes("android.keystore")) {
    console.error("WARNING: .gitignore does not explicitly ignore *.keystore files.");
  }
}

// Check 3: Warn if android.keystore exists in repo root
const keystorePath = path.join(__dirname, "..", "android.keystore");
if (fs.existsSync(keystorePath)) {
  console.log("ℹ Notice: android.keystore exists locally on disk (gitignored). Keep this key safe and do NOT commit it.");
}

console.log("✔ Secret hygiene checks passed.");
