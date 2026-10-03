// =============================================================================
// ConMart — Robots.txt
// =============================================================================

import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://econ.et");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/buyer", "/buyer/catalog/", "/buyer/category/", "/about", "/login", "/register"],
        disallow: [
          "/seller/",
          "/agent/",
          "/admin/",
          "/account/",
          "/dashboard/",
          "/api/",
          "/buyer/enquiries",
          "/buyer/messages",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
