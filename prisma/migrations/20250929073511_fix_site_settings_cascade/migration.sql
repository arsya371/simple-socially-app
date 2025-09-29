-- DropForeignKey
ALTER TABLE "public"."SiteSetting" DROP CONSTRAINT "SiteSetting_updatedBy_fkey";

-- AddForeignKey
ALTER TABLE "public"."SiteSetting" ADD CONSTRAINT "SiteSetting_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
