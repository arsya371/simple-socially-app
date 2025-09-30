import { getAuth, auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import prisma from "./prisma";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }
}

export async function getCurrentUser(req?: NextRequest | null) {
  try {
    // Use server-side auth() for server actions when no request is provided
    let userId: string | null;

    if (req) {
      // For middleware/edge functions
      userId = getAuth(req).userId;
    } else {
      // For server actions
      const authData = await auth();
      userId = authData.userId;
    }

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        banned: true,
        bannedUntil: true,
        bio: true,
        image: true,
        name: true
      }
    });

    if (!user) {
      return null;
    }

    if (user.banned && user.bannedUntil) {
      const now = new Date();
      if (user.bannedUntil > now) {
        return {
          ...user,
          isSuspended: true,
          suspensionEnds: user.bannedUntil
        };
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            banned: false,
            bannedUntil: null,
            isActive: true
          }
        });
      }
    }

    return {
      ...user,
      isSuspended: false,
      suspensionEnds: null
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}