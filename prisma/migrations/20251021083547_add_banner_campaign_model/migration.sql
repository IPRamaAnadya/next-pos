-- CreateTable
CREATE TABLE "public"."BannerCampaign" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "publish_at" TIMESTAMP(3) NOT NULL,
    "publish_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BannerCampaign_is_active_idx" ON "public"."BannerCampaign"("is_active");

-- CreateIndex
CREATE INDEX "BannerCampaign_publish_at_idx" ON "public"."BannerCampaign"("publish_at");

-- CreateIndex
CREATE INDEX "BannerCampaign_publish_until_idx" ON "public"."BannerCampaign"("publish_until");
