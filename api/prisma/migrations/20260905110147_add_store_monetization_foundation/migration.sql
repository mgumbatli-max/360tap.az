-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discount_percent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "duration_days" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listing_quota" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "service_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "balance_left" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discount_percent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "granted_by" UUID,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "quota_left" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" VARCHAR(80) NOT NULL,
    "value" JSONB NOT NULL,
    "label" VARCHAR(200),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "category_limits" (
    "category_id" UUID NOT NULL,
    "free_per_month" INTEGER NOT NULL DEFAULT 0,
    "store_free_per_month" INTEGER,
    "extra_listing_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_limits_pkey" PRIMARY KEY ("category_id")
);

-- CreateIndex
CREATE INDEX "subscriptions_status_ends_at_idx" ON "subscriptions"("status", "ends_at");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_limits" ADD CONSTRAINT "category_limits_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
