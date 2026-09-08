// =============================================================================
// ConMart — Prisma Client Singleton (Prisma 7+)
// =============================================================================
// Prisma 7 requires a driver adapter for database connections.
// Uses @prisma/adapter-pg for direct PostgreSQL connections via Supabase.
//
// - In development: reuses the instance attached to `globalThis` to survive
//   Next.js hot-reloads without exhausting database connections.
// - In production: creates a single instance per server process.
//
// Usage: import { db } from "@/lib/db"
// =============================================================================

import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import pg from "pg";
import type { ConnectionOptions } from "node:tls";

import { env } from "@/lib/config/env";

/**
 * Declare global variables to hold the Prisma Client and pg.Pool instances.
 * This prevents creating new connections on every hot-reload in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

/**
 * TLS settings for the Postgres connection.
 *
 * Verification is on by default. Supabase and several other managed providers
 * sign their certificates with a private CA, so the certificate has to be
 * supplied through DATABASE_CA_CERT for verification to succeed against them.
 *
 * DATABASE_SSL_NO_VERIFY turns verification off entirely. It exists for local
 * proxies with throwaway self-signed certificates. Enabling it in production
 * lets anyone who can intercept the connection read every query — including
 * the buyer and supplier contact details that sit behind the unlock paywall —
 * so it is refused outside development.
 */
function buildSslConfig(): ConnectionOptions {
  if (env.DATABASE_SSL_NO_VERIFY === "true") {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "DATABASE_SSL_NO_VERIFY cannot be enabled in production. Supply the " +
          "provider's CA certificate through DATABASE_CA_CERT instead."
      );
    }

    console.warn(
      "Database TLS certificate verification is disabled. Acceptable locally; " +
        "set DATABASE_CA_CERT before deploying."
    );

    return { rejectUnauthorized: false };
  }

  return env.DATABASE_CA_CERT
    ? {
        rejectUnauthorized: true,
        // Vercel often stores pasted PEMs with literal `\n` instead of newlines.
        ca: env.DATABASE_CA_CERT.replace(/\\n/g, "\n"),
      }
    : { rejectUnauthorized: true };
}

/** Creates the Prisma client with a singleton pg.Pool underneath. */
function createPrismaClient(): PrismaClient {
  // Prisma needs session-mode Postgres. Supabase transaction pooling (port
  // 6543) drops the connection between statements, which breaks interactive
  // transactions used by wallets, listings, and orders. DATABASE_URL should
  // be the session pooler on port 5432.
  const connectionString = env.DATABASE_URL;

  const pool =
    globalForPrisma.pgPool ??
    new pg.Pool({
      connectionString,
      ssl: buildSslConfig(),
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 10000,
      query_timeout: 10000,
    });

  // Attach error handler to prevent unhandled node-pg crash on idle connection drops
  pool.on("error", (err) => {
    console.error("Non-fatal pg.Pool idle connection event (recovered):", err?.message || err);
  });

  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getClient(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

/**
 * Singleton Prisma Client, created on first use and reused on `globalThis`
 * across warm serverless invocations and development hot-reloads.
 *
 * Construction is deferred behind a proxy because importing this module must
 * not open a connection. `next build` evaluates every route module to collect
 * its configuration, so an eagerly-created pool made the build validate TLS
 * settings and dial the database — which fails on a build machine that has no
 * network path to it. Deferring also means a route that never queries anything
 * does not hold a connection from the pool.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property);

    // Methods are bound to the real client: `this` inside Prisma's internals
    // must be the client, not this proxy.
    return typeof value === "function" ? value.bind(client) : value;
  },

  has(_target, property) {
    return property in getClient();
  },
});

