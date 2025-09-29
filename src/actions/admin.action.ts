"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { checkRole, logAdminAction } from "./auth.action";
import { revalidatePath } from "next/cache";

// User Suspension Management
export async function removeSuspension(userId: string) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { suspendedUntil: null }
  });

  await logAdminAction(
    "REMOVE_SUSPENSION",
    `Removed suspension for user ${user.username}`,
    userId
  );

  revalidatePath("/admin/users");
  return { success: true };
}

// Reports Management
export async function getAllReports() {
  const isAuthorized = await checkRole(["ADMIN"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  return prisma.report.findMany({
    include: {
      post: {
        select: {
          content: true,
          author: {
            select: {
              username: true,
            },
          },
        },
      },
      comment: {
        select: {
          content: true,
          author: {
            select: {
              username: true,
            },
          },
        },
      },
      reportedUser: {
        select: {
          username: true,
          email: true,
        },
      },
      reporter: {
        select: {
          username: true,
        },
      },
      reviewer: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateReportStatus(
  reportId: string,
  status: "REVIEWED" | "RESOLVED" | "DISMISSED"
) {
  const isAuthorized = await checkRole(["ADMIN"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  const currentAdminUser = await currentUser();
  const adminDbUser = await prisma.user.findUnique({
    where: { clerkId: currentAdminUser?.id },
  });

  if (!adminDbUser) {
    throw new Error("Admin user not found");
  }

  const updatedReport = await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      reviewedBy: adminDbUser.id,
    },
  });

  await logAdminAction(
    "UPDATE_REPORT_STATUS",
    `Updated report ${reportId} status to ${status}`,
    reportId
  );

  revalidatePath("/admin/reports");
  return updatedReport;
}

// Site Settings Management
export async function getSiteSettings() {
  const isAuthorized = await checkRole(["ADMIN"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  return prisma.siteSetting.findMany({
    orderBy: {
      category: "asc",
    },
  });
}

export async function updateSiteSetting(key: string, value: string, category: string) {
  const isAuthorized = await checkRole(["ADMIN"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  const currentAdminUser = await currentUser();
  const adminDbUser = await prisma.user.findUnique({
    where: { clerkId: currentAdminUser?.id },
  });

  if (!adminDbUser) {
    throw new Error("Admin user not found");
  }

  const updatedSetting = await prisma.siteSetting.upsert({
    where: { key },
    update: {
      value,
      updatedBy: adminDbUser.id,
    },
    create: {
      key,
      value,
      category,
      updatedBy: adminDbUser.id,
    },
  });

  await logAdminAction(
    "UPDATE_SITE_SETTING",
    `Updated ${category} setting: ${key}`,
    key
  );

  revalidatePath("/admin/settings");
  return updatedSetting;
}

export async function updateUserRole(userId: string, newRole: "ADMIN" | "MODERATOR" | "USER") {
  const isAuthorized = await checkRole(["ADMIN"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await logAdminAction(
    "UPDATE_USER_ROLE",
    `Changed user role to ${newRole}`,
    userId
  );

  revalidatePath("/admin/users");
  return user;
}

export async function toggleUserStatus(userId: string) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await logAdminAction(
    "TOGGLE_USER_STATUS",
    `${updatedUser.isActive ? "Activated" : "Deactivated"} user account`,
    userId
  );

  revalidatePath("/admin/users");
  return updatedUser;
}