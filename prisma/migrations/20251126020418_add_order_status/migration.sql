-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "order_status" SET DEFAULT 'CONFIRMED';

-- CreateTable
CREATE TABLE "public"."OrderStatus" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderStatus_code_key" ON "public"."OrderStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrderStatus_name_key" ON "public"."OrderStatus"("name");

-- CreateIndex
CREATE INDEX "OrderStatus_tenant_id_idx" ON "public"."OrderStatus"("tenant_id");

-- AddForeignKey
ALTER TABLE "public"."OrderStatus" ADD CONSTRAINT "OrderStatus_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
