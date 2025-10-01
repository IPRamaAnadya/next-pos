-- CreateIndex
CREATE INDEX "Attendance_tenant_id_idx" ON "public"."Attendance"("tenant_id");

-- CreateIndex
CREATE INDEX "Attendance_staff_id_idx" ON "public"."Attendance"("staff_id");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "public"."Attendance"("date");

-- CreateIndex
CREATE INDEX "Customer_tenant_id_idx" ON "public"."Customer"("tenant_id");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "public"."Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "public"."Customer"("phone");

-- CreateIndex
CREATE INDEX "Discount_tenant_id_idx" ON "public"."Discount"("tenant_id");

-- CreateIndex
CREATE INDEX "Discount_valid_from_idx" ON "public"."Discount"("valid_from");

-- CreateIndex
CREATE INDEX "Discount_valid_to_idx" ON "public"."Discount"("valid_to");

-- CreateIndex
CREATE INDEX "Expense_tenant_id_idx" ON "public"."Expense"("tenant_id");

-- CreateIndex
CREATE INDEX "Expense_expense_category_id_idx" ON "public"."Expense"("expense_category_id");

-- CreateIndex
CREATE INDEX "Expense_staff_id_idx" ON "public"."Expense"("staff_id");

-- CreateIndex
CREATE INDEX "Expense_created_at_idx" ON "public"."Expense"("created_at");

-- CreateIndex
CREATE INDEX "ExpenseCategory_tenant_id_idx" ON "public"."ExpenseCategory"("tenant_id");

-- CreateIndex
CREATE INDEX "ExpenseCategory_code_idx" ON "public"."ExpenseCategory"("code");

-- CreateIndex
CREATE INDEX "Log_tenant_id_idx" ON "public"."Log"("tenant_id");

-- CreateIndex
CREATE INDEX "Log_staff_id_idx" ON "public"."Log"("staff_id");

-- CreateIndex
CREATE INDEX "Log_created_at_idx" ON "public"."Log"("created_at");

-- CreateIndex
CREATE INDEX "NotificationLog_tenant_id_idx" ON "public"."NotificationLog"("tenant_id");

-- CreateIndex
CREATE INDEX "NotificationLog_template_id_idx" ON "public"."NotificationLog"("template_id");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "public"."NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_created_at_idx" ON "public"."NotificationLog"("created_at");

-- CreateIndex
CREATE INDEX "NotificationTemplate_tenant_id_idx" ON "public"."NotificationTemplate"("tenant_id");

-- CreateIndex
CREATE INDEX "NotificationTemplate_event_idx" ON "public"."NotificationTemplate"("event");

-- CreateIndex
CREATE INDEX "Order_tenant_id_idx" ON "public"."Order"("tenant_id");

-- CreateIndex
CREATE INDEX "Order_created_at_idx" ON "public"."Order"("created_at");

-- CreateIndex
CREATE INDEX "Order_tenant_id_created_at_idx" ON "public"."Order"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "Order_order_status_idx" ON "public"."Order"("order_status");

-- CreateIndex
CREATE INDEX "Order_payment_status_idx" ON "public"."Order"("payment_status");

-- CreateIndex
CREATE INDEX "OrderItem_tenant_id_idx" ON "public"."OrderItem"("tenant_id");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "public"."OrderItem"("order_id");

-- CreateIndex
CREATE INDEX "OrderItem_product_id_idx" ON "public"."OrderItem"("product_id");

-- CreateIndex
CREATE INDEX "OrderItem_created_at_idx" ON "public"."OrderItem"("created_at");

-- CreateIndex
CREATE INDEX "PayrollDetail_tenant_id_idx" ON "public"."PayrollDetail"("tenant_id");

-- CreateIndex
CREATE INDEX "PayrollDetail_payroll_period_id_idx" ON "public"."PayrollDetail"("payroll_period_id");

-- CreateIndex
CREATE INDEX "PayrollDetail_staff_id_idx" ON "public"."PayrollDetail"("staff_id");

-- CreateIndex
CREATE INDEX "PayrollDetail_is_paid_idx" ON "public"."PayrollDetail"("is_paid");

-- CreateIndex
CREATE INDEX "PayrollPeriod_tenant_id_idx" ON "public"."PayrollPeriod"("tenant_id");

-- CreateIndex
CREATE INDEX "Product_tenant_id_idx" ON "public"."Product"("tenant_id");

-- CreateIndex
CREATE INDEX "Product_product_category_id_idx" ON "public"."Product"("product_category_id");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "public"."Product"("name");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "ProductCategory_tenant_id_idx" ON "public"."ProductCategory"("tenant_id");

-- CreateIndex
CREATE INDEX "ProductCategory_parent_id_idx" ON "public"."ProductCategory"("parent_id");

-- CreateIndex
CREATE INDEX "Salary_tenant_id_idx" ON "public"."Salary"("tenant_id");

-- CreateIndex
CREATE INDEX "Staff_tenant_id_idx" ON "public"."Staff"("tenant_id");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_tenant_id_idx" ON "public"."SubscriptionPayment"("tenant_id");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_tenant_subscription_history_id_idx" ON "public"."SubscriptionPayment"("tenant_subscription_history_id");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_transaction_status_idx" ON "public"."SubscriptionPayment"("transaction_status");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_name_idx" ON "public"."SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "Tenant_user_id_idx" ON "public"."Tenant"("user_id");

-- CreateIndex
CREATE INDEX "TenantReport_tenant_id_idx" ON "public"."TenantReport"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantReport_type_idx" ON "public"."TenantReport"("type");

-- CreateIndex
CREATE INDEX "TenantReport_created_at_idx" ON "public"."TenantReport"("created_at");

-- CreateIndex
CREATE INDEX "TenantSetting_tenant_id_idx" ON "public"."TenantSetting"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantSubscription_tenant_id_idx" ON "public"."TenantSubscription"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantSubscription_plan_id_idx" ON "public"."TenantSubscription"("plan_id");

-- CreateIndex
CREATE INDEX "TenantSubscription_status_idx" ON "public"."TenantSubscription"("status");

-- CreateIndex
CREATE INDEX "TenantSubscriptionHistory_tenant_id_idx" ON "public"."TenantSubscriptionHistory"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantSubscriptionHistory_plan_id_idx" ON "public"."TenantSubscriptionHistory"("plan_id");

-- CreateIndex
CREATE INDEX "TenantSubscriptionHistory_status_idx" ON "public"."TenantSubscriptionHistory"("status");
