// =============================================================================
// ConMart — Sitemap Generator
// =============================================================================
// Generates sitemap.xml dynamically so category pages and static routes
// are indexed by Google and other search engines.
// =============================================================================

import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://econ.et");

// Static marketing routes that should always be indexed
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/buyer`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/buyer/category/all`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/login`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    url: `${BASE_URL}/register`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.6,
  },
];

// Category slugs to generate deep-linked category pages
const CATEGORY_SLUGS = [
  "cement",
  "steel",
  "aggregates",
  "wood-timber",
  "hollow-blocks",
  "plumbing",
  "electrical",
  "finishing",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryPages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/buyer/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...STATIC_ROUTES, ...categoryPages];
}
