-- AlterTable
ALTER TABLE "public"."TenantNotificationConfig" ADD COLUMN     "enable_order_cancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enable_order_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enable_order_created" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_order_paid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_order_updated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order_cancelled_template_id" UUID,
ADD COLUMN     "order_completed_template_id" UUID,
ADD COLUMN     "order_created_template_id" UUID,
ADD COLUMN     "order_paid_template_id" UUID,
ADD COLUMN     "order_updated_template_id" UUID;
