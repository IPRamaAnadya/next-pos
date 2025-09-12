/*
  Warnings:

  - You are about to drop the column `tenant_subscription_id` on the `SubscriptionPayment` table. All the data in the column will be lost.
  - Added the required column `tenant_subscription_history_id` to the `SubscriptionPayment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."SubscriptionPayment" DROP CONSTRAINT "SubscriptionPayment_tenant_subscription_id_fkey";

-- AlterTable
ALTER TABLE "public"."SubscriptionPayment" DROP COLUMN "tenant_subscription_id",
ADD COLUMN     "tenant_subscription_history_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "public"."TenantSubscriptionHistory" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'expired',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custom_limits" JSONB,

    CONSTRAINT "TenantSubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TenantSubscriptionHistory" ADD CONSTRAINT "TenantSubscriptionHistory_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantSubscriptionHistory" ADD CONSTRAINT "TenantSubscriptionHistory_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_tenant_subscription_history_id_fkey" FOREIGN KEY ("tenant_subscription_history_id") REFERENCES "public"."TenantSubscriptionHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
