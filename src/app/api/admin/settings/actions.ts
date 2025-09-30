"use server";

import { currentUser } from "@clerk/nextjs/server";
import { checkRole } from "@/actions/auth.action";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clearSettingsCache } from "@/lib/app-settings";

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

// Validation function for moderation settings
function validateModerationSettings(formData: FormData) {
  const prohibitedKeywordsRaw = formData.get("prohibited_keywords")?.toString() || "";
  const censoredDomainsRaw = formData.get("censored_domains")?.toString() || "";

  // Convert comma-separated strings to JSON array strings on the server
  const keywords = prohibitedKeywordsRaw.split(',').map(word => word.trim()).filter(Boolean);
  const domains = censoredDomainsRaw.split(',').map(domain => domain.trim()).filter(Boolean);

  const prohibitedKeywords = JSON.stringify(keywords);
  const censoredDomains = JSON.stringify(domains);

  const censoredWordsEnabled = formData.get("censored_words_enabled") === "true";
  const censoredDomainsEnabled = formData.get("censored_domains_enabled") === "true";
  const requireApproval = formData.get("require-approval") === "true";
  const reportThreshold = parseInt(formData.get("report_threshold")?.toString() || "5", 10);
  const violationThreshold = parseInt(formData.get("violation_threshold")?.toString() || "3", 10);
  const suspensionDurationHours = parseInt(formData.get("suspension_duration_hours")?.toString() || "24", 10);

  return {
    prohibitedKeywords,
    censoredDomains,
    censoredWordsEnabled,
    censoredDomainsEnabled,
    requireApproval,
    reportThreshold,
    violationThreshold,
    suspensionDurationHours,
  };
}

// Server Action for Moderation Settings
export async function updateModerationSettings(formData: FormData) {
  try {
    await checkAdmin();
    const user = await getDbUser();
    const validated = validateModerationSettings(formData);

    const settings = [
      { key: 'prohibited_keywords', value: validated.prohibitedKeywords, type: 'JSON', category: 'moderation' },
      { key: 'censored_domains', value: validated.censoredDomains, type: 'JSON', category: 'moderation' },
      { key: 'censored_words_enabled', value: String(validated.censoredWordsEnabled), type: 'BOOLEAN', category: 'moderation' },
      { key: 'censored_domains_enabled', value: String(validated.censoredDomainsEnabled), type: 'BOOLEAN', category: 'moderation' },
      { key: 'require_post_approval', value: String(validated.requireApproval), type: 'BOOLEAN', category: 'moderation' },
      { key: 'report_threshold', value: String(validated.reportThreshold), type: 'NUMBER', category: 'moderation' },
      { key: 'violation_threshold', value: String(validated.violationThreshold), type: 'NUMBER', category: 'moderation' },
      { key: 'suspension_duration_hours', value: String(validated.suspensionDurationHours), type: 'NUMBER', category: 'moderation' }
    ];

    await prisma.$transaction(
      settings.map(s => prisma.appSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, type: s.type, category: s.category, updatedBy: user.id },
        create: { ...s, updatedBy: user.id, isPublic: false, description: '' }
      }))
    );
    
    clearSettingsCache();
    revalidatePath('/admin/settings');
  } catch (error: any) {
    console.error('Error updating moderation settings:', error);
    throw new Error(error.message || 'Failed to update moderation settings');
  }
}

// Server Action for Security Settings
export async function updateSecuritySettings(formData: FormData) {
  try {
    await checkAdmin();
    const user = await getDbUser();
    const allowSignups = formData.get("allow-signups") === "true";
    const autoSuspend = formData.get("auto-suspend")?.toString() || "0";
    const maxLoginAttempts = formData.get("max-login-attempts")?.toString() || "5";

    const settings = [
        { key: 'allow-signups', value: String(allowSignups), type: 'BOOLEAN', category: 'security' },
        { key: 'auto-suspend', value: autoSuspend, type: 'NUMBER', category: 'security' },
        { key: 'max-login-attempts', value: maxLoginAttempts, type: 'NUMBER', category: 'security' }
    ];

    await prisma.$transaction(
        settings.map(s => prisma.appSetting.upsert({
            where: { key: s.key },
            update: { value: s.value, type: s.type, category: s.category, updatedBy: user.id },
            create: { ...s, updatedBy: user.id, isPublic: false, description: '' }
        }))
    );

    clearSettingsCache();
    revalidatePath('/admin/settings');
  } catch (error: any) {
    console.error('Error updating security settings:', error);
    throw new Error(error.message || 'Failed to update security settings');
  }
}

