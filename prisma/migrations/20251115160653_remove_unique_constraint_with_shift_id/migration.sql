-- DropIndex
DROP INDEX "public"."Attendance_tenant_id_staff_id_date_key";

-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "shift_id" UUID;

-- CreateIndex
CREATE INDEX "Attendance_shift_id_idx" ON "public"."Attendance"("shift_id");

-- CreateIndex
CREATE INDEX "Attendance_tenant_id_staff_id_date_idx" ON "public"."Attendance"("tenant_id", "staff_id", "date");

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
