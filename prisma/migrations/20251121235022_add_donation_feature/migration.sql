-- CreateEnum
CREATE TYPE "public"."DonationStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."DonationPaymentMethod" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "transaction_fee" DECIMAL(15,2) NOT NULL,
    "fee_percentage" DECIMAL(5,2),
    "min_amount" DECIMAL(15,2) NOT NULL,
    "max_amount" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "icon_url" TEXT,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantDonation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "payment_method_id" UUID,
    "midtrans_order_id" TEXT NOT NULL,
    "snap_token" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "transaction_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "status" "public"."DonationStatus" NOT NULL DEFAULT 'PENDING',
    "payment_type" TEXT,
    "transaction_time" TIMESTAMPTZ(6),
    "settlement_time" TIMESTAMPTZ(6),
    "expiry_time" TIMESTAMPTZ(6),
    "message" TEXT,
    "midtrans_response" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDonation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationPaymentMethod_name_key" ON "public"."DonationPaymentMethod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DonationPaymentMethod_code_key" ON "public"."DonationPaymentMethod"("code");

-- CreateIndex
CREATE INDEX "DonationPaymentMethod_is_active_idx" ON "public"."DonationPaymentMethod"("is_active");

-- CreateIndex
CREATE INDEX "DonationPaymentMethod_type_idx" ON "public"."DonationPaymentMethod"("type");

-- CreateIndex
CREATE INDEX "DonationPaymentMethod_display_order_idx" ON "public"."DonationPaymentMethod"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDonation_midtrans_order_id_key" ON "public"."TenantDonation"("midtrans_order_id");

-- CreateIndex
CREATE INDEX "TenantDonation_tenant_id_idx" ON "public"."TenantDonation"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantDonation_status_idx" ON "public"."TenantDonation"("status");

-- CreateIndex
CREATE INDEX "TenantDonation_created_at_idx" ON "public"."TenantDonation"("created_at");

-- CreateIndex
CREATE INDEX "TenantDonation_tenant_id_created_at_idx" ON "public"."TenantDonation"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "TenantDonation_tenant_id_status_idx" ON "public"."TenantDonation"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "TenantDonation_settlement_time_idx" ON "public"."TenantDonation"("settlement_time");

-- AddForeignKey
ALTER TABLE "public"."TenantDonation" ADD CONSTRAINT "TenantDonation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantDonation" ADD CONSTRAINT "TenantDonation_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."DonationPaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
