/*
  Warnings:

  - Added the required column `period` to the `TenantReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TenantReport" ADD COLUMN     "period" TEXT NOT NULL;
