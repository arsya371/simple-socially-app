"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user || !user.emailAddresses[0]) return;

    const emailRaw = user.emailAddresses[0].emailAddress;
    const email = emailRaw.toLowerCase();
    const username = user.username ?? email.split("@")[0];
    
    // First check by clerk ID
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (dbUser) {
      // Update user info if needed
      return await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: email,
          username: username,
          image: user.imageUrl,
        }
      });
    }

    // Then check by email (case-insensitive)
    dbUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (dbUser) {
      // Update clerk ID and other info
      return await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          clerkId: userId,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          username: username,
          image: user.imageUrl,
        }
      });
    }

    // Finally, create new user if no existing user found
    try {
      return await prisma.user.create({
        data: {
          clerkId: userId,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          username: username,
          email: email,
          image: user.imageUrl,
        },
      });
    } catch (error) {
      const createError = error as any;
      // If email already exists (race condition), update existing by email
      if (createError?.code === 'P2002' && createError?.meta?.target?.includes('email')) {
        const existing = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });
        if (existing) {
          return await prisma.user.update({
            where: { id: existing.id },
            data: {
              clerkId: userId,
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              username: username,
              image: user.imageUrl,
            },
          });
        }
      }
      // If username is taken, append random numbers and retry create
      if (createError?.code === 'P2002' && createError?.meta?.target?.includes('username')) {
        const randomSuffix = Math.floor(Math.random() * 1000);
        return await prisma.user.create({
          data: {
            clerkId: userId,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            username: `${username}${randomSuffix}`,
            email: email,
            image: user.imageUrl,
          },
        });
      }
      throw error;
    }
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      console.log("No clerk ID found");
      return null;
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      // Try to sync user first
      await syncUser();
      // Try to get user again
      const syncedUser = await getUserByClerkId(clerkId);
      if (!syncedUser) {
        console.log("User not found even after sync");
        return null;
      }
      return syncedUser.id;
    }

    return user.id;
  } catch (error) {
    console.error("Error in getDbUserId:", error);
    return null;
  }
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    if (!userId) return [];

    // get 3 random users exclude ourselves & users that we already follow
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.log("Error fetching random users", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user following
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}