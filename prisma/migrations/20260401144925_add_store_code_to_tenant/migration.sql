/*
  Warnings:

  - A unique constraint covering the columns `[store_code]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "store_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_store_code_key" ON "public"."Tenant"("store_code");
