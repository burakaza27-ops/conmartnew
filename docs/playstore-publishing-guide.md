# Google Play Store Publishing Guide — ECON (ConMart)

This document provides complete, step-by-step instructions for publishing the **ECON (B2B Construction Marketplace)** app to the **Google Play Store** as a verified **Trusted Web Activity (TWA)**.

---

## Architecture Overview

Google officially supports deploying Progressive Web Apps directly to the Google Play Store using **Trusted Web Activity (TWA)**:
- **Zero URL Bar / Full Native Experience**: The browser bar is completely hidden. It launches in full-screen standalone mode identical to an APK written in Kotlin/Java.
- **Single Codebase**: All features, real-time updates, price changes, and bug fixes deployed to your web server immediately appear inside the installed Play Store app without having to wait for Google app reviews!
- **Play Store Installability**: Users discover and install ECON directly from Google Play Store with icon, reviews, and updates.
- **Offline & Low Connectivity Support**: When contractors or site engineers are in underground parking garages or low-signal construction zones, the included Service Worker (`/sw.js`) serves cached resources and displays the offline rescue screen (`/offline`).

---

## Prerequisites

1. **Google Play Console Account**: $25 one-time registration fee at [play.google.com/console](https://play.google.com/console).
2. **Production Domain with HTTPS**: Your deployed site (e.g. `https://conmart-ethiopia.com` or Vercel production URL).
3. **Java Development Kit (JDK 17+)** & **Node.js 18+**.

---

## Method 1: 2-Minute Packaging via Bubblewrap (Official Google Tool)

Google maintains **Bubblewrap** (`@bubblewrap/cli`), an automated tool that takes `manifest.json` and produces a signed Android App Bundle (`.aab`) ready for Google Play.

### Step 1: Install Bubblewrap CLI
Open your terminal and run:
```bash
npm install -g @bubblewrap/cli
```

### Step 2: Initialize & Build
In your repository directory (where `twa-manifest.json` is already created):
```bash
# Verify bubblewrap environment
bubblewrap doctor

# Build the signed Android App Bundle (.aab)
bubblewrap build
```
During the first build, Bubblewrap will prompt you to create or select a signing keystore:
- Keystore path: `android.keystore` (keep this safe and backed up!)
- Password: Choose a strong password.
- Key alias: `econ-playstore`

Bubblewrap will output:
- `app-release-bundle.aab` — The production file to upload to Google Play Console.
- Your **SHA-256 Fingerprint** (needed for Step 3).

---

## Method 2: Instant No-Code Packaging via PWABuilder (Microsoft/Google)

If you prefer a web-based GUI:
1. Go to [pwabuilder.com](https://www.pwabuilder.com).
2. Enter your live production URL (e.g. `https://your-domain.com`).
3. Click **Package For Stores** > **Android**.
4. Set Package ID to `com.econ.marketplace`.
5. Click **Generate Package**.
6. Download the zip file containing `app-release.aab` and your signing credentials.

---

## Step 3: Domain Verification (`assetlinks.json`)

To remove the browser address bar in the Play Store app, Google verifies domain ownership via Digital Asset Links:

1. Obtain your **SHA-256 Fingerprint**:
   - From Google Play Console: **Setup** > **App Integrity** > **App signing key certificate** > copy the `SHA-256 fingerprint`.
2. Open `public/.well-known/assetlinks.json` in this repo:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.econ.marketplace",
      "sha256_cert_fingerprints": [
        "PASTE_YOUR_COPIED_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```
3. Deploy to production so that visiting `https://your-domain.com/.well-known/assetlinks.json` returns this JSON file with `Content-Type: application/json`.
4. Test verification at: [Google Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator).

---

## Step 4: Google Play Console Store Listing

In the Google Play Console:

### 1. App Details
- **App Name**: `ECON — B2B Construction Materials`
- **Short Description (80 chars)**: `Wholesale construction materials & verified suppliers in Addis Ababa, Ethiopia.`
- **Full Description**:
  ```
  ECON (ConMart) is Ethiopia's premier B2B marketplace for depot-direct construction materials.

  Designed specifically for general contractors, site engineers, real estate developers, and building material suppliers:
  • Real-time Depot Pricing: Compare live wholesale prices for cement, rebar, structural steel, aggregates, and finishing supplies.
  • Volume RFQs & Proforma Invoices: Post purchase requests directly to verified suppliers across Addis Ababa and regional distribution hubs.
  • Secure Milestone Verification: Track orders, dispatch schedules, and delivery confirmations with complete audit trails.
  • Bilingual Interface: Built for Ethiopian workflows with seamless Amharic and English support.
  • Low-Signal Site Mode: Optimized for offline and low-bandwidth use in remote quarries and underground site excavations.
  ```

### 2. Category & Tags
- **Category**: Business
- **Secondary Category**: Shopping / Industrial Supplies
- **Tags**: Construction, B2B, Marketplace, Materials, Invoicing

### 3. Store Assets (Provided in `public/icons/`)
- **App Icon**: `public/icons/icon-512x512.png` (512x512 32-bit PNG)
- **Feature Graphic**: 1024 x 500 banner (can be generated using brand colors `#272722` & amber `#f59e0b`)
- **Phone Screenshots**: Minimum 2 phone screenshots (e.g. Marketplace view, Product detail view, Request RFQ form).

### 4. App Content & Policies
- **Target Audience**: 18+ (Business & Commercial)
- **Data Safety**:
  - Personal info: Name, phone number, company name (for account and invoice creation).
  - Financial info: Transaction and order history (no credit card numbers stored on device).
  - Network: Data transmitted over HTTPS (SSL).
- **Privacy Policy URL**: `https://your-domain.com/privacy`

---

## Step 5: Release & Rollout

1. Go to **Release** > **Production**.
2. Click **Create new release**.
3. Upload `app-release-bundle.aab`.
4. Add release notes:
   - `Initial release of ECON: B2B Construction Marketplace Ethiopia.`
5. Click **Save** > **Review release** > **Start rollout to Production**.

Google typically reviews the app within 24 to 72 hours. Once approved, ECON will be live and downloadable on Google Play Store!
