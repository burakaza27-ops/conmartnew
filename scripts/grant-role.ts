// =============================================================================
// ConMart — Role Grant CLI
// =============================================================================
// ADMIN cannot be chosen at sign-up. FIELD_AGENT can self-register, but this
// script still promotes an existing account when operations needs to.
//
// Usage:
//   npx tsx scripts/grant-role.ts <email> <BUYER|SELLER|ADMIN|FIELD_AGENT> [zone-slug]
//
// The account must already exist: register normally through the web form
// first, then promote it. For FIELD_AGENT, pass a coverage slug such as
// `koye-feche` or `bole`. Defaults to the nationwide fallback.
// =============================================================================

import dotenv from "dotenv";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const VALID_ROLES = Object.values(UserRole);

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [email, requestedRole, zoneSlug] = process.argv.slice(2);

  if (!email || !requestedRole) {
    fail(
      "Usage: npx tsx scripts/grant-role.ts <email> <role> [zone-slug]\n" +
        `  Roles: ${VALID_ROLES.join(", ")}`
    );
  }

  if (!VALID_ROLES.includes(requestedRole as UserRole)) {
    fail(`"${requestedRole}" is not a role. Choose one of: ${VALID_ROLES.join(", ")}`);
  }

  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!databaseUrl) {
    fail("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    fail(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to " +
        "look up an account by email. Find the service role key under " +
        "Project Settings > API in the Supabase dashboard."
    );
  }

  // Email lives in Supabase Auth, not in the `users` table, so the auth ID has
  // to be resolved through the admin API before the role can be updated.
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    fail(`Could not query Supabase Auth: ${error.message}`);
  }

  const authUser = data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  if (!authUser) {
    fail(
      `No Supabase Auth account found for ${email}. Register through /register first, ` +
        "then run this script to promote the account."
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

  try {
    const existing = await prisma.user.findUnique({
      where: { authId: authUser.id },
      select: { id: true, role: true, name: true },
    });

    if (!existing) {
      fail(
        `${email} has an auth account but no ConMart profile. Sign in once to ` +
          "complete registration, then re-run this script."
      );
    }

    if (existing.role === requestedRole && requestedRole !== "FIELD_AGENT") {
      console.log(`\n  ${email} is already ${requestedRole}. Nothing to do.\n`);
      return;
    }

    if (requestedRole === "FIELD_AGENT") {
      const slug = zoneSlug?.trim() || "ethiopia";
      const zone = await prisma.zone.findUnique({
        where: { slug },
        select: { id: true, name: true },
      });
      if (!zone) {
        fail(
          `No coverage area with slug "${slug}". Seed coverage areas first, then retry.`
        );
      }

      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "FIELD_AGENT" },
      });
      await prisma.agentProfile.upsert({
        where: { userId: existing.id },
        update: { zoneId: zone.id, isActive: true },
        create: { userId: existing.id, zoneId: zone.id, isActive: true },
      });

      console.log(
        `\n  ${existing.name} <${email}>: ${existing.role} -> FIELD_AGENT (${zone.name})\n` +
          "  The change takes effect on their next request; roles are read from the\n" +
          "  database on every authorization check, so no re-login is needed.\n"
      );
      return;
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { role: requestedRole as UserRole },
    });

    console.log(
      `\n  ${existing.name} <${email}>: ${existing.role} -> ${requestedRole}\n` +
        "  The change takes effect on their next request; roles are read from the\n" +
        "  database on every authorization check, so no re-login is needed.\n"
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
