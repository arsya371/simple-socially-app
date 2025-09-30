import { getSetting, getPublicSettings, getAllSettings } from "@/actions/settings.action";

// Cache for settings to avoid repeated database calls
let settingsCache: Record<string, any> | null = null;
let allSettingsCache: Record<string, any> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedSettings() {
  const now = Date.now();
  
  if (!settingsCache || (now - cacheTimestamp) > CACHE_DURATION) {
    settingsCache = await getPublicSettings();
    cacheTimestamp = now;
  }
  
  return settingsCache;
}

async function getAllCachedSettings() {
  const now = Date.now();
  
  if (!allSettingsCache || (now - cacheTimestamp) > CACHE_DURATION) {
    const allSettings = await getAllSettings();
    allSettingsCache = {};
    allSettings.forEach(setting => {
      let value: any = setting.value;
      // Convert into native types
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
      allSettingsCache![setting.key] = value;
    });
    cacheTimestamp = now;
  }
  
  return allSettingsCache;
}

// Public utility functions for accessing app settings
export async function getAppSetting(key: string, defaultValue: any = null) {
  try {
    // Try to get from all settings first (includes private settings)
    const allSettings = await getAllCachedSettings();
    if (allSettings[key] !== undefined) {
      return allSettings[key];
    }
    
    // Fallback to public settings
    const settings = await getCachedSettings();
    return settings[key] ?? defaultValue;
  } catch (error) {
    console.error(`Error getting app setting ${key}:`, error);
    return defaultValue;
  }
}

export async function getWebsiteTitle() {
  return await getAppSetting('website_title', 'Socially App');
}

export async function getWebsiteDescription() {
  return await getAppSetting('website_description', 'Share your memories, connect with others, make new friends');
}

export async function getWebsiteKeywords() {
  return await getAppSetting('website_keywords', 'social network, social platform, connect, friends');
}

export async function isWebsiteLive() {
  return await getAppSetting('website_live', true);
}

export async function getShutdownMessage() {
  return await getAppSetting('shutdown_message', 'Come back soon');
}

export async function getSystemEmail() {
  return await getAppSetting('system_email', 'admin@example.com');
}

export async function getLogoLight() {
  return await getAppSetting('logo_light', '');
}

export async function getLogoDark() {
  return await getAppSetting('logo_dark', '');
}

export async function getCustomWallpaper() {
  return await getAppSetting('custom_wallpaper', '');
}

export async function isDefaultWallpaper() {
  return await getAppSetting('default_wallpaper', true);
}

export async function getLandingPageLayout() {
  return await getAppSetting('landing_page_layout', 'elengine');
}

export async function getCustomFavicon() {
  return await getAppSetting('custom_favicon', '');
}

export async function isDefaultFavicon() {
  return await getAppSetting('default_favicon', true);
}

export async function getCustomOgImage() {
  return await getAppSetting('custom_og_image', '');
}

export async function isDefaultOgImage() {
  return await getAppSetting('default_og_image', true);
}

export async function getDatetimeFormat() {
  return await getAppSetting('datetime_format', 'd/m/Y H:i');
}

export async function getDistanceUnit() {
  return await getAppSetting('distance_unit', 'kilometer');
}

export async function isWebsitePublic() {
  return await getAppSetting('website_public', false);
}

export async function isNewsfeedPublic() {
  return await getAppSetting('newsfeed_public', false);
}

export async function isDirectoryEnabled() {
  return await getAppSetting('directory_enabled', true);
}

export async function isNightModeDefault() {
  return await getAppSetting('night_mode_default', false);
}

export async function canUsersChangeMode() {
  return await getAppSetting('users_can_change_mode', true);
}

// Clear cache (useful after settings updates)
export function clearSettingsCache() {
  settingsCache = null;
  allSettingsCache = null;
  cacheTimestamp = 0;
}
