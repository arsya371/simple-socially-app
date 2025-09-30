"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { checkRole } from "@/actions/auth.action";
import { revalidatePath } from "next/cache";

export async function getPublicSettings() {
  try {
    const settings = await prisma.appSetting.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        type: true,
        category: true
      }
    });

    // Convert to a more usable format
    const settingsMap: Record<string, any> = {};
    settings.forEach(setting => {
      let value: any = setting.value;
      // Convert to native types
      switch (setting.type) {
        case 'BOOLEAN':
          value = value === 'true';
          break;
        case 'NUMBER':
          value = Number(value);
          break;
        case 'JSON':
          try {
            value = JSON.parse(value);
          } catch {
            value = setting.value;
          }
          break;
        default:
          // STRING, IMAGE - keep as string
          break;
      }
      settingsMap[setting.key] = value;
    });

    return settingsMap;
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return {};
  }
}

export async function getSetting(key: string, defaultValue: any = null) {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key },
      select: { value: true, type: true }
    });

    if (!setting) return defaultValue;

    let value: any = setting.value;
    // Convert based on type
    switch (setting.type) {
      case 'BOOLEAN':
        value = value === 'true';
        break;
      case 'NUMBER':
        value = Number(value);
        break;
      case 'JSON':
        try {
          value = JSON.parse(value);
        } catch {
          value = setting.value;
        }
        break;
      default:
        // STRING, IMAGE - keep as string
        break;
    }

    return value;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
}

export async function getAllSettings() {
  try {
    const settings = await prisma.appSetting.findMany({
      orderBy: { category: 'asc' },
      include: {
        editor: {
          select: { username: true }
        }
      }
    });

    return settings;
  } catch (error) {
    console.error("Error fetching all settings:", error);
    return [];
  }
}

async function getDbUser() {
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

  return dbUser;
}

async function checkAdmin() {
  const isAdmin = await checkRole(["ADMIN"]);
  if (!isAdmin) {
    throw new Error("Not authorized");
  }
}

export async function updateAppSettings(updates: Array<{
  key: string;
  value: string;
  type: string;
  category: string;
  description?: string;
  isPublic?: boolean;
}>) {
  try {
    console.log('updateAppSettings called with:', updates);
    
    await checkAdmin();
    const user = await getDbUser();
    
    console.log('User authorized:', user.id);

    const results = await Promise.all(
      updates.map(async ({ key, value, type, category, description, isPublic }) => {
        console.log(`Updating setting ${key} with value: ${value}`);
        
        const result = await prisma.appSetting.upsert({
          where: { key },
          update: {
            value,
            type: type as any,
            category,
            description: description || null,
            isPublic: isPublic ?? false,
            updatedBy: user.id,
            updatedAt: new Date()
          },
          create: {
            key,
            value,
            type: type as any,
            category,
            description: description || null,
            isPublic: isPublic ?? false,
            updatedBy: user.id
          }
        });
        
        console.log(`Setting ${key} updated:`, result);
        return result;
      })
    );

    console.log('All settings updated successfully:', results);
    revalidatePath('/admin/settings/app');
    
    // Clear the settings cache to ensure fresh data
    const { clearSettingsCache } = await import('@/lib/app-settings');
    clearSettingsCache();
    
    return { success: true, updated: results.length };
  } catch (error: any) {
    console.error('Error updating app settings:', error);
    throw new Error(error.message || 'Failed to update app settings');
  }
}

export async function initializeDefaultAppSettings() {
  try {
    await checkAdmin();
    const user = await getDbUser();

    const defaultSettings = [
      // Website Live Settings
      { key: 'website_live', value: 'true', type: 'BOOLEAN', category: 'website', description: 'Turn the entire website On and Off', isPublic: false },
      { key: 'shutdown_message', value: 'Come back soon', type: 'STRING', category: 'website', description: 'The text that is presented when the site is closed', isPublic: false },
      { key: 'system_email', value: 'admin@example.com', type: 'STRING', category: 'website', description: 'The contact email that all messages send to', isPublic: false },
      
      // Website Metadata
      { key: 'website_title', value: 'Socially App', type: 'STRING', category: 'metadata', description: 'Title of your website', isPublic: true },
      { key: 'website_description', value: 'Share your memories, connect with others, make new friends', type: 'STRING', category: 'metadata', description: 'Description of your website', isPublic: true },
      { key: 'website_keywords', value: 'social network, social platform, connect, friends', type: 'STRING', category: 'metadata', description: 'Keywords for SEO', isPublic: true },
      
      // Visual Customization
      { key: 'logo_light', value: '', type: 'IMAGE', category: 'visual', description: 'Logo for light mode', isPublic: true },
      { key: 'logo_dark', value: '', type: 'IMAGE', category: 'visual', description: 'Logo for dark mode', isPublic: true },
      { key: 'default_wallpaper', value: 'true', type: 'BOOLEAN', category: 'visual', description: 'Use the default wallpaper', isPublic: false },
      { key: 'custom_wallpaper', value: '', type: 'IMAGE', category: 'visual', description: 'Custom wallpaper image', isPublic: true },
      { key: 'landing_page_layout', value: 'elengine', type: 'STRING', category: 'visual', description: 'Landing page layout theme', isPublic: false },
      { key: 'default_favicon', value: 'true', type: 'BOOLEAN', category: 'visual', description: 'Use the default favicon', isPublic: false },
      { key: 'custom_favicon', value: '', type: 'IMAGE', category: 'visual', description: 'Custom favicon image', isPublic: true },
      { key: 'default_og_image', value: 'true', type: 'BOOLEAN', category: 'visual', description: 'Use the default OG image', isPublic: false },
      { key: 'custom_og_image', value: '', type: 'IMAGE', category: 'visual', description: 'Custom Open Graph image', isPublic: true },
      
      // System Settings
      { key: 'datetime_format', value: 'd/m/Y H:i', type: 'STRING', category: 'system', description: 'System datetime format', isPublic: false },
      { key: 'distance_unit', value: 'kilometer', type: 'STRING', category: 'system', description: 'System distance unit', isPublic: false },
      
      // Advanced Settings
      { key: 'website_public', value: 'false', type: 'BOOLEAN', category: 'advanced', description: 'Make the website public to allow non logged users to view website content', isPublic: true },
      { key: 'newsfeed_public', value: 'false', type: 'BOOLEAN', category: 'advanced', description: 'Make newsfeed public to allow non logged users to view posts', isPublic: true },
      { key: 'directory_enabled', value: 'true', type: 'BOOLEAN', category: 'advanced', description: 'Enable user directory for public browsing', isPublic: true },
      { key: 'night_mode_default', value: 'false', type: 'BOOLEAN', category: 'advanced', description: 'Default to night mode for new users', isPublic: true },
      { key: 'users_can_change_mode', value: 'true', type: 'BOOLEAN', category: 'advanced', description: 'Allow users to change theme mode', isPublic: true },
    ];

    await Promise.all(
      defaultSettings.map(({ key, value, type, category, description, isPublic }) =>
        prisma.appSetting.upsert({
          where: { key },
          update: {},
          create: {
            key,
            value,
            type: type as any,
            category,
            description,
            isPublic,
            updatedBy: user.id
          }
        })
      )
    );

    // Do not call revalidatePath here because this function can be invoked
    // during a page render (e.g., first load when no settings exist).
    // Next.js requires revalidation to happen outside of render.
    return { success: true, initialized: defaultSettings.length };
  } catch (error: any) {
    console.error('Error initializing default app settings:', error);
    throw new Error(error.message || 'Failed to initialize default app settings');
  }
}