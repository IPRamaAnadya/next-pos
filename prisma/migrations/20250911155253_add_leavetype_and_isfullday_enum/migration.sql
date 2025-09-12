-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('SICK', 'LEAVE', 'PERMIT', 'ABSENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."SalaryType" AS ENUM ('MONTHLY', 'HOURLY');

-- CreateEnum
CREATE TYPE "public"."OvertimeCalculationType" AS ENUM ('HOURLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "public"."PayrollSetting" ADD COLUMN     "overtime_calculation_type" "public"."OvertimeCalculationType" NOT NULL DEFAULT 'HOURLY';

-- AlterTable
ALTER TABLE "public"."Salary" ADD COLUMN     "salary_type" "public"."SalaryType" NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "public"."StaffLeave" (
    "id" TEXT NOT NULL,
    "staff_id" UUID NOT NULL,
    "type" "public"."LeaveType" NOT NULL,
    "reason" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffLeave_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."StaffLeave" ADD CONSTRAINT "StaffLeave_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
