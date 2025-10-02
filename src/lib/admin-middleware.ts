import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export type AdminAuthResult = {
  isAuthorized: boolean;
  user?: {
    id: string;
    role: string;
  } | null;
  error?: string;
};

export async function checkAdminAuth(): Promise<AdminAuthResult> {
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

    if (!user || user.role !== "ADMIN") {
      return {
        isAuthorized: false,
        error: "Unauthorized: Requires admin privileges",
      };
    }

    return {
      isAuthorized: true,
      user,
    };
  } catch (error) {
    console.error("Admin auth error:", error);
    return {
      isAuthorized: false,
      error: "Internal server error",
    };
  }
}