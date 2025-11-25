-- CreateTable
CREATE TABLE "public"."PushNotificationToken" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "staff_id" UUID,
    "fcm_token" TEXT NOT NULL,
    "device_type" TEXT,
    "device_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushNotificationMessage" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "image_url" TEXT,
    "target_type" TEXT NOT NULL,
    "target_value" TEXT,
    "category" TEXT,
    "event_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "fcm_response" JSONB,
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PushNotificationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushNotificationSubscription" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "token_id" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PushNotificationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushNotificationToken_tenant_id_idx" ON "public"."PushNotificationToken"("tenant_id");

-- CreateIndex
CREATE INDEX "PushNotificationToken_user_id_idx" ON "public"."PushNotificationToken"("user_id");

-- CreateIndex
CREATE INDEX "PushNotificationToken_staff_id_idx" ON "public"."PushNotificationToken"("staff_id");

-- CreateIndex
CREATE INDEX "PushNotificationToken_is_active_idx" ON "public"."PushNotificationToken"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationToken_fcm_token_key" ON "public"."PushNotificationToken"("fcm_token");

-- CreateIndex
CREATE INDEX "PushNotificationMessage_tenant_id_idx" ON "public"."PushNotificationMessage"("tenant_id");

-- CreateIndex
CREATE INDEX "PushNotificationMessage_status_idx" ON "public"."PushNotificationMessage"("status");

-- CreateIndex
CREATE INDEX "PushNotificationMessage_category_idx" ON "public"."PushNotificationMessage"("category");

-- CreateIndex
CREATE INDEX "PushNotificationMessage_event_type_idx" ON "public"."PushNotificationMessage"("event_type");

-- CreateIndex
CREATE INDEX "PushNotificationMessage_created_at_idx" ON "public"."PushNotificationMessage"("created_at");

-- CreateIndex
CREATE INDEX "PushNotificationMessage_tenant_id_status_idx" ON "public"."PushNotificationMessage"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "PushNotificationMessage_tenant_id_category_idx" ON "public"."PushNotificationMessage"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "PushNotificationSubscription_tenant_id_idx" ON "public"."PushNotificationSubscription"("tenant_id");

-- CreateIndex
CREATE INDEX "PushNotificationSubscription_topic_idx" ON "public"."PushNotificationSubscription"("topic");

-- CreateIndex
CREATE INDEX "PushNotificationSubscription_is_active_idx" ON "public"."PushNotificationSubscription"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationSubscription_token_id_topic_key" ON "public"."PushNotificationSubscription"("token_id", "topic");

-- AddForeignKey
ALTER TABLE "public"."PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushNotificationToken" ADD CONSTRAINT "PushNotificationToken_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushNotificationMessage" ADD CONSTRAINT "PushNotificationMessage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushNotificationSubscription" ADD CONSTRAINT "PushNotificationSubscription_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