// Server Action for API Settings
export async function updateApiSettings(formData: FormData) {
  try {
    await checkAdmin();
    const user = await getDbUser();
    const apiEnabled = formData.get("api-enabled") === "true";
    const rateLimitRequests = formData.get("rate-limit-requests")?.toString() || "100";
    const rateLimitWindow = formData.get("rate-limit-window")?.toString() || "60";

    const settings = [
        { key: 'api-enabled', value: String(apiEnabled), type: 'BOOLEAN', category: 'api' },
        { key: 'rate-limit-requests', value: rateLimitRequests, type: 'NUMBER', category: 'api' },
        { key: 'rate-limit-window', value: rateLimitWindow, type: 'NUMBER', category: 'api' }
    ];

    await prisma.$transaction(
        settings.map(s => prisma.appSetting.upsert({
            where: { key: s.key },
            update: { value: s.value, type: s.type, category: s.category, updatedBy: user.id },
            create: { ...s, updatedBy: user.id, isPublic: false, description: '' }
        }))
    );

    clearSettingsCache();
    revalidatePath('/admin/settings');
  } catch (error: any) {
    console.error('Error updating API settings:', error);
    throw new Error(error.message || 'Failed to update API settings');
  }
}



// 2. GEMINI (NOT SAVE IN DATABASE)
// "use server";

// import { currentUser } from "@clerk/nextjs/server";
// import { checkRole } from "@/actions/auth.action";
// import prisma from "@/lib/prisma";
// import { revalidatePath } from "next/cache";
// import { clearSettingsCache } from "@/lib/app-settings";

// async function getDbUser() {
//   const user = await currentUser();
//   if (!user) {
//     throw new Error("Not authenticated");
//   }

//   const dbUser = await prisma.user.findUnique({
//     where: { clerkId: user.id },
//     select: { id: true }
//   });

//   if (!dbUser) {
//     throw new Error("User not found");
//   }

//   return dbUser;
// }

// async function checkAdmin() {
//   const isAdmin = await checkRole(["ADMIN"]);
//   if (!isAdmin) {
//     throw new Error("Not authorized");
//   }
// }

// // Validation function for moderation settings
// function validateModerationSettings(formData: FormData) {
//   const prohibitedKeywords = formData.get("prohibited_keywords")?.toString() || "[]";
//   const censoredDomains = formData.get("censored_domains")?.toString() || "[]";
//   const censoredWordsEnabled = formData.get("censored_words_enabled") === "true";
//   const censoredDomainsEnabled = formData.get("censored_domains_enabled") === "true";
//   const requireApproval = formData.get("require-approval") === "true";
//   const reportThreshold = parseInt(formData.get("report_threshold")?.toString() || "5", 10);
//   const violationThreshold = parseInt(formData.get("violation_threshold")?.toString() || "3", 10);
//   const suspensionDurationHours = parseInt(formData.get("suspension_duration_hours")?.toString() || "24", 10);

//   return {
//     prohibitedKeywords,
//     censoredDomains,
//     censoredWordsEnabled,
//     censoredDomainsEnabled,
//     requireApproval,
//     reportThreshold,
//     violationThreshold,
//     suspensionDurationHours,
//   };
// }

// // Server Action for Moderation Settings
// export async function updateModerationSettings(formData: FormData) {
//   try {
//     await checkAdmin();
//     const user = await getDbUser();
//     const validated = validateModerationSettings(formData);

