import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withLogging } from "@/lib/api-wrapper";
import { checkRoleAuth } from "@/lib/role-middleware";

export const dynamic = 'force-dynamic';

// Default settings that should exist
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

async function initializeSettings() {
  const existingSettings = await prisma.setting.findMany();
  const existingKeys = existingSettings.map(s => s.key);
  
  // Create any missing default settings
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!existingKeys.includes(key)) {
      await prisma.setting.create({
        data: {
          key,
          value
        }
      });
    }
  }
}

export const GET = withLogging(async (req: NextRequest) => {
  const auth = await checkRoleAuth(["ADMIN"]);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error?.includes("sign in") ? 401 : 403 }
    );
  }

  try {
    await initializeSettings();
    const settings = await prisma.setting.findMany();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
});

export const POST = withLogging(async (req: NextRequest) => {
  const auth = await checkRoleAuth(["ADMIN"]);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error?.includes("sign in") ? 401 : 403 }
    );
  }

  try {
    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
});