// =============================================================================
// ConMart — Root Layout
// =============================================================================
// App-wide layout with Geist font family, dark theme by default,
// and SEO metadata for the B2B Construction Marketplace.
// The `lang` attribute is read server-side from the locale cookie so that
// screen readers and search engines always receive the correct language tag.
// =============================================================================

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers, cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { ToastProvider } from "@/components/ui/toast";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://conmart-ethiopia.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ECON",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  title: {
    default: "ECON — B2B Construction Marketplace Ethiopia",
    template: "%s | ECON",
  },
  description:
    "Ethiopia's B2B marketplace for depot-direct construction materials. Compare wholesale prices, send purchase requests, and get introduced to verified suppliers in Addis Ababa and beyond.",
  keywords: [
    "construction materials Ethiopia",
    "B2B marketplace Addis Ababa",
    "building supplies Ethiopia",
    "cement wholesale Ethiopia",
    "steel rebar Ethiopia",
    "Dangote OPC Addis",
    "aggregates Ethiopia",
    "volume pricing ETB",
    "proforma invoice Ethiopia",
    "building contractor marketplace",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ECON",
    title: "ECON — B2B Construction Marketplace Ethiopia",
    description:
      "Ethiopia's B2B marketplace for depot-direct construction materials. Verified suppliers. Transparent wholesale pricing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ECON — B2B Construction Marketplace",
    description: "Ethiopia's B2B marketplace for depot-direct construction materials.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#272722" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The nonce is minted per request by the proxy. Reading it opts the tree into
  // dynamic rendering, which this app already requires for its authenticated routes.
  const [headersList, cookieStore] = await Promise.all([headers(), cookies()]);
  const nonce = headersList.get("x-nonce") ?? undefined;

  // Read locale server-side so the HTML lang attribute is correct on first render.
  // Screen readers use lang to select the correct voice/pronunciation engine.
  // The client LanguageProvider keeps it in sync on subsequent navigations.
  const savedLocale = cookieStore.get("conmart_locale")?.value;
  const lang = savedLocale === "am" ? "am" : "en";

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      /** Dark theme by default — industrial B2B aesthetic */
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        {/* Applies the stored theme before first paint to avoid a flash of the
            default dark palette for users who chose light mode. */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('conmart_theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Lets a keyboard user reach the page content without tabbing through
            the whole sidebar on every navigation. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-200 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}

