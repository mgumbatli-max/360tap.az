-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'pro', 'business', 'moderator', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('individual', 'store', 'erp_store', 'dealer', 'agency', 'company');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('string', 'number', 'select', 'multiselect', 'boolean', 'range', 'date', 'location');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'review', 'active', 'rejected', 'expired', 'sold', 'archived', 'blocked', 'out_of_stock');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('fixed', 'negotiable', 'free', 'exchange', 'contract');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('new', 'like_new', 'used', 'for_parts');

-- CreateEnum
CREATE TYPE "ListingSource" AS ENUM ('manual', 'erp');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('message', 'price_drop', 'saved_search', 'moderation', 'erp_sync_error', 'system');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ErpSyncStatus" AS ENUM ('ok', 'pending', 'error');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('queued', 'running', 'done', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "seller_type" "SellerType" NOT NULL DEFAULT 'individual',
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "response_minutes" INTEGER,
    "district_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "whatsapp" VARCHAR(20),
    "instagram" VARCHAR(80),
    "website" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name_az" VARCHAR(80) NOT NULL,
    "name_ru" VARCHAR(80),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name_az" VARCHAR(100) NOT NULL,
    "name_ru" VARCHAR(100),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nearby_districts" (
    "id" UUID NOT NULL,
    "origin_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "nearby_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "vertical" VARCHAR(20) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name_az" VARCHAR(120) NOT NULL,
    "name_ru" VARCHAR(120),
    "name_en" VARCHAR(120),
    "icon" VARCHAR(60),
    "seo_title" TEXT,
    "seo_description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "listings_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attributes" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "key" VARCHAR(60) NOT NULL,
    "label_az" VARCHAR(120) NOT NULL,
    "label_ru" VARCHAR(120),
    "type" "AttributeType" NOT NULL,
    "options" JSONB,
    "unit" VARCHAR(20),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT true,
    "is_searchable" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "vertical" VARCHAR(20) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "logo_url" TEXT,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "store_id" UUID,
    "category_id" UUID NOT NULL,
    "district_id" UUID,
    "vertical" VARCHAR(20) NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(14,2),
    "old_price" DECIMAL(14,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'AZN',
    "price_type" "PriceType" NOT NULL DEFAULT 'fixed',
    "condition" "Condition",
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "source" "ListingSource" NOT NULL DEFAULT 'manual',
    "stock_qty" INTEGER,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "has_delivery" BOOLEAN NOT NULL DEFAULT false,
    "has_credit" BOOLEAN NOT NULL DEFAULT false,
    "has_barter" BOOLEAN NOT NULL DEFAULT false,
    "has_warranty" BOOLEAN NOT NULL DEFAULT false,
    "pickup_today" BOOLEAN NOT NULL DEFAULT false,
    "contact_name" VARCHAR(120),
    "contact_phone" VARCHAR(20),
    "contact_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" "ListingStatus" NOT NULL DEFAULT 'review',
    "rejection_reason" TEXT,
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_highlight" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "promoted_until" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "call_clicks" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_clicks" INTEGER NOT NULL DEFAULT 0,
    "favorites_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "blur_hash" VARCHAR(60),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_attribute_values" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "attribute_id" UUID NOT NULL,
    "value_text" TEXT,
    "value_num" DECIMAL(16,4),
    "value_bool" BOOLEAN,

    CONSTRAINT "listing_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_details" (
    "listing_id" UUID NOT NULL,
    "brand_id" UUID,
    "model_id" UUID,
    "year" INTEGER,
    "body_type" VARCHAR(40),
    "fuel_type" VARCHAR(30),
    "engine_cc" INTEGER,
    "transmission" VARCHAR(30),
    "drivetrain" VARCHAR(20),
    "color" VARCHAR(40),
    "mileage" INTEGER,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "seats" INTEGER,
    "doors" INTEGER,
    "owners_count" INTEGER,
    "vin" VARCHAR(20),
    "no_accident" BOOLEAN NOT NULL DEFAULT false,
    "not_painted" BOOLEAN NOT NULL DEFAULT false,
    "customs_cleared" BOOLEAN NOT NULL DEFAULT false,
    "battery_kwh" DOUBLE PRECISION,
    "hybrid_type" VARCHAR(20),
    "features" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "vehicle_details_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "real_estate_details" (
    "listing_id" UUID NOT NULL,
    "deal_type" VARCHAR(20) NOT NULL,
    "property_type" VARCHAR(30) NOT NULL,
    "is_new_building" BOOLEAN NOT NULL DEFAULT false,
    "rooms" INTEGER,
    "area" DOUBLE PRECISION,
    "floor" INTEGER,
    "total_floors" INTEGER,
    "price_per_m2" DECIMAL(12,2),
    "has_extract" BOOLEAN NOT NULL DEFAULT false,
    "has_mortgage" BOOLEAN NOT NULL DEFAULT false,
    "repair" VARCHAR(30),
    "metro" VARCHAR(80),
    "landmark" TEXT,
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "has_360_tour" BOOLEAN NOT NULL DEFAULT false,
    "video_url" TEXT,

    CONSTRAINT "real_estate_details_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "job_details" (
    "listing_id" UUID NOT NULL,
    "company_id" UUID,
    "position" VARCHAR(140) NOT NULL,
    "field" VARCHAR(80),
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "schedule" VARCHAR(30),
    "experience" VARCHAR(40),
    "education" VARCHAR(40),
    "languages" JSONB NOT NULL DEFAULT '[]',
    "requirements" TEXT,
    "duties" TEXT,
    "cv_required" BOOLEAN NOT NULL DEFAULT true,
    "online_interview" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "job_details_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "description" TEXT,
    "status" "StoreStatus" NOT NULL DEFAULT 'pending',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "source" "ListingSource" NOT NULL DEFAULT 'manual',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "instagram" VARCHAR(80),
    "working_hours" JSONB,
    "delivery_terms" TEXT,
    "warranty_terms" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_branches" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "address" TEXT NOT NULL,
    "district_id" UUID,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" VARCHAR(20),

    CONSTRAINT "store_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL,
    "store_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "logo_url" TEXT,
    "about" TEXT,
    "website" TEXT,
    "size" VARCHAR(30),

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","listing_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewed_id" UUID NOT NULL,
    "listing_id" UUID,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "listing_id" UUID,
    "user_id" UUID,
    "reason" VARCHAR(40) NOT NULL,
    "detail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(120),
    "query" JSONB NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "last_notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_stat_daily" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "call_clicks" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_clicks" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listing_stat_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "limits" JSONB NOT NULL,
    "features" JSONB NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "payment_id" UUID,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'AZN',
    "type" VARCHAR(30) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(40),
    "provider_ref" VARCHAR(120),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT NOT NULL,
    "placement" VARCHAR(40) NOT NULL,
    "region_id" UUID,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_integrations" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "erp_tenant_id" VARCHAR(120) NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "webhook_secret" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erp_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_product_links" (
    "id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "external_id" VARCHAR(120) NOT NULL,
    "listing_id" UUID,
    "last_hash" TEXT,
    "sync_status" "ErpSyncStatus" NOT NULL DEFAULT 'pending',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "erp_product_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_sync_logs" (
    "id" UUID NOT NULL,
    "integration_id" UUID NOT NULL,
    "external_id" VARCHAR(120),
    "action" VARCHAR(30) NOT NULL,
    "status" "ErpSyncStatus" NOT NULL,
    "error" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erp_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "file_url" TEXT,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'queued',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" UUID NOT NULL,
    "query" VARCHAR(200) NOT NULL,
    "region_id" UUID,
    "results_count" INTEGER NOT NULL,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(60) NOT NULL,
    "entity" VARCHAR(40) NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "districts_slug_key" ON "districts"("slug");

-- CreateIndex
CREATE INDEX "districts_region_id_idx" ON "districts"("region_id");

-- CreateIndex
CREATE INDEX "nearby_districts_origin_id_rank_idx" ON "nearby_districts"("origin_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "nearby_districts_origin_id_target_id_key" ON "nearby_districts"("origin_id", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_vertical_idx" ON "categories"("vertical");

-- CreateIndex
CREATE UNIQUE INDEX "category_attributes_category_id_key_key" ON "category_attributes"("category_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_brand_id_slug_key" ON "vehicle_models"("brand_id", "slug");

-- CreateIndex
CREATE INDEX "listings_status_created_at_idx" ON "listings"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "listings_category_id_status_idx" ON "listings"("category_id", "status");

-- CreateIndex
CREATE INDEX "listings_district_id_status_idx" ON "listings"("district_id", "status");

-- CreateIndex
CREATE INDEX "listings_vertical_status_idx" ON "listings"("vertical", "status");

-- CreateIndex
CREATE INDEX "listings_store_id_idx" ON "listings"("store_id");

-- CreateIndex
CREATE INDEX "listings_source_status_idx" ON "listings"("source", "status");

-- CreateIndex
CREATE INDEX "listing_images_listing_id_sort_order_idx" ON "listing_images"("listing_id", "sort_order");

-- CreateIndex
CREATE INDEX "listing_attribute_values_attribute_id_value_num_idx" ON "listing_attribute_values"("attribute_id", "value_num");

-- CreateIndex
CREATE INDEX "listing_attribute_values_attribute_id_value_text_idx" ON "listing_attribute_values"("attribute_id", "value_text");

-- CreateIndex
CREATE UNIQUE INDEX "listing_attribute_values_listing_id_attribute_id_key" ON "listing_attribute_values"("listing_id", "attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_owner_id_key" ON "stores"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "store_branches_store_id_idx" ON "store_branches"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_store_id_key" ON "company_profiles"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_listing_id_buyer_id_seller_id_key" ON "conversations"("listing_id", "buyer_id", "seller_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "reviews_reviewed_id_idx" ON "reviews"("reviewed_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "listing_stat_daily_listing_id_date_key" ON "listing_stat_daily"("listing_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "packages_code_key" ON "packages"("code");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "promotions_listing_id_idx" ON "promotions"("listing_id");

-- CreateIndex
CREATE INDEX "payments_user_id_status_idx" ON "payments"("user_id", "status");

-- CreateIndex
CREATE INDEX "banners_placement_is_active_idx" ON "banners"("placement", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "erp_integrations_store_id_key" ON "erp_integrations"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "erp_product_links_listing_id_key" ON "erp_product_links"("listing_id");

-- CreateIndex
CREATE INDEX "erp_product_links_sync_status_idx" ON "erp_product_links"("sync_status");

-- CreateIndex
CREATE UNIQUE INDEX "erp_product_links_integration_id_external_id_key" ON "erp_product_links"("integration_id", "external_id");

-- CreateIndex
CREATE INDEX "erp_sync_logs_integration_id_created_at_idx" ON "erp_sync_logs"("integration_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "import_jobs_user_id_idx" ON "import_jobs"("user_id");

-- CreateIndex
CREATE INDEX "search_logs_created_at_idx" ON "search_logs"("created_at");

-- CreateIndex
CREATE INDEX "search_logs_results_count_idx" ON "search_logs"("results_count");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nearby_districts" ADD CONSTRAINT "nearby_districts_origin_id_fkey" FOREIGN KEY ("origin_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nearby_districts" ADD CONSTRAINT "nearby_districts_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_attribute_values" ADD CONSTRAINT "listing_attribute_values_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_attribute_values" ADD CONSTRAINT "listing_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "category_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_details" ADD CONSTRAINT "real_estate_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_details" ADD CONSTRAINT "job_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_details" ADD CONSTRAINT "job_details_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_branches" ADD CONSTRAINT "store_branches_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_id_fkey" FOREIGN KEY ("reviewed_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_integrations" ADD CONSTRAINT "erp_integrations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_product_links" ADD CONSTRAINT "erp_product_links_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "erp_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_product_links" ADD CONSTRAINT "erp_product_links_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_sync_logs" ADD CONSTRAINT "erp_sync_logs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "erp_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
