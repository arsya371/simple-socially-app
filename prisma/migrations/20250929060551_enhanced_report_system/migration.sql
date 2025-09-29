/*
  Warnings:

  - The values [CONTENT,USER,SPAM] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `reason` on the `Report` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."ReportReason" AS ENUM ('HARASSMENT', 'HATE_SPEECH', 'VIOLENCE', 'NUDITY', 'SPAM', 'FAKE_ACCOUNT', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'SELF_HARM', 'MISINFORMATION', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ReportType_new" AS ENUM ('POST', 'COMMENT', 'PROFILE');
ALTER TABLE "public"."Report" ALTER COLUMN "type" TYPE "public"."ReportType_new" USING ("type"::text::"public"."ReportType_new");
ALTER TYPE "public"."ReportType" RENAME TO "ReportType_old";
ALTER TYPE "public"."ReportType_new" RENAME TO "ReportType";
DROP TYPE "public"."ReportType_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."Report_type_status_idx";

-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "actionTaken" TEXT,
ADD COLUMN     "adminNote" TEXT,
DROP COLUMN "reason",
ADD COLUMN     "reason" "public"."ReportReason" NOT NULL;

-- CreateIndex
CREATE INDEX "Report_type_status_reason_idx" ON "public"."Report"("type", "status", "reason");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");