//     const settings = [
//       { key: 'prohibited_keywords', value: validated.prohibitedKeywords, type: 'JSON', category: 'moderation' },
//       { key: 'censored_domains', value: validated.censoredDomains, type: 'JSON', category: 'moderation' },
//       { key: 'censored_words_enabled', value: String(validated.censoredWordsEnabled), type: 'BOOLEAN', category: 'moderation' },
//       { key: 'censored_domains_enabled', value: String(validated.censoredDomainsEnabled), type: 'BOOLEAN', category: 'moderation' },
//       { key: 'require_post_approval', value: String(validated.requireApproval), type: 'BOOLEAN', category: 'moderation' },
//       { key: 'report_threshold', value: String(validated.reportThreshold), type: 'NUMBER', category: 'moderation' },
//       { key: 'violation_threshold', value: String(validated.violationThreshold), type: 'NUMBER', category: 'moderation' },
//       { key: 'suspension_duration_hours', value: String(validated.suspensionDurationHours), type: 'NUMBER', category: 'moderation' }
//     ];

//     await prisma.$transaction(
//       settings.map(s => prisma.appSetting.upsert({
//         where: { key: s.key },
//         update: { value: s.value, type: s.type, category: s.category, updatedBy: user.id },
//         create: { ...s, updatedBy: user.id }
//       }))
//     );
    
//     clearSettingsCache();
//     revalidatePath('/admin/settings');
//   } catch (error: any) {
//     console.error('Error updating moderation settings:', error);
//     throw new Error(error.message || 'Failed to update moderation settings');
//   }
// }

// // Server Action for Security Settings
// export async function updateSecuritySettings(formData: FormData) {
//   try {
//     await checkAdmin();
//     const user = await getDbUser();
//     const allowSignups = formData.get("allow-signups") === "true";
//     const autoSuspend = formData.get("auto-suspend")?.toString() || "0";
//     const maxLoginAttempts = formData.get("max-login-attempts")?.toString() || "5";

//     const settings = [
//         { key: 'allow-signups', value: String(allowSignups), type: 'BOOLEAN', category: 'security' },
//         { key: 'auto-suspend', value: autoSuspend, type: 'NUMBER', category: 'security' },
//         { key: 'max-login-attempts', value: maxLoginAttempts, type: 'NUMBER', category: 'security' }
//     ];

//     await prisma.$transaction(
//         settings.map(s => prisma.appSetting.upsert({
//             where: { key: s.key },
//             update: { value: s.value, type: s.type, category: s.category, updatedBy: user.id },
//             create: { ...s, updatedBy: user.id }
//         }))
//     );

//     clearSettingsCache();
//     revalidatePath('/admin/settings');
//   } catch (error: any) {
//     console.error('Error updating security settings:', error);
//     throw new Error(error.message || 'Failed to update security settings');
//   }
// }

// // Server Action for API Settings
// export async function updateApiSettings(formData: FormData) {
//   try {
//     await checkAdmin();
//     const user = await getDbUser();
//     const apiEnabled = formData.get("api-enabled") === "true";
//     const rateLimitRequests = formData.get("rate-limit-requests")?.toString() || "100";
//     const rateLimitWindow = formData.get("rate-limit-window")?.toString() || "60";

//     const settings = [
//         { key: 'api-enabled', value: String(apiEnabled), type: 'BOOLEAN', category: 'api' },
//         { key: 'rate-limit-requests', value: rateLimitRequests, type: 'NUMBER', category: 'api' },
//         { key: 'rate-limit-window', value: rateLimitWindow, type: 'NUMBER', category: 'api' }
//     ];

//     await prisma.$transaction(
//         settings.map(s => prisma.appSetting.upsert({
//             where: { key: s.key },
//             update: { value: s.value, type: s.type, category: s.category, updatedBy: user.id },
//             create: { ...s, updatedBy: user.id }
//         }))
//     );

//     clearSettingsCache();
//     revalidatePath('/admin/settings');
//   } catch (error: any) {
//     console.error('Error updating API settings:', error);
//     throw new Error(error.message || 'Failed to update API settings');
//   }
// }



// 1. CURSOR
// "use server";

// import { currentUser } from "@clerk/nextjs/server";
// import { checkRole } from "@/actions/auth.action";
// import prisma from "@/lib/prisma";
// import { revalidatePath } from "next/cache";

// async function getDbUser() {
//   const user = await currentUser();
//   if (!user) {
//     throw new Error("Not authenticated");
//   }

//   const dbUser = await prisma.user.findUnique({
//     where: { clerkId: user.id },
//     select: { id: true }
//   });

