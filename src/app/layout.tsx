// =============================================================================
// ConMart — Root Layout
// =============================================================================
// App-wide layout with Geist font family, dark theme by default,
// and SEO metadata for the B2B Construction Marketplace.
// =============================================================================

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
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

export const metadata: Metadata = {
  title: {
    default: "ConMart — B2B Construction Marketplace",
    template: "%s | ConMart",
  },
  description:
    "Industrial-grade B2B marketplace for construction materials. Volume pricing, proforma invoicing, and managed procurement for builders and contractors.",
  keywords: [
    "construction materials",
    "B2B marketplace",
    "building supplies",
    "cement",
    "steel",
    "rebar",
    "aggregates",
    "volume pricing",
    "proforma invoice",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1c22" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
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
  // dynamic rendering, which this app already requires for its authenticated
  // routes; the alternative is a theme flash on every navigation.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
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
        </ThemeProvider>
      </body>
    </html>
  );
}
