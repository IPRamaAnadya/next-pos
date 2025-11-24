-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationEvent" ADD VALUE 'ORDER_UPDATED';
ALTER TYPE "public"."NotificationEvent" ADD VALUE 'ORDER_COMPLETED';
ALTER TYPE "public"."NotificationEvent" ADD VALUE 'ORDER_CANCELLED';
ALTER TYPE "public"."NotificationEvent" ADD VALUE 'PAYMENT_REMINDER';
ALTER TYPE "public"."NotificationEvent" ADD VALUE 'CUSTOM';
