"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { moderateContent, handleViolation } from "@/lib/moderation";
import { createAdminActionNotification } from "./admin-notification.action";
import { NotificationType } from "@prisma/client";
import { getSystemUserId } from "@/lib/system-user";

type ModerationSettings = {
  blockedWords: string[];
  prohibitedWords: string[];
  warningThreshold: number;
  suspensionThreshold: number;
};

export async function validateModeratorAccess() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true
      }
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: Moderator access required");
    }

    return user;
  } catch (error) {
    console.error("Failed to validate moderator access:", error);
    throw new Error("Failed to validate moderator access");
  }
}

export async function createModeratedPost(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        isActive: true,
        suspendedUntil: true
      }
    });

    if (!user || !user.isActive || (user.suspendedUntil && user.suspendedUntil > new Date())) {
      throw new Error("Account is suspended or inactive");
    }

    const content = formData.get("content") as string;
    const image = formData.get("image") as string;

    const moderationResult = await moderateContent(content, user.id);
    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: moderationResult.censoredContent || content,
        image,
      }
    });

    if (moderationResult.hasViolation) {
      await prisma.contentViolation.create({
        data: {
          userId: user.id,
          type: "PROHIBITED_CONTENT",
          contentType: "POST",
          contentId: post.id,
        }
      });

      const recentViolations = await prisma.contentViolation.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (recentViolations >= 3) {
        await handleViolation(user.id);
      }
    }

    if (!moderationResult.isClean) {
      await prisma.contentViolation.create({
        data: {
          userId: user.id,
          type: "PROHIBITED_CONTENT",
          contentType: "POST",
          contentId: post.id,
        }
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creating moderated post:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createModeratedComment(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        isActive: true,
        suspendedUntil: true
      }
    });

    if (!user || !user.isActive || (user.suspendedUntil && user.suspendedUntil > new Date())) {
      throw new Error("Account is suspended or inactive");
    }

    const content = formData.get("content") as string;
    const postId = formData.get("postId") as string;

    const moderationResult = await moderateContent(content, user.id);

    if (moderationResult.hasViolation) {
      await handleViolation(user.id);
      throw new Error("Content violation detected. Your account has been suspended for 24 hours.");
    }

    const comment = await prisma.comment.create({
      data: {
        content: moderationResult.censoredContent || content,
        authorId: user.id,
        postId,
      }
    });

    if (!moderationResult.isClean) {
      await prisma.contentViolation.create({
        data: {
          userId: user.id,
          type: "PROHIBITED_CONTENT",
          contentType: "COMMENT",
          contentId: comment.id,
        }
      });
    }

    revalidatePath(`/posts/${postId}`);
    return { success: true };
  } catch (error) {
    console.error("Error creating moderated comment:", error);
    return { error: (error as Error).message };
  }
}

export async function updateBlockedWords(words: string[]) {
  try {
    const adminUser = await validateModeratorAccess();

    const setting = await prisma.siteSetting.upsert({
      where: { key: 'blocked_words' },
      update: {
        value: JSON.stringify(words),
        updatedBy: adminUser.id,
        updatedAt: new Date()
      },
      create: {
        key: 'blocked_words',
        value: JSON.stringify(words),
        category: 'moderation',
        updatedBy: adminUser.id
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        action: 'UPDATE_BLOCKED_WORDS',
        details: `Updated blocked words list: ${words.join(', ')}`,
        performedById: adminUser.id
      }
    });

    revalidatePath('/admin/settings');
    return { success: true, setting };
  } catch (error) {
    console.error("Error updating blocked words:", error);
    return { error: (error as Error).message };
  }
}

export async function updateProhibitedWords(words: string[]) {
  try {
    const adminUser = await validateModeratorAccess();

    const setting = await prisma.siteSetting.upsert({
      where: { key: 'prohibited_words' },
      update: {
        value: JSON.stringify(words),
        updatedBy: adminUser.id,
        updatedAt: new Date()
      },
      create: {
        key: 'prohibited_words',
        value: JSON.stringify(words),
        category: 'moderation',
        updatedBy: adminUser.id
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        action: 'UPDATE_PROHIBITED_WORDS',
        details: `Updated prohibited words list: ${words.join(', ')}`,
        performedById: adminUser.id
      }
    });

    revalidatePath('/admin/settings');
    return { success: true, setting };
  } catch (error) {
    console.error("Error updating prohibited words:", error);
    return { error: (error as Error).message };
  }
}

