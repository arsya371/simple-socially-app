"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function checkRole(allowedRoles: ("ADMIN" | "MODERATOR" | "USER")[]) {
  try {
    const user = await currentUser();
    if (!user?.id) return false;
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    });

    if (!dbUser) return false;

    if (dbUser.role === "ADMIN") {
      return true;
    }

    if (dbUser.role === "MODERATOR") {
      return allowedRoles.includes("MODERATOR") || allowedRoles.includes("USER");
    }

    return allowedRoles.includes("USER");
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
}

export async function checkIsAdmin(clerkId?: string | null) {
  if (!clerkId) return false;
  
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true }
    });

    return dbUser?.role === "ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function logAdminAction(action: string, details?: string, performedOn?: string) {
  try {
    const user = await currentUser();
    if (!user?.id) return;
    
    console.log("[Admin Action]", {
      action,
      details,
      performedOn,
      performedBy: user.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}