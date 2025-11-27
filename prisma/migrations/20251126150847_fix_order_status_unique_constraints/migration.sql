/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,code]` on the table `OrderStatus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,name]` on the table `OrderStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."OrderStatus_code_key";

-- DropIndex
DROP INDEX "public"."OrderStatus_name_key";

-- CreateTable
CREATE TABLE "public"."OrderLog" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "staff_id" UUID,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderLog_order_id_idx" ON "public"."OrderLog"("order_id");

-- CreateIndex
CREATE INDEX "OrderLog_created_at_idx" ON "public"."OrderLog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "OrderStatus_tenant_id_code_key" ON "public"."OrderStatus"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "OrderStatus_tenant_id_name_key" ON "public"."OrderStatus"("tenant_id", "name");

-- AddForeignKey
ALTER TABLE "public"."OrderLog" ADD CONSTRAINT "OrderLog_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderLog" ADD CONSTRAINT "OrderLog_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
