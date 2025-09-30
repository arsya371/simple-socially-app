"use server";

import { checkRole, logAdminAction } from "./auth.action";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAdminActionNotification } from "./admin-notification.action";
import { NotificationType } from "@prisma/client";

// Ban a user for a specified duration or permanently
export async function banUser(userId: string, duration: number | null) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const banUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        bannedUntil: banUntil,
        isActive: false
      }
    });

    await Promise.all([
      logAdminAction(
        "BAN_USER",
        `${duration ? `Banned user ${user.username} for ${duration} days` : `Permanently banned user ${user.username}`}`,
        userId
      ),
      createAdminActionNotification({
        userId,
        type: NotificationType.ACCOUNT_BANNED,
        message: `Your account has been banned ${duration ? `for ${duration} days` : 'permanently'}. Contact support for more information.`
      })
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error banning user:", error);
    throw error;
  }
}

// Unban a user
export async function unbanUser(userId: string) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        bannedUntil: null,
        isActive: true
      }
    });

    await logAdminAction(
      "UNBAN_USER",
      `Unbanned user ${user.username}`,
      userId
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error unbanning user:", error);
    throw error;
  }
}

// Suspend a user temporarily
export async function suspendUser(userId: string, duration: number) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const suspendUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        suspendedUntil: suspendUntil
      }
    });

    await Promise.all([
      logAdminAction(
        "SUSPEND_USER",
        `Suspended user ${user.username} for ${duration} days`,
        userId
      ),
      createAdminActionNotification({
        userId,
        type: NotificationType.ACCOUNT_SUSPENDED,
        message: `Your account has been suspended for ${duration} days. Contact support for more information.`
      })
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error suspending user:", error);
    throw error;
  }
}

// Remove suspension from a user
export async function removeSuspension(userId: string) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        suspendedUntil: null
      }
    });

    await Promise.all([
      logAdminAction(
        "REMOVE_SUSPENSION",
        `Removed suspension from user ${user.username}`,
        userId
      ),
      createAdminActionNotification({
        userId,
        type: NotificationType.ACCOUNT_ACTIVATED,
        message: "Your account suspension has been removed. You can now access all features."
      })
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error removing suspension:", error);
    throw error;
  }
}

// Update user suspension duration
export async function updateSuspensionDuration(userId: string, newDuration: number | null) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const suspendUntil = newDuration ? new Date(Date.now() + newDuration * 24 * 60 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        suspendedUntil: suspendUntil,
        isActive: !suspendUntil
      }
    });

    await Promise.all([
      logAdminAction(
        "UPDATE_SUSPENSION",
        `Updated suspension duration for user ${user.username} to ${newDuration ? `${newDuration} days` : 'removed'}`,
        userId
      ),
      createAdminActionNotification({
        userId,
        type: newDuration ? NotificationType.ACCOUNT_SUSPENDED : NotificationType.ACCOUNT_ACTIVATED,
        message: newDuration 
          ? `Your account suspension has been updated to ${newDuration} days.`
          : "Your account suspension has been removed. You can now access all features."
      })
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating suspension duration:", error);
    throw error;
  }
}