//   if (!dbUser) {
//     throw new Error("User not found");
//   }

//   return dbUser;
// }

// async function checkAdmin() {
//   const isAdmin = await checkRole(["ADMIN"]);
//   if (!isAdmin) {
//     throw new Error("Not authorized");
//   }
// }



// // Validation functions
// function validateGeneralSettings(formData: FormData) {
//   const siteName = formData.get("site-name")?.toString();
//   const siteDesc = formData.get("site-description")?.toString();
//   const email = formData.get("contact-email")?.toString();

//   if (!siteName || siteName.length < 2) {
//     throw new Error("Site name must be at least 2 characters long");
//   }
  
//   if (email && !email.includes("@")) {
//     throw new Error("Invalid email format");
//   }

//   return { siteName, siteDesc, email };
// }

// function validateSecuritySettings(formData: FormData) {
//   const maxLoginAttempts = parseInt(formData.get("max-login-attempts")?.toString() || "5");
//   const autoSuspend = parseInt(formData.get("auto-suspend")?.toString() || "0");
//   const allowSignups = formData.get("allow-signups")?.toString() === "true";

//   if (maxLoginAttempts < 1) {
//     throw new Error("Max login attempts must be at least 1");
//   }

//   if (autoSuspend < 0) {
//     throw new Error("Auto-suspend threshold cannot be negative");
//   }

//   return { maxLoginAttempts, autoSuspend, allowSignups };
// }

// function validateModerationSettings(formData: FormData) {
//   // Get form values
//   const prohibitedKeywords = formData.get("prohibited_keywords")?.toString() || "";
//   const censoredDomains = formData.get("censored_domains")?.toString() || "";
//   const censoredWordsEnabled = formData.get("censored_words_enabled")?.toString() === "true";
//   const censoredDomainsEnabled = formData.get("censored_domains_enabled")?.toString() === "true";
//   const requireApproval = formData.get("require-approval")?.toString() === "true";
//   const reportThreshold = parseInt(formData.get("report-threshold")?.toString() || "5");
//   const violationThreshold = parseInt(formData.get("violation_threshold")?.toString() || "3");
//   const suspensionDurationHours = parseInt(formData.get("suspension_duration_hours")?.toString() || "24");

//   // Parse comma-separated keywords and domains
//   const keywords = prohibitedKeywords
//     .split(',')
//     .map(word => word.trim())
//     .filter(word => word.length > 0);
    
//   const domains = censoredDomains
//     .split(',')
//     .map(domain => domain.trim())
//     .filter(domain => domain.length > 0);

//   if (keywords.some(word => word.includes(' '))) {
//     throw new Error("Each prohibited word must be on a separate line without spaces");
//   }

//   if (reportThreshold < 1) {
//     throw new Error("Report threshold must be at least 1");
//   }

//   if (violationThreshold < 1) {
//     throw new Error("Violation threshold must be at least 1");
//   }

//   if (suspensionDurationHours < 1) {
//     throw new Error("Suspension duration must be at least 1 hour");
//   }

//   return { 
//     prohibitedKeywords: JSON.stringify(keywords),
//     censoredDomains: JSON.stringify(domains),
//     censoredWordsEnabled,
//     censoredDomainsEnabled,
//     requireApproval,
//     reportThreshold,
//     violationThreshold,
//     suspensionDurationHours
//   };
// }

// function validateApiSettings(formData: FormData) {
//   const apiEnabled = formData.get("api-enabled")?.toString() === "true";
//   const rateLimitRequests = parseInt(formData.get("rate-limit-requests")?.toString() || "100");
//   const rateLimitWindow = parseInt(formData.get("rate-limit-window")?.toString() || "60");

//   if (rateLimitRequests < 1) {
//     throw new Error("Rate limit requests must be at least 1");
//   }

//   if (rateLimitWindow < 1) {
//     throw new Error("Rate limit window must be at least 1 second");
//   }

//   return { apiEnabled, rateLimitRequests, rateLimitWindow };
// }

// // Server actions
// export async function updateGeneralSettings(formData: FormData) {
//   try {
//     await checkAdmin();
//     const user = await getDbUser();
//     const { siteName, siteDesc, email } = validateGeneralSettings(formData);

