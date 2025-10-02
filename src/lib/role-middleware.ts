import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";

export type RoleAuthResult = {
  isAuthorized: boolean;
  user?: {
    id: string;
    role: string;
  } | null;
  error?: string;
};

export async function checkRoleAuth(allowedRoles: string[]): Promise<RoleAuthResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        isAuthorized: false,
        error: "Unauthorized: Please sign in",
      };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user || !allowedRoles.includes(user.role)) {
      return {
        isAuthorized: false,
        user,
        error: "You do not have permission to access this resource",
      };
    }

    return {
      isAuthorized: true,
      user,
    };
  } catch (error) {
    console.error("Role auth error:", error);
    return {
      isAuthorized: false,
      error: "Authentication error occurred",
    };
  }
}