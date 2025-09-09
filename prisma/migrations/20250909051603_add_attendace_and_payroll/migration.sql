-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "payroll_detail_id" UUID;

-- CreateTable
CREATE TABLE "public"."SubscriptionPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_per_month" DECIMAL(65,30) NOT NULL,
    "price_per_year" DECIMAL(65,30),
    "is_beta_test" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantSubscription" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trial',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "custom_limits" JSONB,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPayment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tenant_subscription_id" UUID NOT NULL,
    "midtrans_order_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_method" TEXT,
    "transaction_status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayrollSetting" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "ump" DECIMAL(65,30),
    "normal_work_hours_per_day" INTEGER DEFAULT 7,
    "normal_work_hours_per_month" INTEGER DEFAULT 173,
    "overtime_rate_1" DECIMAL(65,30) DEFAULT 1.5,
    "overtime_rate_2" DECIMAL(65,30) DEFAULT 2,
    "overtime_rate_weekend_1" DECIMAL(65,30) DEFAULT 2,
    "overtime_rate_weekend_2" DECIMAL(65,30) DEFAULT 3,
    "overtime_rate_weekend_3" DECIMAL(65,30) DEFAULT 4,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Salary" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "basic_salary" DECIMAL(65,30) NOT NULL,
    "fixed_allowance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Salary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "check_in_time" TIMESTAMPTZ(6),
    "check_out_time" TIMESTAMPTZ(6),
    "total_hours" DECIMAL(65,30),
    "is_weekend" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayrollPeriod" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayrollDetail" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "payroll_period_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "basic_salary_amount" DECIMAL(65,30) NOT NULL,
    "fixed_allowance_amount" DECIMAL(65,30) NOT NULL,
    "overtime_hours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtime_pay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bonus_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deductions_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "take_home_pay" DECIMAL(65,30) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "public"."SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSubscription_tenant_id_key" ON "public"."TenantSubscription"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_midtrans_order_id_key" ON "public"."SubscriptionPayment"("midtrans_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollSetting_tenant_id_key" ON "public"."PayrollSetting"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Salary_staff_id_key" ON "public"."Salary"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_tenant_id_staff_id_date_key" ON "public"."Attendance"("tenant_id", "staff_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_tenant_id_period_start_key" ON "public"."PayrollPeriod"("tenant_id", "period_start");

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_payroll_detail_id_fkey" FOREIGN KEY ("payroll_detail_id") REFERENCES "public"."PayrollDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantSubscription" ADD CONSTRAINT "TenantSubscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_tenant_subscription_id_fkey" FOREIGN KEY ("tenant_subscription_id") REFERENCES "public"."TenantSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollSetting" ADD CONSTRAINT "PayrollSetting_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Salary" ADD CONSTRAINT "Salary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Salary" ADD CONSTRAINT "Salary_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollDetail" ADD CONSTRAINT "PayrollDetail_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollDetail" ADD CONSTRAINT "PayrollDetail_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollDetail" ADD CONSTRAINT "PayrollDetail_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
