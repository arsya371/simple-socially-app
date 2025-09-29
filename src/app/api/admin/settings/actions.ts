"use server";

import { currentUser } from "@clerk/nextjs/server";
import { checkRole } from "@/actions/auth.action";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getDbUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true }
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  return dbUser;
}

async function checkAdmin() {
  const isAdmin = await checkRole(["ADMIN"]);
  if (!isAdmin) {
    throw new Error("Not authorized");
  }
}

// Validation functions
function validateGeneralSettings(formData: FormData) {
  const siteName = formData.get("site-name")?.toString();
  const siteDesc = formData.get("site-description")?.toString();
  const email = formData.get("contact-email")?.toString();

  if (!siteName || siteName.length < 2) {
    throw new Error("Site name must be at least 2 characters long");
  }
  
  if (email && !email.includes("@")) {
    throw new Error("Invalid email format");
  }

  return { siteName, siteDesc, email };
}

function validateSecuritySettings(formData: FormData) {
  const maxLoginAttempts = parseInt(formData.get("max-login-attempts")?.toString() || "5");
  const autoSuspend = parseInt(formData.get("auto-suspend")?.toString() || "0");
  const allowSignups = formData.get("allow-signups")?.toString() === "true";

  if (maxLoginAttempts < 1) {
    throw new Error("Max login attempts must be at least 1");
  }

  if (autoSuspend < 0) {
    throw new Error("Auto-suspend threshold cannot be negative");
  }

  return { maxLoginAttempts, autoSuspend, allowSignups };
}

function validateModerationSettings(formData: FormData) {
  const blockedWords = formData.get("blocked-words")?.toString() || "";
  const requireApproval = formData.get("require-approval")?.toString() === "true";
  const reportThreshold = parseInt(formData.get("report-threshold")?.toString() || "5");

  if (reportThreshold < 1) {
    throw new Error("Report threshold must be at least 1");
  }

  return { blockedWords, requireApproval, reportThreshold };
}

function validateApiSettings(formData: FormData) {
  const apiEnabled = formData.get("api-enabled")?.toString() === "true";
  const rateLimitRequests = parseInt(formData.get("rate-limit-requests")?.toString() || "100");
  const rateLimitWindow = parseInt(formData.get("rate-limit-window")?.toString() || "60");

  if (rateLimitRequests < 1) {
    throw new Error("Rate limit requests must be at least 1");
  }

  if (rateLimitWindow < 1) {
    throw new Error("Rate limit window must be at least 1 second");
  }

  return { apiEnabled, rateLimitRequests, rateLimitWindow };
}

// Server actions
export async function updateGeneralSettings(formData: FormData) {
  try {
    await checkAdmin();
    const user = await getDbUser();
    const { siteName, siteDesc, email } = validateGeneralSettings(formData);

    const settings = {
      'site-name': siteName,
      'site-description': siteDesc || "",
      'contact-email': email || "",
    };

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: {
            value,
            updatedBy: user.id,
          },
          create: {
            key,
            value,
            category: 'general',
            updatedBy: user.id,
          },
        })
      )
    );

    revalidatePath('/admin/settings');
  } catch (error: any) {
    console.error('Error updating general settings:', error);
    throw new Error(error.message || 'Failed to update general settings');
  }
}

export async function updateSecuritySettings(formData: FormData) {
  try {
    await checkAdmin();
    const user = await getDbUser();
    const { maxLoginAttempts, autoSuspend, allowSignups } = validateSecuritySettings(formData);

    const settings = {
      'max-login-attempts': maxLoginAttempts.toString(),
      'auto-suspend': autoSuspend.toString(),
      'allow-signups': allowSignups.toString(),
    };

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: {
            value,
            updatedBy: user.id,
          },
          create: {
            key,
            value,
            category: 'security',
            updatedBy: user.id,
          },
        })
      )
    );

    revalidatePath('/admin/settings');
  } catch (error: any) {
    console.error('Error updating security settings:', error);
    throw new Error(error.message || 'Failed to update security settings');
  }
}

export async function updateModerationSettings(formData: FormData) {
  try {
    await checkAdmin();
    const user = await getDbUser();
    const { blockedWords, requireApproval, reportThreshold } = validateModerationSettings(formData);

    const settings = {
      'blocked-words': blockedWords,
      'require-approval': requireApproval.toString(),
      'report-threshold': reportThreshold.toString(),
    };

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: {
            value,
            updatedBy: user.id,
          },
          create: {
            key,
            value,
            category: 'moderation',
            updatedBy: user.id,
          },
        })
      )
    );

    revalidatePath('/admin/settings');
  } catch (error: any) {
    console.error('Error updating moderation settings:', error);
    throw new Error(error.message || 'Failed to update moderation settings');
  }
}

export async function updateApiSettings(formData: FormData) {
  try {
    await checkAdmin();
    const user = await getDbUser();
    const { apiEnabled, rateLimitRequests, rateLimitWindow } = validateApiSettings(formData);

    const settings = {
      'api-enabled': apiEnabled.toString(),
      'rate-limit-requests': rateLimitRequests.toString(),
      'rate-limit-window': rateLimitWindow.toString(),
    };

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: {
            value,
            updatedBy: user.id,
          },
          create: {
            key,
            value,
            category: 'api',
            updatedBy: user.id,
          },
        })
      )
    );

    revalidatePath('/admin/settings');
  } catch (error: any) {
    console.error('Error updating API settings:', error);
    throw new Error(error.message || 'Failed to update API settings');
  }
}