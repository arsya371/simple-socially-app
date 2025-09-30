"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { checkRole } from "@/actions/auth.action";

export async function migrateSiteSettingsToAppSettings() {
  try {
    const isAdmin = await checkRole(["ADMIN"]);
    if (!isAdmin) {
      throw new Error("Not authorized");
    }

    const user = await currentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      throw new Error("User not found");
    }

    // Get all existing site settings
    const siteSettings = await prisma.siteSetting.findMany({
      orderBy: { category: "asc" }
    });

    console.log(`Found ${siteSettings.length} site settings to migrate`);

    // Migrate each setting
    for (const setting of siteSettings) {
      // Determine the type based on the value
      let type = 'STRING';
      if (setting.value === 'true' || setting.value === 'false') {
        type = 'BOOLEAN';
      } else if (!isNaN(Number(setting.value)) && setting.value !== '') {
        type = 'NUMBER';
      }

      // Create corresponding app setting
      await prisma.appSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          type: type as any,
          category: setting.category,
          description: `Migrated from site settings: ${setting.key}`,
          isPublic: false, // Site settings are typically not public
          updatedBy: dbUser.id
        },
        create: {
          key: setting.key,
          value: setting.value,
          type: type as any,
          category: setting.category,
          description: `Migrated from site settings: ${setting.key}`,
          isPublic: false,
          updatedBy: dbUser.id
        }
      });

      console.log(`Migrated setting: ${setting.key}`);
    }

    console.log("Migration completed successfully");
    return { success: true, migrated: siteSettings.length };
  } catch (error: any) {
    console.error("Error migrating settings:", error);
    throw new Error(error.message || "Failed to migrate settings");
  }
}

export async function checkMigrationStatus() {
  try {
    const [siteSettingsCount, appSettingsCount] = await Promise.all([
      prisma.siteSetting.count(),
      prisma.appSetting.count()
    ]);

    return {
      siteSettingsCount,
      appSettingsCount,
      needsMigration: siteSettingsCount > 0
    };
  } catch (error: any) {
    console.error("Error checking migration status:", error);
    throw new Error(error.message || "Failed to check migration status");
  }
}
