import fs from "fs";
import path from "path";
import sharp from "sharp";

const ICONS_DIR = path.resolve(process.cwd(), "public/icons");
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Crisp vector SVG for standard app icon (with high-end dark industrial background & amber brand beam)
function createStandardSvg(size) {
  // Beams + subtle gradient + industrial bevel
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#2a2a24" />
      <stop offset="100%" stop-color="#141411" />
    </radialGradient>
    <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="60%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#44443c" />
      <stop offset="100%" stop-color="#22221d" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#f59e0b" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="4" y="4" width="504" height="504" rx="108" stroke="url(#borderGrad)" stroke-width="4" />

  <!-- Amber Icon Container -->
  <g filter="url(#shadow)">
    <!-- Central Beam Mark -->
    <g transform="translate(96, 76)">
      <!-- Structural Beams Frame -->
      <path
        d="M60 270 V95 L160 38 L260 95 V270"
        stroke="url(#beamGrad)"
        stroke-width="32"
        stroke-linejoin="round"
        stroke-linecap="round"
        filter="url(#glow)"
      />
      <!-- Crossbeam Tie -->
      <path
        d="M60 176 H260"
        stroke="url(#beamGrad)"
        stroke-width="32"
        stroke-linecap="round"
      />
      <!-- Modern Accent Bolt / Core Motif -->
      <circle cx="160" cy="176" r="14" fill="#141411" stroke="#fbbf24" stroke-width="6" />
    </g>

    <!-- Wordmark ECON below -->
    <text
      x="256"
      y="435"
      text-anchor="middle"
      fill="#f5f5f4"
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      font-weight="900"
      font-size="64"
      letter-spacing="9"
    >ECON</text>
  </g>
</svg>
  `.trim();
}

// Maskable icon requires safe area (central 60% contains core graphic, background bleeds to edges)
function createMaskableSvg(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGradMask" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#2a2a24" />
      <stop offset="100%" stop-color="#141411" />
    </radialGradient>
    <linearGradient id="beamGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="60%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="glowMask" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#f59e0b" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Full Bleed Background (no rounded corners for maskable, OS masks it) -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />

  <!-- Content scaled inside the safe zone (centered, ~55% diameter) -->
  <g transform="translate(136, 110) scale(0.75)">
    <!-- Structural Beams Frame -->
    <path
      d="M60 270 V95 L160 38 L260 95 V270"
      stroke="url(#beamGradMask)"
      stroke-width="36"
      stroke-linejoin="round"
      stroke-linecap="round"
      filter="url(#glowMask)"
    />
    <!-- Crossbeam Tie -->
    <path
      d="M60 176 H260"
      stroke="url(#beamGradMask)"
      stroke-width="36"
      stroke-linecap="round"
    />
    <circle cx="160" cy="176" r="16" fill="#141411" stroke="#fbbf24" stroke-width="7" />

    <!-- Wordmark ECON below -->
    <text
      x="160"
      y="350"
      text-anchor="middle"
      fill="#f5f5f4"
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      font-weight="900"
      font-size="60"
      letter-spacing="8"
    >ECON</text>
  </g>
</svg>
  `.trim();
}

async function generate() {
  console.log("Generating PWA & Play Store icons...");

  const standard512Svg = createStandardSvg(512);
  const maskable512Svg = createMaskableSvg(512);

  // Save base SVG
  fs.writeFileSync(path.join(ICONS_DIR, "icon.svg"), standard512Svg, "utf8");
  fs.writeFileSync(path.join(ICONS_DIR, "icon-maskable.svg"), maskable512Svg, "utf8");

  const standardBuffer = Buffer.from(standard512Svg);
  const maskableBuffer = Buffer.from(maskable512Svg);

  // 1. Standard 512x512
  await sharp(standardBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(ICONS_DIR, "icon-512x512.png"));
  console.log("✓ Created icon-512x512.png");

  // 2. Standard 192x192
  await sharp(standardBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(ICONS_DIR, "icon-192x192.png"));
  console.log("✓ Created icon-192x192.png");

  // 3. Maskable 512x512
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(ICONS_DIR, "icon-maskable-512x512.png"));
  console.log("✓ Created icon-maskable-512x512.png");

  // 4. Maskable 192x192
  await sharp(maskableBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(ICONS_DIR, "icon-maskable-192x192.png"));
  console.log("✓ Created icon-maskable-192x192.png");

  // 5. Apple Touch Icon (180x180)
  await sharp(standardBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(ICONS_DIR, "apple-touch-icon.png"));
  console.log("✓ Created apple-touch-icon.png");

  // 6. Favicon 48x48 and 32x32
  await sharp(standardBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(ICONS_DIR, "favicon-48x48.png"));
  await sharp(standardBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(ICONS_DIR, "favicon-32x32.png"));
  
  // Also copy to root public/ for standard browsers
  await sharp(standardBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve(process.cwd(), "public/apple-touch-icon.png"));
  await sharp(standardBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.resolve(process.cwd(), "public/favicon.png"));

  console.log("All PWA icons generated successfully!");
}

generate().catch(console.error);
