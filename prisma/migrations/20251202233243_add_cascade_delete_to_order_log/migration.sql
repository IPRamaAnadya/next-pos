-- DropForeignKey
ALTER TABLE "public"."OrderLog" DROP CONSTRAINT "OrderLog_order_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."OrderLog" ADD CONSTRAINT "OrderLog_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
