-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'HUNTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."LedgerCategory" AS ENUM ('DONATION_RECEIVED', 'DONATION_REFUND', 'COMMISSION_CALCULATED', 'COMMISSION_PAID', 'SUBSCRIPTION_RECEIVED', 'PLATFORM_FEE', 'PAYMENT_GATEWAY_FEE', 'PAYOUT_TO_HUNTER', 'OTHER_INCOME', 'OTHER_EXPENSE');

-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "hunter_referral_code" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "public"."Hunter" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "admin_id" UUID NOT NULL,
    "referral_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_earnings" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_paid_out" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bank_account_name" TEXT,
    "bank_account_number" TEXT,
    "bank_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Hunter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HunterCommission" (
    "id" UUID NOT NULL,
    "hunter_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "donation_id" UUID NOT NULL,
    "donation_amount" DECIMAL(15,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(15,2) NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paid_out_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "HunterCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HunterPayout" (
    "id" UUID NOT NULL,
    "hunter_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" TEXT,
    "reference_number" TEXT,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processed_by" UUID,
    "processed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "HunterPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemLedger" (
    "id" UUID NOT NULL,
    "transaction_type" "public"."TransactionType" NOT NULL,
    "category" "public"."LedgerCategory" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "hunter_id" UUID,
    "tenant_id" UUID,
    "donation_id" UUID,
    "commission_id" UUID,
    "payout_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hunter_user_id_key" ON "public"."Hunter"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Hunter_referral_code_key" ON "public"."Hunter"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "Hunter_email_key" ON "public"."Hunter"("email");

-- CreateIndex
CREATE INDEX "Hunter_referral_code_idx" ON "public"."Hunter"("referral_code");

-- CreateIndex
CREATE INDEX "Hunter_is_active_idx" ON "public"."Hunter"("is_active");

-- CreateIndex
CREATE INDEX "Hunter_admin_id_idx" ON "public"."Hunter"("admin_id");

-- CreateIndex
CREATE INDEX "Hunter_email_idx" ON "public"."Hunter"("email");

-- CreateIndex
CREATE INDEX "HunterCommission_hunter_id_idx" ON "public"."HunterCommission"("hunter_id");

-- CreateIndex
CREATE INDEX "HunterCommission_tenant_id_idx" ON "public"."HunterCommission"("tenant_id");

-- CreateIndex
CREATE INDEX "HunterCommission_donation_id_idx" ON "public"."HunterCommission"("donation_id");

-- CreateIndex
CREATE INDEX "HunterCommission_status_idx" ON "public"."HunterCommission"("status");

-- CreateIndex
CREATE INDEX "HunterCommission_created_at_idx" ON "public"."HunterCommission"("created_at");

-- CreateIndex
CREATE INDEX "HunterCommission_hunter_id_status_idx" ON "public"."HunterCommission"("hunter_id", "status");

-- CreateIndex
CREATE INDEX "HunterPayout_hunter_id_idx" ON "public"."HunterPayout"("hunter_id");

-- CreateIndex
CREATE INDEX "HunterPayout_status_idx" ON "public"."HunterPayout"("status");

-- CreateIndex
CREATE INDEX "HunterPayout_created_at_idx" ON "public"."HunterPayout"("created_at");

-- CreateIndex
CREATE INDEX "SystemLedger_transaction_type_idx" ON "public"."SystemLedger"("transaction_type");

-- CreateIndex
CREATE INDEX "SystemLedger_category_idx" ON "public"."SystemLedger"("category");

-- CreateIndex
CREATE INDEX "SystemLedger_hunter_id_idx" ON "public"."SystemLedger"("hunter_id");

-- CreateIndex
CREATE INDEX "SystemLedger_tenant_id_idx" ON "public"."SystemLedger"("tenant_id");

-- CreateIndex
CREATE INDEX "SystemLedger_donation_id_idx" ON "public"."SystemLedger"("donation_id");

-- CreateIndex
CREATE INDEX "SystemLedger_commission_id_idx" ON "public"."SystemLedger"("commission_id");

-- CreateIndex
CREATE INDEX "SystemLedger_payout_id_idx" ON "public"."SystemLedger"("payout_id");

-- CreateIndex
CREATE INDEX "SystemLedger_created_at_idx" ON "public"."SystemLedger"("created_at");

-- CreateIndex
CREATE INDEX "SystemLedger_reference_type_reference_id_idx" ON "public"."SystemLedger"("reference_type", "reference_id");

-- AddForeignKey
ALTER TABLE "public"."Tenant" ADD CONSTRAINT "Tenant_hunter_referral_code_fkey" FOREIGN KEY ("hunter_referral_code") REFERENCES "public"."Hunter"("referral_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Hunter" ADD CONSTRAINT "Hunter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Hunter" ADD CONSTRAINT "Hunter_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HunterCommission" ADD CONSTRAINT "HunterCommission_hunter_id_fkey" FOREIGN KEY ("hunter_id") REFERENCES "public"."Hunter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HunterCommission" ADD CONSTRAINT "HunterCommission_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "public"."TenantDonation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HunterPayout" ADD CONSTRAINT "HunterPayout_hunter_id_fkey" FOREIGN KEY ("hunter_id") REFERENCES "public"."Hunter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemLedger" ADD CONSTRAINT "SystemLedger_hunter_id_fkey" FOREIGN KEY ("hunter_id") REFERENCES "public"."Hunter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemLedger" ADD CONSTRAINT "SystemLedger_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "public"."TenantDonation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemLedger" ADD CONSTRAINT "SystemLedger_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "public"."HunterCommission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemLedger" ADD CONSTRAINT "SystemLedger_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "public"."HunterPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
