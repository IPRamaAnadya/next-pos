-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "is_countable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs';
