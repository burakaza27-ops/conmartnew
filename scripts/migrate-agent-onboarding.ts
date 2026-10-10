import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database. Applying 01B Agent Onboarding migrations...");

  try {
    // 1. Create Enums if not exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_approval_status') THEN
          CREATE TYPE agent_approval_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUIRED', 'REJECTED', 'SUSPENDED');
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guarantor_type') THEN
          CREATE TYPE guarantor_type AS ENUM ('GOVERNMENT_EMPLOYEE', 'COMMUNITY_OR_OTHER');
        END IF;
      END $$;
    `);

    // 2. Add columns to agent_profiles
    await client.query(`
      ALTER TABLE agent_profiles
        ADD COLUMN IF NOT EXISTS approval_status agent_approval_status DEFAULT 'SUBMITTED',
        ADD COLUMN IF NOT EXISTS rejection_reason text,
        ADD COLUMN IF NOT EXISTS reviewed_by text,
        ADD COLUMN IF NOT EXISTS reviewed_at timestamp(3) without time zone,
        ADD COLUMN IF NOT EXISTS city text DEFAULT 'Addis Ababa',
        ADD COLUMN IF NOT EXISTS sub_city text,
        ADD COLUMN IF NOT EXISTS grade12_doc_url text,
        ADD COLUMN IF NOT EXISTS identity_doc_url text,
        ADD COLUMN IF NOT EXISTS service_area text,
        ADD COLUMN IF NOT EXISTS latitude double precision,
        ADD COLUMN IF NOT EXISTS longitude double precision,
        ADD COLUMN IF NOT EXISTS travel_radius_km double precision DEFAULT 5.0,
        ADD COLUMN IF NOT EXISTS available_days_hours text DEFAULT 'Mon - Fri, 9:00 - 17:00',
        ADD COLUMN IF NOT EXISTS is_available_for_assignments boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS guarantor_type guarantor_type DEFAULT 'GOVERNMENT_EMPLOYEE',
        ADD COLUMN IF NOT EXISTS guarantor_name text,
        ADD COLUMN IF NOT EXISTS guarantor_phone text,
        ADD COLUMN IF NOT EXISTS guarantor_employer text,
        ADD COLUMN IF NOT EXISTS guarantor_relationship text,
        ADD COLUMN IF NOT EXISTS guarantor_doc_url text,
        ADD COLUMN IF NOT EXISTS guarantor_description text,
        ADD COLUMN IF NOT EXISTS guarantor_consent_obtained boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS checklist_phone_verified boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS checklist_grade12_reviewed boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS checklist_identity_reviewed boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS checklist_guarantee_verified boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS checklist_area_confirmed boolean DEFAULT false;
    `);

    // 3. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS agent_profiles_approval_status_is_available_idx 
      ON agent_profiles (approval_status, is_available_for_assignments);
    `);

    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate();
