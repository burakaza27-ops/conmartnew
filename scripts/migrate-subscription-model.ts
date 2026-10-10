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
  console.log("Connected to database. Applying safe non-destructive migrations...");

  try {
    // 1. Safe ENUM creations and updates
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
          CREATE TYPE subscription_tier AS ENUM ('BASIC', 'PREMIUM', 'FEATURED');
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplier_lead_event_type') THEN
          CREATE TYPE supplier_lead_event_type AS ENUM ('VIEW', 'CALL_CLICK', 'WHATSAPP_CLICK', 'DIRECTIONS_CLICK', 'AGENT_DELIVERED');
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guided_lead_status') THEN
          CREATE TYPE guided_lead_status AS ENUM ('NEW', 'ASSIGNED', 'GUIDING', 'DELIVERED', 'CLOSED');
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_commission_status') THEN
          CREATE TYPE agent_commission_status AS ENUM ('PENDING', 'DUE', 'PAID', 'VOID');
        END IF;
      END $$;

      ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'EXPIRED';
      ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'PENDING_CONFIRMATION';
    `);

    // 2. Add columns to seller_profiles
    await client.query(`
      ALTER TABLE seller_profiles
        ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'BASIC',
        ADD COLUMN IF NOT EXISTS working_hours text DEFAULT 'Mon - Sat: 8:00 AM - 6:00 PM',
        ADD COLUMN IF NOT EXISTS address text,
        ADD COLUMN IF NOT EXISTS latitude double precision,
        ADD COLUMN IF NOT EXISTS longitude double precision,
        ADD COLUMN IF NOT EXISTS whatsapp_number text,
        ADD COLUMN IF NOT EXISTS direct_phone text,
        ADD COLUMN IF NOT EXISTS reverification_needed boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS last_verified_at timestamp(3) without time zone,
        ADD COLUMN IF NOT EXISTS verification_notes text;
    `);

    // 3. Create subscription_plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id text PRIMARY KEY,
        tier subscription_tier UNIQUE NOT NULL,
        name text NOT NULL,
        price_etb numeric(12,2) NOT NULL,
        duration_days integer DEFAULT 30 NOT NULL,
        description text NOT NULL,
        features jsonb DEFAULT '[]'::jsonb NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 4. Create subscription_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_payments (
        id text PRIMARY KEY,
        seller_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tier subscription_tier NOT NULL,
        amount numeric(12,2) NOT NULL,
        payment_method payment_method DEFAULT 'TELEBIRR' NOT NULL,
        reference_code text NOT NULL,
        slip_url text,
        status wallet_tx_status DEFAULT 'PENDING' NOT NULL,
        reviewed_by text,
        reviewed_at timestamp(3) without time zone,
        notes text,
        created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_subscription_payments_seller ON subscription_payments(seller_id, status);
    `);

    // 5. Create supplier_lead_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_lead_events (
        id text PRIMARY KEY,
        seller_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id text,
        event_type supplier_lead_event_type NOT NULL,
        buyer_phone text,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_supplier_lead_events ON supplier_lead_events(seller_id, event_type, created_at);
    `);

    // 6. Create guided_leads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS guided_leads (
        id text PRIMARY KEY,
        reference_code text UNIQUE NOT NULL,
        material_needed text NOT NULL,
        quantity text NOT NULL,
        area_location text NOT NULL,
        buyer_phone text NOT NULL,
        buyer_name text,
        preferred_visit_time text,
        notes text,
        target_seller_id text REFERENCES users(id) ON DELETE SET NULL,
        assigned_agent_id text REFERENCES users(id) ON DELETE SET NULL,
        status guided_lead_status DEFAULT 'NEW' NOT NULL,
        close_reason text,
        created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_guided_leads_status ON guided_leads(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_guided_leads_agent ON guided_leads(assigned_agent_id, status);
    `);

    // 7. Create agent_commission_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_commission_records (
        id text PRIMARY KEY,
        guided_lead_id text NOT NULL REFERENCES guided_leads(id) ON DELETE CASCADE,
        agent_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fee_amount numeric(12,2) NOT NULL,
        status agent_commission_status DEFAULT 'PENDING' NOT NULL,
        notes text,
        recorded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        paid_at timestamp(3) without time zone
      );
      CREATE INDEX IF NOT EXISTS idx_agent_commissions ON agent_commission_records(agent_id, status);
    `);

    // 8. Seed default subscription plans (Admin Configurable)
    await client.query(`
      INSERT INTO subscription_plans (id, tier, name, price_etb, duration_days, description, features, is_active)
      VALUES
        ('plan_basic', 'BASIC', 'Basic Directory', 1000.00, 30, 'Listing with store name, verified location, working hours, and category in directory.', '["Directory listing", "Working hours & phone display", "Standard search ranking"]', true),
        ('plan_premium', 'PREMIUM', 'Premium Catalog', 2500.00, 30, 'Full product catalog with photo showcase, price ranges, Verified badge, and prioritized search ranking.', '["Full photo catalog", "Price range display", "Verified supplier badge", "Priority search ranking", "Direct WhatsApp & Call buttons"]', true),
        ('plan_featured', 'FEATURED', 'Featured Partner', 4500.00, 30, 'All Premium benefits plus prominent promoted hero and top-of-category placement.', '["Top promoted category placement", "Homepage featured showcase", "Full photo catalog", "Verified supplier badge", "Highest search priority", "Agent lead priority"]', true)
      ON CONFLICT (tier) DO UPDATE SET
        name = EXCLUDED.name,
        price_etb = EXCLUDED.price_etb,
        description = EXCLUDED.description,
        features = EXCLUDED.features;
    `);

    console.log("Safe migration completed successfully! All tables, enums, and plans created.");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
