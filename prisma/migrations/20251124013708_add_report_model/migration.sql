-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('SALES', 'PROFIT_LOSS');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "pdf_url" TEXT,
    "s3_key" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_tenant_id_idx" ON "public"."Report"("tenant_id");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "public"."Report"("type");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_tenant_id_type_start_date_end_date_idx" ON "public"."Report"("tenant_id", "type", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "Report_created_at_idx" ON "public"."Report"("created_at");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
