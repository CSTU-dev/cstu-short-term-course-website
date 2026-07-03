-- CreateEnum
CREATE TYPE "CourseMode" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable: Enrollment gains a delivery mode (defaults to ONLINE for existing rows)
ALTER TABLE "Enrollment" ADD COLUMN "mode" "CourseMode" NOT NULL DEFAULT 'ONLINE';

-- AlterTable: Course dual-mode pricing. Add new columns first, backfill, then drop the old ones.
ALTER TABLE "Course" ADD COLUMN "hasOnline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "hasOffline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "onlinePrice" DECIMAL(10,2);
ALTER TABLE "Course" ADD COLUMN "offlinePrice" DECIMAL(10,2);

-- Backfill from the previous single-mode model.
UPDATE "Course" SET
  "hasOnline"    = NOT "isOffline",
  "hasOffline"   = "isOffline",
  "onlinePrice"  = CASE WHEN "isOffline" THEN NULL ELSE "priceAmount" END,
  "offlinePrice" = CASE WHEN "isOffline" THEN "priceAmount" ELSE NULL END;

-- Drop the retired single-mode columns.
ALTER TABLE "Course" DROP COLUMN "isOffline";
ALTER TABLE "Course" DROP COLUMN "priceAmount";
ALTER TABLE "Course" DROP COLUMN "currency";
