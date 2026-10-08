-- =============================================================================
-- ConMart — Row Level Security (RLS) Policies
-- =============================================================================
-- Apply AFTER Prisma migrations create the tables:
--
--   psql "$DATABASE_URL" -f supabase/rls-policies.sql
--
-- The Next.js app talks to Postgres via Prisma (bypasses RLS). These policies
-- are the backstop if anyone queries with the Supabase anon key / PostgREST.
-- Money, chat, and introductions have NO client write policies — only the
-- service role (or Prisma) may mutate them.
--
-- IMPORTANT: Supabase Auth user ID is stored in `auth.uid()`.
-- Our `users` table links to it via the `auth_id` column.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS text AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- TABLE: users
-- Role and auth_id cannot be changed by the account holder.
-- Public insert may only create BUYER or SELLER rows for the caller's auth id.
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth_id = auth.uid()::text);

DROP POLICY IF EXISTS "users_select_admin" ON public.users;
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth_id = auth.uid()::text)
  WITH CHECK (
    auth_id = auth.uid()::text
    AND role = (SELECT u.role FROM public.users u WHERE u.auth_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (
    auth_id = auth.uid()::text
    AND role IN ('BUYER', 'SELLER')
  );

-- =============================================================================
-- TABLE: categories / products / listings / price_tiers  (catalog)
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (public.get_user_role() = 'ADMIN');

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_all" ON public.products;
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE USING (public.get_user_role() = 'ADMIN');

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_active" ON public.listings;
CREATE POLICY "listings_select_active" ON public.listings
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "listings_select_own_seller" ON public.listings;
CREATE POLICY "listings_select_own_seller" ON public.listings
  FOR SELECT USING (seller_id = public.get_user_id());

DROP POLICY IF EXISTS "listings_select_admin" ON public.listings;
CREATE POLICY "listings_select_admin" ON public.listings
  FOR SELECT USING (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "listings_insert_seller" ON public.listings;
CREATE POLICY "listings_insert_seller" ON public.listings
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'SELLER'
    AND seller_id = public.get_user_id()
  );

DROP POLICY IF EXISTS "listings_update_own_seller" ON public.listings;
CREATE POLICY "listings_update_own_seller" ON public.listings
  FOR UPDATE
  USING (seller_id = public.get_user_id())
  WITH CHECK (seller_id = public.get_user_id());

DROP POLICY IF EXISTS "listings_delete_own_seller" ON public.listings;
CREATE POLICY "listings_delete_own_seller" ON public.listings
  FOR DELETE USING (seller_id = public.get_user_id());

DROP POLICY IF EXISTS "listings_insert_admin" ON public.listings;
CREATE POLICY "listings_insert_admin" ON public.listings
  FOR INSERT WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "listings_update_admin" ON public.listings;
CREATE POLICY "listings_update_admin" ON public.listings
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "listings_delete_admin" ON public.listings;
CREATE POLICY "listings_delete_admin" ON public.listings
  FOR DELETE USING (public.get_user_role() = 'ADMIN');

ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_tiers_select_all" ON public.price_tiers;
CREATE POLICY "price_tiers_select_all" ON public.price_tiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "price_tiers_insert_seller" ON public.price_tiers;
CREATE POLICY "price_tiers_insert_seller" ON public.price_tiers
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'SELLER'
    AND listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = public.get_user_id()
    )
  );

DROP POLICY IF EXISTS "price_tiers_update_seller" ON public.price_tiers;
CREATE POLICY "price_tiers_update_seller" ON public.price_tiers
  FOR UPDATE
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = public.get_user_id()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = public.get_user_id()
    )
  );

DROP POLICY IF EXISTS "price_tiers_delete_seller" ON public.price_tiers;
CREATE POLICY "price_tiers_delete_seller" ON public.price_tiers
  FOR DELETE USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = public.get_user_id()
    )
  );

DROP POLICY IF EXISTS "price_tiers_insert_admin" ON public.price_tiers;
CREATE POLICY "price_tiers_insert_admin" ON public.price_tiers
  FOR INSERT WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "price_tiers_update_admin" ON public.price_tiers;
CREATE POLICY "price_tiers_update_admin" ON public.price_tiers
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "price_tiers_delete_admin" ON public.price_tiers;
CREATE POLICY "price_tiers_delete_admin" ON public.price_tiers
  FOR DELETE USING (public.get_user_role() = 'ADMIN');

-- =============================================================================
-- LEGACY ORDERS (quotes / proforma — new work belongs on enquiries)
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_buyer" ON public.orders;
CREATE POLICY "orders_select_buyer" ON public.orders
  FOR SELECT USING (buyer_id = public.get_user_id());

DROP POLICY IF EXISTS "orders_select_seller" ON public.orders;
CREATE POLICY "orders_select_seller" ON public.orders
  FOR SELECT USING (seller_id = public.get_user_id());

DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "orders_insert_buyer" ON public.orders;
CREATE POLICY "orders_insert_buyer" ON public.orders
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'BUYER'
    AND buyer_id = public.get_user_id()
  );

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_party" ON public.order_items;
CREATE POLICY "order_items_select_party" ON public.order_items
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    OR order_id IN (
      SELECT id FROM public.orders
      WHERE buyer_id = public.get_user_id() OR seller_id = public.get_user_id()
    )
  );

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.app_notifications;
CREATE POLICY "notifications_select_own" ON public.app_notifications
  FOR SELECT USING (user_id = public.get_user_id());

DROP POLICY IF EXISTS "notifications_update_own" ON public.app_notifications;
CREATE POLICY "notifications_update_own" ON public.app_notifications
  FOR UPDATE
  USING (user_id = public.get_user_id())
  WITH CHECK (user_id = public.get_user_id());

-- =============================================================================
-- MONEY, INTRODUCTIONS, CHAT — enable RLS, SELECT for parties, no client writes
-- =============================================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (
    seller_id = public.get_user_id() OR public.get_user_role() = 'ADMIN'
  );

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallet_tx_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_tx_select_own" ON public.wallet_transactions
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    OR wallet_id IN (SELECT id FROM public.wallets WHERE seller_id = public.get_user_id())
  );

ALTER TABLE public.top_up_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "topups_select_own" ON public.top_up_requests;
CREATE POLICY "topups_select_own" ON public.top_up_requests
  FOR SELECT USING (
    seller_id = public.get_user_id() OR public.get_user_role() = 'ADMIN'
  );

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enquiries_select_party" ON public.enquiries;
CREATE POLICY "enquiries_select_party" ON public.enquiries
  FOR SELECT USING (
    buyer_id = public.get_user_id()
    OR seller_id = public.get_user_id()
    OR agent_id = public.get_user_id()
    OR public.get_user_role() = 'ADMIN'
  );

ALTER TABLE public.unlock_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unlocks_select_party" ON public.unlock_records;
CREATE POLICY "unlocks_select_party" ON public.unlock_records
  FOR SELECT USING (
    buyer_id = public.get_user_id()
    OR seller_id = public.get_user_id()
    OR public.get_user_role() = 'ADMIN'
  );

ALTER TABLE public.dispute_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "disputes_select_party" ON public.dispute_cases;
CREATE POLICY "disputes_select_party" ON public.dispute_cases
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    OR enquiry_id IN (
      SELECT id FROM public.enquiries
      WHERE buyer_id = public.get_user_id() OR seller_id = public.get_user_id()
    )
  );

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_profiles_select" ON public.seller_profiles;
CREATE POLICY "seller_profiles_select" ON public.seller_profiles
  FOR SELECT USING (
    user_id = public.get_user_id() OR public.get_user_role() = 'ADMIN' OR true
  );

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_profiles_select_own" ON public.agent_profiles;
CREATE POLICY "agent_profiles_select_own" ON public.agent_profiles
  FOR SELECT USING (
    user_id = public.get_user_id() OR public.get_user_role() = 'ADMIN'
  );

ALTER TABLE public.deal_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deal_tickets_select_party" ON public.deal_tickets;
CREATE POLICY "deal_tickets_select_party" ON public.deal_tickets
  FOR SELECT USING (
    buyer_id = public.get_user_id()
    OR seller_id = public.get_user_id()
    OR agent_id = public.get_user_id()
    OR public.get_user_role() IN ('ADMIN', 'FIELD_AGENT')
  );

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commissions_select_party" ON public.commissions;
CREATE POLICY "commissions_select_party" ON public.commissions
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    OR ticket_id IN (
      SELECT id FROM public.deal_tickets WHERE agent_id = public.get_user_id()
    )
  );

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_rooms_select_party" ON public.chat_rooms;
CREATE POLICY "chat_rooms_select_party" ON public.chat_rooms
  FOR SELECT USING (
    buyer_id = public.get_user_id()
    OR seller_id = public.get_user_id()
    OR agent_id = public.get_user_id()
    OR public.get_user_role() = 'ADMIN'
  );

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_messages_select_party" ON public.chat_messages;
CREATE POLICY "chat_messages_select_party" ON public.chat_messages
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    OR room_id IN (
      SELECT id FROM public.chat_rooms
      WHERE buyer_id = public.get_user_id()
        OR seller_id = public.get_user_id()
        OR agent_id = public.get_user_id()
    )
  );

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (
    referrer_id = public.get_user_id()
    OR referred_id = public.get_user_id()
    OR public.get_user_role() = 'ADMIN'
  );

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "zones_select_all" ON public.zones;
CREATE POLICY "zones_select_all" ON public.zones
  FOR SELECT USING (true);
