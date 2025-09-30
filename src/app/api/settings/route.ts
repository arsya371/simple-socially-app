import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRole } from "@/actions/auth.action";
import { currentUser } from "@clerk/nextjs/server";

// Default settings to initialize if they don't exist
const DEFAULT_SETTINGS = [
  // Visibility Settings
  { key: 'website_public', value: 'false', type: 'BOOLEAN', category: 'visibility', description: 'Make the website public', isPublic: true },
  { key: 'newsfeed_public', value: 'false', type: 'BOOLEAN', category: 'visibility', description: 'Make newsfeed public', isPublic: true },
  { key: 'directory_enabled', value: 'true', type: 'BOOLEAN', category: 'visibility', description: 'Enable directory', isPublic: true },
  
  // Theme Settings
  { key: 'night_mode_default', value: 'false', type: 'BOOLEAN', category: 'theme', description: 'Default to night mode', isPublic: true },
  { key: 'users_can_change_mode', value: 'true', type: 'BOOLEAN', category: 'theme', description: 'Allow users to change theme', isPublic: true },
  
  // SEO Settings
  { key: 'website_title', value: 'Simple Socially App', type: 'STRING', category: 'seo', description: 'Website title', isPublic: true },
  { key: 'website_description', value: 'Share your memories, connect with others, make new friends', type: 'STRING', category: 'seo', description: 'Website description', isPublic: true },
  { key: 'website_keywords', value: 'social network, social platform, connect, friends', type: 'STRING', category: 'seo', description: 'Website keywords', isPublic: true },
  
  // System Settings
  { key: 'system_email', value: 'admin@example.com', type: 'STRING', category: 'system', description: 'System email address', isPublic: false },
  { key: 'datetime_format', value: 'd/m/Y H:i', type: 'STRING', category: 'system', description: 'Datetime format', isPublic: false },
  { key: 'distance_unit', value: 'kilometer', type: 'STRING', category: 'system', description: 'Distance unit', isPublic: false },
];

async function initializeDefaultSettings(userId: string) {
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        ...setting,
        updatedBy: userId
      }
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public') === 'true';

    const where: any = {};
    if (category) where.category = category;
    if (isPublic) where.isPublic = true;

    const settings = await prisma.appSetting.findMany({
      where,
      orderBy: { category: 'asc' },
      include: {
        editor: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkRole(["ADMIN"]);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Initialize default settings if none exist
    const existingSettings = await prisma.appSetting.count();
    if (existingSettings === 0) {
      await initializeDefaultSettings(dbUser.id);
    }

    const body = await req.json();
    const { key, value, type, category, description, isPublic } = body;

    // Validate required fields
    if (!key || !value || !type || !category) {
      return NextResponse.json(
        { error: "Missing required fields: key, value, type, category" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['BOOLEAN', 'STRING', 'NUMBER', 'IMAGE', 'JSON'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: {
        value,
        type,
        category,
        description,
        isPublic: isPublic ?? false,
        updatedBy: dbUser.id,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        type,
        category,
        description,
        isPublic: isPublic ?? false,
        updatedBy: dbUser.id
      }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("[SETTINGS_POST]", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
