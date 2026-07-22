-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_ANOMALY';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;
