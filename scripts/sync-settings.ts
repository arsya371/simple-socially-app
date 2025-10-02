import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  maintenanceMode: 'false',
  siteName: 'Next.js Social Platform',
  siteDescription: 'A modern social media application powered by Next.js',
  metaKeywords: 'social media,nextjs,react',
  metaDescription: 'A modern social media application powered by Next.js',
  maxUploadSize: '5',
  userRegistration: 'true',
  siteLogo: '',
  siteFavicon: ''
};

async function syncSettings() {
  console.log('Starting settings sync...');
  
  try {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await prisma.setting.upsert({
        where: { key },
        update: {},  // Don't update if exists
        create: {
          key,
          value
        }
      });
      console.log(`Synced setting: ${key}`);
    }
    
    console.log('Settings sync completed successfully!');
  } catch (error) {
    console.error('Error syncing settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncSettings();