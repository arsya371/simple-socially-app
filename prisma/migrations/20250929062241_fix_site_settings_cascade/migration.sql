-- Drop the existing foreign key constraint
ALTER TABLE "SiteSetting" DROP CONSTRAINT "SiteSetting_updatedBy_fkey";

-- Add the new foreign key constraint with ON DELETE CASCADE
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_updatedBy_fkey"
    FOREIGN KEY ("updatedBy")
    REFERENCES "User"("id")
    ON DELETE CASCADE;