//     const settings = {
//       'site-name': siteName,
//       'site-description': siteDesc || "",
//       'contact-email': email || "",
//     };

//     await Promise.all(
//       Object.entries(settings).map(([key, value]) =>
//         prisma.siteSetting.upsert({
//           where: { key },
//           update: {
//             value,
//             updatedBy: user.id,
//           },
//           create: {
//             key,
//             value,
//             category: 'general',
//             updatedBy: user.id,
//           },
//         })
//       )
//     );

//     revalidatePath('/admin/settings');
//   } catch (error: any) {
//     console.error('Error updating general settings:', error);
//     throw new Error(error.message || 'Failed to update general settings');
//   }
// }

// export async function updateSecuritySettings(formData: FormData) {
//   try {
//     await checkAdmin();
//     const user = await getDbUser();
//     const { maxLoginAttempts, autoSuspend, allowSignups } = validateSecuritySettings(formData);

//     const settings = {
//       'max-login-attempts': maxLoginAttempts.toString(),
//       'auto-suspend': autoSuspend.toString(),
//       'allow-signups': allowSignups.toString(),
//     };

//     await Promise.all(
//       Object.entries(settings).map(([key, value]) =>
//         prisma.siteSetting.upsert({
//           where: { key },
//           update: {
//             value,
//             updatedBy: user.id,
//           },
//           create: {
//             key,
//             value,
//             category: 'security',
//             updatedBy: user.id,
//           },
//         })
//       )
//     );

//     revalidatePath('/admin/settings');
//   } catch (error: any) {
//     console.error('Error updating security settings:', error);
//     throw new Error(error.message || 'Failed to update security settings');
//   }
// }

// export async function updateModerationSettings(formData: FormData) {
//   try {
//     await checkAdmin();
//     const user = await getDbUser();
//     const { 
//       prohibitedKeywords,
//       censoredDomains,
//       censoredWordsEnabled,
//       censoredDomainsEnabled,
//       requireApproval,
//       reportThreshold,
//       violationThreshold,
//       suspensionDurationHours
//     } = validateModerationSettings(formData);

//     const settings = {
//       'prohibited_keywords': prohibitedKeywords,
//       'censored_domains': censoredDomains,
//       'censored_words_enabled': censoredWordsEnabled.toString(),
//       'censored_domains_enabled': censoredDomainsEnabled.toString(),
//       'require_post_approval': requireApproval.toString(),
//       'report_threshold': reportThreshold.toString(),
//       'violation_threshold': violationThreshold.toString(),
//       'suspension_duration_hours': suspensionDurationHours.toString()
//     };

//     await Promise.all(
//       Object.entries(settings).map(([key, value]) =>
//         prisma.siteSetting.upsert({
//           where: { key },
//           update: {
//             value,
//             updatedBy: user.id,
//           },
//           create: {
//             key,
//             value,
//             category: 'moderation',
//             updatedBy: user.id,
//           },
//         })
//       )
//     );

//     revalidatePath('/admin/settings');
//   } catch (error: any) {
//     console.error('Error updating moderation settings:', error);
//     throw new Error(error.message || 'Failed to update moderation settings');
//   }
// }

// export async function updateApiSettings(formData: FormData) {
//   try {
//     await checkAdmin();
//     const user = await getDbUser();
//     const { apiEnabled, rateLimitRequests, rateLimitWindow } = validateApiSettings(formData);

//     const settings = {
//       'api-enabled': apiEnabled.toString(),
//       'rate-limit-requests': rateLimitRequests.toString(),
//       'rate-limit-window': rateLimitWindow.toString(),
//     };

//     await Promise.all(
//       Object.entries(settings).map(([key, value]) =>
//         prisma.siteSetting.upsert({
//           where: { key },
//           update: {
//             value,
//             updatedBy: user.id,
//           },
//           create: {
//             key,
//             value,
//             category: 'api',
//             updatedBy: user.id,
//           },
//         })
//       )
//     );

//     revalidatePath('/admin/settings');
//   } catch (error: any) {
//     console.error('Error updating API settings:', error);
//     throw new Error(error.message || 'Failed to update API settings');
//   }
// }