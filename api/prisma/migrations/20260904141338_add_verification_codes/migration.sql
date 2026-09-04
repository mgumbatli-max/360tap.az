-- CreateEnum
CREATE TYPE "VerificationChannel" AS ENUM ('email', 'sms');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('register', 'login', 'verify_contact', 'reset_password');

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "channel" "VerificationChannel" NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "target" VARCHAR(190) NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "grant_token" VARCHAR(64),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_codes_target_purpose_consumed_at_idx" ON "verification_codes"("target", "purpose", "consumed_at");

-- CreateIndex
CREATE INDEX "verification_codes_target_created_at_idx" ON "verification_codes"("target", "created_at");

-- CreateIndex
CREATE INDEX "verification_codes_user_id_idx" ON "verification_codes"("user_id");

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
