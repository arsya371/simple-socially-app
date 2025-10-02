"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type UserActionParams = {
  userId: string;
  role?: "USER" | "MODERATOR" | "DEVELOPER" | "ADMIN";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  statusReason?: string;
};

async function checkAdminPermission() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = await prisma.user.findFirst({
    where: {
      clerkId: user.id,
      role: "ADMIN",
    },
  });

  if (!admin) throw new Error("Unauthorized: Admin access required");
}

import { logRoleChange, logStatusChange } from '@/lib/logger';

export async function updateUserRole({ userId, role }: UserActionParams) {
  await checkAdminPermission();
  const admin = await currentUser();
  
  // Get current user role before update
  const currentUserData = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  // Log the role change
  await logRoleChange(
    userId,
    currentUserData?.role || 'USER',
    role || 'USER',
    admin?.id || 'system'
  );

  revalidatePath("/admin");
  return user;
}

export async function updateUserStatus({ userId, status, statusReason }: UserActionParams) {
  await checkAdminPermission();
  const admin = await currentUser();

  // Get current user status before update
  const currentUserData = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true }
  });
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      statusReason,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: admin!.id,
    },
  });

  // Log the status change
  await logStatusChange(
    userId,
    currentUserData?.status || 'ACTIVE',
    status || 'ACTIVE',
    statusReason || 'No reason provided',
    admin!.id
  );

  revalidatePath("/admin");
  return user;
}

export async function getSettings(keys?: string[]) {
  try {
    let where = {};
    if (keys && keys.length > 0) {
      where = {
        key: {
          in: keys
        }
      };
    }

    const settings = await prisma.setting.findMany({
      where,
      select: {
        key: true,
        value: true
      }
    });

    // Convert array of settings to an object
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

export async function getSystemMetrics() {
  await checkAdminPermission();

  try {
    const metrics = await prisma.systemMetric.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const [totalUsers, totalPosts, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.report.count({
        where: { status: "PENDING" },
      }),
    ]);

    return {
      success: true,
      metrics: {
        ...metrics,
        totalUsers,
        totalPosts,
        pendingReports,
      },
    };
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    return { success: false, error: "Failed to fetch system metrics" };
  }
}

export async function updateSystemSettings(key: string, value: string) {
  await checkAdminPermission();

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    revalidatePath("/admin");
    return { success: true, setting };
  } catch (error) {
    console.error("Error updating system setting:", error);
    return { success: false, error: "Failed to update system setting" };
  }
}