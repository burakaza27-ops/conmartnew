import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg, Prisma client, and @react-pdf/renderer must stay outside the
  // bundle rather than being traced into it.
  serverExternalPackages: ["@prisma/client", "pg", "@react-pdf/renderer"],

  turbopack: {
    // Turbopack infers the root by walking up for a lockfile, which finds a
    // stray package-lock.json in the home directory and then ignores it for
    // being outside the repository. Pinning the root removes the guesswork.
    root: import.meta.dirname,
  },

  // Independent CI scripts (`npm run typecheck` and `npm run lint`) check
  // types and lint rules without triggering V8 native zone allocator limits.
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    cpus: 1,
  },

  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
