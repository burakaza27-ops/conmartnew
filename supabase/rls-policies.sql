-- =============================================================================
-- ConMart — Row Level Security (RLS) Policies
-- =============================================================================
-- These policies must be applied AFTER Prisma migrations create the tables.
-- They enforce strict data isolation between BUYER, SELLER, and ADMIN roles.
--
-- IMPORTANT: Supabase Auth user ID is stored in `auth.uid()`.
-- Our `users` table links to it via the `auth_id` column.
-- =============================================================================

-- =============================================================================
-- HELPER: Create a function to get the user's role from their auth_id.
-- This avoids repeated subqueries in every policy.
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
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile.
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth_id = auth.uid()::text);

-- Admins can read all user profiles (needed for order detail views).
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (public.get_user_role() = 'ADMIN');

-- Users can update their own profile (name, phone, company).
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth_id = auth.uid()::text)
  WITH CHECK (auth_id = auth.uid()::text);

-- Insert is handled by the post-signup hook (service role key), not RLS.
-- We allow insert so the signup trigger can create the row.
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (auth_id = auth.uid()::text);

-- =============================================================================
-- TABLE: categories
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read categories (public catalog data).
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT
  USING (true);

-- Only Admins can insert/update/delete categories.
CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE
  USING (public.get_user_role() = 'ADMIN');

-- =============================================================================
-- TABLE: products
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read products (public catalog data).
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT
  USING (true);

-- Only Admins can manage products.
CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE
  USING (public.get_user_role() = 'ADMIN');

-- =============================================================================
-- TABLE: listings
-- =============================================================================
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read active listings (buyer catalog).
CREATE POLICY "listings_select_active" ON public.listings
  FOR SELECT
  USING (active = true);

-- Sellers can also see their OWN inactive listings.
CREATE POLICY "listings_select_own_seller" ON public.listings
  FOR SELECT
  USING (seller_id = public.get_user_id());

-- Admins can see all listings regardless of active status.
CREATE POLICY "listings_select_admin" ON public.listings
  FOR SELECT
  USING (public.get_user_role() = 'ADMIN');

-- Sellers can insert listings (they own them).
CREATE POLICY "listings_insert_seller" ON public.listings
  FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'SELLER'
    AND seller_id = public.get_user_id()
  );

-- Sellers can update their own listings.
CREATE POLICY "listings_update_own_seller" ON public.listings
  FOR UPDATE
  USING (seller_id = public.get_user_id())
  WITH CHECK (seller_id = public.get_user_id());

-- Sellers can delete their own listings.
CREATE POLICY "listings_delete_own_seller" ON public.listings
  FOR DELETE
  USING (seller_id = public.get_user_id());

-- Admins can manage all listings.
CREATE POLICY "listings_insert_admin" ON public.listings
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "listings_update_admin" ON public.listings
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "listings_delete_admin" ON public.listings
  FOR DELETE
  USING (public.get_user_role() = 'ADMIN');

-- =============================================================================
-- TABLE: price_tiers
-- =============================================================================
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone can read price tiers (needed for the buyer pricing calculator).
CREATE POLICY "price_tiers_select_all" ON public.price_tiers
  FOR SELECT
  USING (true);

-- Sellers can insert price tiers for their own listings only.
CREATE POLICY "price_tiers_insert_seller" ON public.price_tiers
  FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'SELLER'
    AND listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = public.get_user_id()
    )
  );

-- Sellers can update price tiers for their own listings.
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

-- Sellers can delete price tiers for their own listings.
CREATE POLICY "price_tiers_delete_seller" ON public.price_tiers
  FOR DELETE
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = public.get_user_id()
    )
  );

-- Admins can manage all price tiers.
CREATE POLICY "price_tiers_insert_admin" ON public.price_tiers
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "price_tiers_update_admin" ON public.price_tiers
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "price_tiers_delete_admin" ON public.price_tiers
  FOR DELETE
  USING (public.get_user_role() = 'ADMIN');

-- =============================================================================
-- TABLE: orders
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders.
CREATE POLICY "orders_select_buyer" ON public.orders
  FOR SELECT
  USING (buyer_id = public.get_user_id());

-- Sellers can view orders placed against their listings.
CREATE POLICY "orders_select_seller" ON public.orders
  FOR SELECT
  USING (seller_id = public.get_user_id());

-- Admins can view all orders.
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT
  USING (public.get_user_role() = 'ADMIN');

-- Buyers can insert their own orders via server actions.
CREATE POLICY "orders_insert_buyer" ON public.orders
  FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'BUYER'
    AND buyer_id = public.get_user_id()
  );

-- Only Admins can update order status (advance the state machine).
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- Orders should never be deleted — no delete policy.
-- If soft-delete is needed in the future, add a `deleted_at` column.

-- =============================================================================
-- TABLE: app_notifications
-- =============================================================================
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT/LISTEN their own notifications.
CREATE POLICY "notifications_select_own" ON public.app_notifications
  FOR SELECT
  USING (user_id = public.get_user_id());

-- Users can only UPDATE their own notifications (e.g. marking read).
CREATE POLICY "notifications_update_own" ON public.app_notifications
  FOR UPDATE
  USING (user_id = public.get_user_id())
  WITH CHECK (user_id = public.get_user_id());

-- Only the server (service role) creates notifications.
-- Direct client inserts are rejected by RLS.

