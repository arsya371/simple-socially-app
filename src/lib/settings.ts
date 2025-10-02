import prisma from "./prisma";

export async function getSettings() {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });

    return settings.reduce((acc: { [key: string]: string }, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {};
  }
}

// Cache the settings for 1 minute
let cachedSettings: { [key: string]: string } | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function getCachedSettings() {
  const now = Date.now();
  if (!cachedSettings || now - lastFetch > CACHE_DURATION) {
    cachedSettings = await getSettings();
    lastFetch = now;
  }
  return cachedSettings;
}