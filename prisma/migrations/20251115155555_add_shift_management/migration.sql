-- CreateTable
CREATE TABLE "public"."Shift" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "calculate_before_start_time" BOOLEAN NOT NULL DEFAULT true,
    "has_break_time" BOOLEAN NOT NULL DEFAULT false,
    "break_duration" INTEGER NOT NULL DEFAULT 0,
    "min_working_hours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "max_working_hours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "overtime_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "late_threshold" INTEGER NOT NULL DEFAULT 15,
    "early_checkin_allowed" INTEGER NOT NULL DEFAULT 30,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffShift" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "check_in_time" TEXT,
    "check_out_time" TEXT,
    "actual_break_duration" INTEGER,
    "total_worked_minutes" INTEGER,
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "overtime_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_tenant_id_idx" ON "public"."Shift"("tenant_id");

-- CreateIndex
CREATE INDEX "Shift_is_active_idx" ON "public"."Shift"("is_active");

-- CreateIndex
CREATE INDEX "Shift_start_time_idx" ON "public"."Shift"("start_time");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_tenant_id_name_key" ON "public"."Shift"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "StaffShift_tenant_id_idx" ON "public"."StaffShift"("tenant_id");

-- CreateIndex
CREATE INDEX "StaffShift_staff_id_idx" ON "public"."StaffShift"("staff_id");

-- CreateIndex
CREATE INDEX "StaffShift_shift_id_idx" ON "public"."StaffShift"("shift_id");

-- CreateIndex
CREATE INDEX "StaffShift_date_idx" ON "public"."StaffShift"("date");

-- CreateIndex
CREATE INDEX "StaffShift_is_completed_idx" ON "public"."StaffShift"("is_completed");

-- CreateIndex
CREATE UNIQUE INDEX "StaffShift_tenant_id_staff_id_shift_id_date_key" ON "public"."StaffShift"("tenant_id", "staff_id", "shift_id", "date");

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffShift" ADD CONSTRAINT "StaffShift_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffShift" ADD CONSTRAINT "StaffShift_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffShift" ADD CONSTRAINT "StaffShift_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
