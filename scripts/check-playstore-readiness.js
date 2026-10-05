import fs from "fs";
import path from "path";

const root = process.cwd();

console.log("=================================================");
console.log("  ECON — Google Play Store & PWA Readiness Audit ");
console.log("=================================================");

let hasErrors = false;

function check(label, fn) {
  try {
    const ok = fn();
    if (ok) {
      console.log(`  [PASS] ${label}`);
    } else {
      console.log(`  [FAIL] ${label}`);
      hasErrors = true;
    }
  } catch (err) {
    console.log(`  [FAIL] ${label}: ${err.message}`);
    hasErrors = true;
  }
}

// 1. Web App Manifest
check("Web App Manifest (public/manifest.json)", () => {
  const file = path.join(root, "public/manifest.json");
  if (!fs.existsSync(file)) return false;
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return (
    json.name &&
    json.short_name &&
    json.start_url &&
    json.display === "standalone" &&
    Array.isArray(json.icons) &&
    json.icons.length >= 2
  );
});

// 2. High-Res App Icons
check("App Icon (512x512 PNG)", () => {
  const file = path.join(root, "public/icons/icon-512x512.png");
  return fs.existsSync(file) && fs.statSync(file).size > 1000;
});

check("App Icon (192x192 PNG)", () => {
  const file = path.join(root, "public/icons/icon-192x192.png");
  return fs.existsSync(file) && fs.statSync(file).size > 1000;
});

check("Maskable App Icon (512x512 PNG - Android Adaptive)", () => {
  const file = path.join(root, "public/icons/icon-maskable-512x512.png");
  return fs.existsSync(file) && fs.statSync(file).size > 1000;
});

check("Apple Touch Icon (180x180 PNG)", () => {
  const file = path.join(root, "public/icons/apple-touch-icon.png");
  return fs.existsSync(file) && fs.statSync(file).size > 1000;
});

// 3. Service Worker
check("Service Worker (public/sw.js)", () => {
  const file = path.join(root, "public/sw.js");
  if (!fs.existsSync(file)) return false;
  const content = fs.readFileSync(file, "utf8");
  return (
    content.includes("addEventListener(\"fetch\"") ||
    content.includes("addEventListener('fetch'")
  );
});

// 4. Offline Fallback Page
check("Offline Fallback Page (src/app/offline/page.tsx)", () => {
  const file = path.join(root, "src/app/offline/page.tsx");
  return fs.existsSync(file);
});

// 5. Digital Asset Links
check("Digital Asset Links (public/.well-known/assetlinks.json)", () => {
  const file = path.join(root, "public/.well-known/assetlinks.json");
  if (!fs.existsSync(file)) return false;
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(json) && json[0]?.target?.namespace === "android_app";
});

// 6. Bubblewrap TWA Configuration
check("Bubblewrap TWA Manifest (twa-manifest.json)", () => {
  const file = path.join(root, "twa-manifest.json");
  if (!fs.existsSync(file)) return false;
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return json.packageId && json.host && json.name;
});

console.log("-------------------------------------------------");
if (hasErrors) {
  console.log("Status: ❌ SOME CHECKS FAILED. See details above.");
  process.exit(1);
} else {
  console.log("Status: ✅ 100% READY FOR GOOGLE PLAY STORE (TWA/PWA)!");
  console.log("Documentation: docs/playstore-publishing-guide.md");
}
console.log("=================================================");