export async function updateViolationThresholds(
  thresholds: {
    suspensionThreshold: number;
    warningThreshold: number;
  }
) {
  try {
    const adminUser = await validateModeratorAccess();

    const suspensionSetting = await prisma.siteSetting.upsert({
      where: { key: 'suspension_threshold' },
      update: {
        value: thresholds.suspensionThreshold.toString(),
        updatedBy: adminUser.id,
        updatedAt: new Date()
      },
      create: {
        key: 'suspension_threshold',
        value: thresholds.suspensionThreshold.toString(),
        category: 'moderation',
        updatedBy: adminUser.id
      }
    });

    const warningSetting = await prisma.siteSetting.upsert({
      where: { key: 'warning_threshold' },
      update: {
        value: thresholds.warningThreshold.toString(),
        updatedBy: adminUser.id,
        updatedAt: new Date()
      },
      create: {
        key: 'warning_threshold',
        value: thresholds.warningThreshold.toString(),
        category: 'moderation',
        updatedBy: adminUser.id
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        action: 'UPDATE_VIOLATION_THRESHOLDS',
        details: `Updated thresholds - Warning: ${thresholds.warningThreshold}, Suspension: ${thresholds.suspensionThreshold}`,
        performedById: adminUser.id
      }
    });

    revalidatePath('/admin/settings');
    return { 
      success: true,
      settings: {
        suspensionThreshold: suspensionSetting,
        warningThreshold: warningSetting
      }
    };
  } catch (error) {
    console.error("Error updating violation thresholds:", error);
    return { error: (error as Error).message };
  }
}

export async function getModerationSettings(): Promise<{ success: boolean; settings?: ModerationSettings; error?: string }> {
  try {
    const adminUser = await validateModeratorAccess();

    const settings = await prisma.siteSetting.findMany({
      where: {
        category: 'moderation'
      }
    });

    const moderationSettings = settings.reduce((acc: any, setting: any) => {
      switch (setting.key) {
        case 'blocked_words':
          acc.blockedWords = JSON.parse(setting.value);
          break;
        case 'prohibited_words':
          acc.prohibitedWords = JSON.parse(setting.value);
          break;
        case 'warning_threshold':
          acc.warningThreshold = parseInt(setting.value, 10);
          break;
        case 'suspension_threshold':
          acc.suspensionThreshold = parseInt(setting.value, 10);
          break;
      }
      return acc;
    }, {
      blockedWords: [] as string[],
      prohibitedWords: [] as string[],
      warningThreshold: 3,
      suspensionThreshold: 5
    } as ModerationSettings);

    return { success: true, settings: moderationSettings };
  } catch (error) {
    console.error("Error getting moderation settings:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function handleReport(reportId: string, action: "DISMISS" | "DELETE" | "SUSPEND") {
  try {
    const adminUser = await validateModeratorAccess();

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: true,
        reportedUser: true,
        post: true,
        comment: true
      }
    });

    if (!report) {
      throw new Error("Report not found");
    }

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === "DISMISS" ? "DISMISSED" : "RESOLVED",
        reviewedBy: adminUser.id,
        actionTaken: action,
        updatedAt: new Date()
      }
    });

    if (action === "DELETE") {
      if (report.type === "POST" && report.postId) {
        await prisma.post.delete({
          where: { id: report.postId }
        });
      } else if (report.type === "COMMENT" && report.commentId) {
        await prisma.comment.delete({
          where: { id: report.commentId }
        });
      }
    }

    if (action === "SUSPEND" && report.reportedUserId) {
      const suspensionEnd = new Date();
      suspensionEnd.setHours(suspensionEnd.getHours() + 24); // 24 hour suspension

      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: {
          isActive: false,
          suspendedUntil: suspensionEnd
        }
      });

      // Create suspension notification
      await createAdminActionNotification({
        userId: report.reportedUserId,
        type: NotificationType.ACCOUNT_SUSPENDED,
        message: "Your account has been suspended for 24 hours due to a report. Contact support for more information."
      });
    }

    revalidatePath('/admin/reports');
    return { success: true };
  } catch (error) {
    console.error("Error handling report:", error);
    return { error: (error as Error).message };
  }
}