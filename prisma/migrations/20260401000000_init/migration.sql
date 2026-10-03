-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'FIELD_AGENT');

-- CreateEnum
CREATE TYPE "seller_type" AS ENUM ('FACTORY', 'IMPORTER', 'WHOLESALER', 'RETAILER', 'RENTAL');

-- CreateEnum
CREATE TYPE "seller_verification_status" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "product_unit" AS ENUM ('BAG', 'QUINTAL', 'TON', 'PIECE', 'M3');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('GENERATED', 'CALL_RECEIVED', 'PROCURED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "enquiry_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'COMPLETED', 'FAILED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "delivery_preference" AS ENUM ('SELLER_DELIVERED', 'SELF_COLLECT', 'PLATFORM_ARRANGED');

-- CreateEnum
CREATE TYPE "delivery_price_type" AS ENUM ('EX_WORKS', 'DELIVERED');

-- CreateEnum
CREATE TYPE "stock_state" AS ENUM ('IN_STOCK', 'LIMITED', 'ON_ORDER');

-- CreateEnum
CREATE TYPE "wallet_tx_type" AS ENUM ('TOP_UP', 'UNLOCK_FEE', 'REFUND_CREDIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "wallet_tx_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('TELEBIRR', 'CBE_BANK', 'AWASH_BANK', 'CASH_DEPOSIT');

-- CreateEnum
CREATE TYPE "outcome_type" AS ENUM ('SUCCESS', 'FAILURE', 'PENDING');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('NONE', 'REQUESTED', 'REFUNDED_CREDIT', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "dispute_claim_type" AS ENUM ('SHORTAGE', 'DAMAGE', 'WRONG_SPECIFICATION', 'NON_DELIVERY', 'NON_PAYMENT');

-- CreateEnum
CREATE TYPE "dispute_status" AS ENUM ('OPEN', 'MEDIATING', 'RESOLVED_SELLER_CREDIT', 'RESOLVED_NO_REFUND', 'CLOSED');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('FREE', 'ACTIVE');

-- CreateEnum
CREATE TYPE "deal_ticket_status" AS ENUM ('PENDING_AGENT', 'AGENT_ASSIGNED', 'IN_INSPECTION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "chat_room_type" AS ENUM ('DIRECT', 'BUYER_AGENT', 'SELLER_AGENT');

-- CreateEnum
CREATE TYPE "commission_payout_status" AS ENUM ('PENDING', 'DUE', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('ENQUIRY_RECEIVED', 'ENQUIRY_ACCEPTED', 'ENQUIRY_DECLINED', 'WALLET_TOPPED_UP', 'DEAL_STATUS_CHANGED', 'MESSAGE_RECEIVED', 'DEAL_FAILURE_REFUND');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth_id" TEXT,
    "role" "user_role" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seller_type" "seller_type" NOT NULL DEFAULT 'RETAILER',
    "verification_status" "seller_verification_status" NOT NULL DEFAULT 'UNVERIFIED',
    "license_number" TEXT,
    "tin_number" TEXT,
    "vat_number" TEXT,
    "vat_registered" BOOLEAN NOT NULL DEFAULT false,
    "license_expiry" TIMESTAMP(3),
    "tin_expiry" TIMESTAMP(3),
    "response_time_avg_minutes" INTEGER NOT NULL DEFAULT 60,
    "completed_deals_count" INTEGER NOT NULL DEFAULT 0,
    "failed_deals_count" INTEGER NOT NULL DEFAULT 0,
    "subscription_status" "subscription_status" NOT NULL DEFAULT 'FREE',
    "subscription_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "cash_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "credit_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "wallet_tx_type" NOT NULL,
    "status" "wallet_tx_status" NOT NULL DEFAULT 'COMPLETED',
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "balance_after_cash" DECIMAL(12,2) NOT NULL,
    "balance_after_credit" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_up_requests" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "payment_method" NOT NULL DEFAULT 'TELEBIRR',
    "reference_code" TEXT NOT NULL,
    "slip_url" TEXT,
    "status" "wallet_tx_status" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_up_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon_name" TEXT NOT NULL,
    "image_url" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "unlock_fee" DECIMAL(12,2) NOT NULL DEFAULT 250.00,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB DEFAULT '[]',

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unit" "product_unit" NOT NULL,
    "image_url" TEXT,
    "specs" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT NOT NULL,
    "image_url" TEXT,
    "delivery_type" "delivery_price_type" NOT NULL DEFAULT 'EX_WORKS',
    "loading_included" BOOLEAN NOT NULL DEFAULT false,
    "unloading_included" BOOLEAN NOT NULL DEFAULT false,
    "loading_charge" DECIMAL(12,2),
    "unloading_charge" DECIMAL(12,2),
    "waiting_charge_per_hour" DECIMAL(12,2),
    "stock_state" "stock_state" NOT NULL DEFAULT 'IN_STOCK',
    "available_qty" INTEGER,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_tiers" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "min_qty" INTEGER NOT NULL,
    "max_qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "reference_code" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit" "product_unit" NOT NULL,
    "delivery_preference" "delivery_preference" NOT NULL DEFAULT 'SELLER_DELIVERED',
    "delivery_address" TEXT NOT NULL,
    "access_constraints" TEXT,
    "required_date" TIMESTAMP(3),
    "status" "enquiry_status" NOT NULL DEFAULT 'PENDING',
    "agent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlock_records" (
    "id" TEXT NOT NULL,
    "enquiry_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "fee_amount" DECIMAL(12,2) NOT NULL,
    "paid_from_cash" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "paid_from_credit" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seller_reported_outcome" "outcome_type" NOT NULL DEFAULT 'PENDING',
    "buyer_outcome_response" "outcome_type" NOT NULL DEFAULT 'PENDING',
    "refund_status" "refund_status" NOT NULL DEFAULT 'NONE',
    "refund_credit_amount" DECIMAL(12,2),

    CONSTRAINT "unlock_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_cases" (
    "id" TEXT NOT NULL,
    "enquiry_id" TEXT NOT NULL,
    "unlock_record_id" TEXT NOT NULL,
    "raised_by" "user_role" NOT NULL,
    "claim_type" "dispute_claim_type" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" JSONB NOT NULL DEFAULT '[]',
    "status" "dispute_status" NOT NULL DEFAULT 'OPEN',
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "dispute_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "reference_code" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT,
    "listing_id" TEXT,
    "qty" INTEGER,
    "base_subtotal" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'GENERATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "district_id" TEXT,
    "aliases" TEXT[],
    "region" TEXT NOT NULL DEFAULT 'Ethiopia',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "min_lat" DECIMAL(9,6),
    "min_lng" DECIMAL(9,6),
    "max_lat" DECIMAL(9,6),
    "max_lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_tickets" (
    "id" TEXT NOT NULL,
    "reference_code" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "zone_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "enquiry_id" TEXT,
    "status" "deal_ticket_status" NOT NULL DEFAULT 'PENDING_AGENT',
    "order_total" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "buyer_briefing" TEXT,
    "claimed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "deal_ticket_id" TEXT NOT NULL,
    "order_total" DECIMAL(12,2) NOT NULL,
    "total_fee_percent" DECIMAL(5,2) NOT NULL,
    "platform_share_percent" DECIMAL(5,2) NOT NULL,
    "agent_share_percent" DECIMAL(5,2) NOT NULL,
    "platform_amount" DECIMAL(12,2) NOT NULL,
    "agent_amount" DECIMAL(12,2) NOT NULL,
    "payout_status" "commission_payout_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "type" "chat_room_type" NOT NULL,
    "buyer_id" TEXT,
    "seller_id" TEXT,
    "agent_id" TEXT,
    "deal_ticket_id" TEXT,
    "enquiry_id" TEXT,
    "listing_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "meta" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_user_id_key" ON "seller_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_seller_id_key" ON "wallets"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "listings_seller_id_active_idx" ON "listings"("seller_id", "active");

-- CreateIndex
CREATE INDEX "listings_product_id_active_idx" ON "listings"("product_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_reference_code_key" ON "enquiries"("reference_code");

-- CreateIndex
CREATE INDEX "enquiries_seller_id_status_created_at_idx" ON "enquiries"("seller_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "enquiries_buyer_id_status_created_at_idx" ON "enquiries"("buyer_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "enquiries_agent_id_status_idx" ON "enquiries"("agent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "unlock_records_enquiry_id_key" ON "unlock_records"("enquiry_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_code_key" ON "orders"("reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "zones_slug_key" ON "zones"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_user_id_key" ON "agent_profiles"("user_id");

-- CreateIndex
CREATE INDEX "agent_profiles_zone_id_is_active_idx" ON "agent_profiles"("zone_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "deal_tickets_reference_code_key" ON "deal_tickets"("reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "deal_tickets_enquiry_id_key" ON "deal_tickets"("enquiry_id");

-- CreateIndex
CREATE INDEX "deal_tickets_zone_id_status_idx" ON "deal_tickets"("zone_id", "status");

-- CreateIndex
CREATE INDEX "deal_tickets_buyer_id_seller_id_status_idx" ON "deal_tickets"("buyer_id", "seller_id", "status");

-- CreateIndex
CREATE INDEX "deal_tickets_agent_id_status_idx" ON "deal_tickets"("agent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_deal_ticket_id_key" ON "commissions"("deal_ticket_id");

-- CreateIndex
CREATE INDEX "chat_rooms_buyer_id_updated_at_idx" ON "chat_rooms"("buyer_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_rooms_seller_id_updated_at_idx" ON "chat_rooms"("seller_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_rooms_agent_id_updated_at_idx" ON "chat_rooms"("agent_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_type_buyer_id_seller_id_key" ON "chat_rooms"("type", "buyer_id", "seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_deal_ticket_id_type_key" ON "chat_rooms"("deal_ticket_id", "type");

-- CreateIndex
CREATE INDEX "chat_messages_room_id_created_at_idx" ON "chat_messages"("room_id", "created_at");

-- CreateIndex
CREATE INDEX "app_notifications_user_id_read_at_created_at_idx" ON "app_notifications"("user_id", "read_at", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_up_requests" ADD CONSTRAINT "top_up_requests_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_up_requests" ADD CONSTRAINT "top_up_requests_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlock_records" ADD CONSTRAINT "unlock_records_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlock_records" ADD CONSTRAINT "unlock_records_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unlock_records" ADD CONSTRAINT "unlock_records_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_unlock_record_id_fkey" FOREIGN KEY ("unlock_record_id") REFERENCES "unlock_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_tickets" ADD CONSTRAINT "deal_tickets_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_tickets" ADD CONSTRAINT "deal_tickets_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_tickets" ADD CONSTRAINT "deal_tickets_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_tickets" ADD CONSTRAINT "deal_tickets_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_tickets" ADD CONSTRAINT "deal_tickets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_tickets" ADD CONSTRAINT "deal_tickets_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_deal_ticket_id_fkey" FOREIGN KEY ("deal_ticket_id") REFERENCES "deal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_deal_ticket_id_fkey" FOREIGN KEY ("deal_ticket_id") REFERENCES "deal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_notifications" ADD CONSTRAINT "app_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

