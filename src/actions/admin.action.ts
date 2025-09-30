"use server";

import { currentUser } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRole, logAdminAction } from "./auth.action";
import { revalidatePath } from "next/cache";
import { createAdminActionNotification } from "./admin-notification.action";
import { NotificationType } from "@prisma/client";

// User Suspension Management
export async function toggleUserStatus(userId: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'VERIFY' | 'UNVERIFY' | 'TOGGLE_ACTIVE') {
  const isAuthorized = await checkRole(["ADMIN"]);
  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    const updates: any = {};
    switch (action) {
      case 'ACTIVATE':
        updates.activated = true;
        break;
      case 'DEACTIVATE':
        updates.activated = false;
        updates.isActive = false; // Also set isActive to false when deactivating
        break;
      case 'TOGGLE_ACTIVE': // New action to toggle isActive
        const currentUserStatus = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
        updates.isActive = !currentUserStatus?.isActive;
        break;
      case 'VERIFY':
        updates.verified = true;
        break;
      case 'UNVERIFY':
        updates.verified = false;
        break;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // Create appropriate notification based on action
    let notificationType: NotificationType | null = null;
    let notificationMessage = "";

    switch (action) {
      case 'ACTIVATE':
        notificationType = NotificationType.ACCOUNT_ACTIVATED;
        notificationMessage = "Your account has been activated. You can now access all features.";
        break;
      case 'DEACTIVATE':
        notificationType = NotificationType.ACCOUNT_STATUS_CHANGED;
        notificationMessage = "Your account has been deactivated. Please contact support for more information.";
        break;
      case 'VERIFY':
        notificationType = NotificationType.ACCOUNT_VERIFIED;
        notificationMessage = "Your account has been verified. Thank you for using our platform!";
        break;
      case 'UNVERIFY':
        notificationType = NotificationType.ACCOUNT_STATUS_CHANGED;
        notificationMessage = "Your account verification has been removed.";
        break;
      case 'TOGGLE_ACTIVE':
        const currentUserStatus = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
        if (currentUserStatus?.isActive) {
          notificationType = NotificationType.ACCOUNT_STATUS_CHANGED;
          notificationMessage = "Your account has been deactivated. Please contact support for more information.";
        } else {
          notificationType = NotificationType.ACCOUNT_ACTIVATED;
          notificationMessage = "Your account has been activated. You can now access all features.";
        }
        break;
    }

    await Promise.all([
      logAdminAction(
        action,
        `${action.toLowerCase()} user ${targetUser.username}`,
        userId
      ),
      ...(notificationType ? [createAdminActionNotification({
        userId,
        type: notificationType,
        message: notificationMessage
      })] : [])
    ]);

    revalidatePath("/admin/users");
    return { success: true, updatedUser: targetUser };
  } catch (error) {
    console.error(`Error ${action.toLowerCase()}ing user:`, error);
    throw error;
  }
}

// Ban a user for a specific duration
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

    const banUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null; // null for permanent ban

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
        `Banned user ${user.username} ${duration ? `for ${duration} days` : 'permanently'}`,
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
        bannedUntil: null
      }
    });

    await Promise.all([
      logAdminAction(
        "UNBAN_USER",
        `Unbanned user ${user.username}`,
        userId
      ),
      createAdminActionNotification({
        userId,
        type: NotificationType.ACCOUNT_ACTIVATED,
        message: "Your account ban has been removed. You can now access all features."
      })
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error unbanning user:", error);
    throw error;
  }
}

export async function removeBan(userId: string) {
  try {
    await requireAdmin();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        bannedUntil: null,
        isActive: true
      }
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error removing ban:", error);
    return { success: false, error: "Failed to remove ban" };
  }
}

export async function removeSuspension(userId: string) {
  try {
    const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
    if (!isAuthorized) throw new Error("Unauthorized");

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        suspendedUntil: null,
        isActive: true
      }
    });

    await Promise.all([
      logAdminAction(
        "REMOVE_SUSPENSION",
        `Removed suspension from user ${targetUser.username}`,
        userId
      ),
      createAdminActionNotification({
        userId,
        type: NotificationType.ACCOUNT_ACTIVATED,
        message: "Your account suspension has been removed. You can now access all features."
      })
    ]);

    revalidatePath("/admin/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error removing suspension:", error);
    return { success: false, error: "Failed to remove suspension" };
  }
}

export async function deleteUser(userId: string) {
  try {
    const isAuthorized = await checkRole(["ADMIN"]);
    if (!isAuthorized) {
      throw new Error("Not authorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    await logAdminAction(
      "DELETE_USER",
      `Deleted user ${user.username}`,
      userId
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function updateUser(userId: string, data: { name?: string; username?: string }) {
  try {
    const isAuthorized = await checkRole(["ADMIN"]);
    if (!isAuthorized) {
      throw new Error("Not authorized");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    await logAdminAction(
      "UPDATE_USER",
      `Updated user ${user.username}`,
      userId
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function updateUserRole(userId: string, newRole: "USER" | "MODERATOR" | "ADMIN") {
  try {
    const isAuthorized = await checkRole(["ADMIN"]);
    if (!isAuthorized) {
      throw new Error("Not authorized");
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, username: true }
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Don't allow changing own role
    const currentDbUser = await prisma.user.findFirst({
      where: { clerkId: user.id }
    });
    
    if (currentDbUser?.id === userId) {
      throw new Error("Cannot change your own role");
    }

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    await logAdminAction(
      "UPDATE_ROLE",
      `Changed user ${targetUser.username}'s role to ${newRole}`,
      userId
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user role:", error);
    throw new Error(error.message || "Failed to update user role");
  }
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

export async function getContentViolations() {
  try {
    const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    return await prisma.contentViolation.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            suspendedUntil: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching content violations:', error);
    throw new Error('Failed to fetch content violations');
  }
}

export async function suspendUser(userId: string, duration: number) {
  try {
    const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + duration);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        suspendedUntil,
        isActive: false
      }
    });

    await Promise.all([
      logAdminAction(
        "SUSPEND_USER",
        `Suspended user ${targetUser.username} for ${duration} days`,
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
    return { success: false, error: "Failed to suspend user" };
  }
}

export async function unsuspendUser(userId: string) {
  try {
    const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!targetUser) {
      throw new Error("User not found");
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        suspendedUntil: null,
        isActive: true
      }
    });

    await Promise.all([
      logAdminAction(
        "UNSUSPEND_USER",
        `Unsuspended user ${targetUser.username}`,
        userId
      ),
      createAdminActionNotification({
        userId,
        type: NotificationType.ACCOUNT_ACTIVATED,
        message: "Your account suspension has been removed. You can now access all features."
      })
    ]);
    
    revalidatePath("/admin/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error unsuspending user:", error);
    return { success: false, error: "Failed to unsuspend user" };
  }
}