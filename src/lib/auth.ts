import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "./prisma";

export async function getCurrentUser(req?: NextRequest | null) {
  try {
    const { userId } = getAuth(req as NextRequest);

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
        suspendedUntil: true,
        bio: true,
        image: true,
        name: true
      }
    });

    if (!user) {
      return null;
    }

    if (!user.isActive && user.suspendedUntil) {
      const now = new Date();
      if (user.suspendedUntil > now) {
        return {
          ...user,
          isSuspended: true,
          suspensionEnds: user.suspendedUntil
        };
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: true,
            suspendedUntil: null
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