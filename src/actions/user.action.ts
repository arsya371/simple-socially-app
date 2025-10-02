"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;

    // Try to find existing user by clerkId or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: userId },
          { email: user.emailAddresses[0].emailAddress }
        ]
      },
    });

    if (existingUser) {
      // Update the user with latest info from Clerk
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          clerkId: userId, // Ensure clerkId is set
          name: `${user.firstName || ""} ${user.lastName || ""}`,
          image: user.imageUrl,
          email: user.emailAddresses[0].emailAddress, // Update email if it changed
        },
      });
      return updatedUser;
    }

    // Generate a unique username if needed
    let username = user.username ?? user.emailAddresses[0].emailAddress.split("@")[0];
    let isUsernameTaken = true;
    let counter = 0;

    while (isUsernameTaken) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: counter === 0 ? username : `${username}${counter}` },
      });

      if (!existingUsername) {
        isUsernameTaken = false;
        if (counter > 0) {
          username = `${username}${counter}`;
        }
      } else {
        counter++;
      }
    }

    // Try to create new user with unique username, if it fails due to email conflict, update the existing user
    try {
      const dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          name: `${user.firstName || ""} ${user.lastName || ""}`,
          username: username,
          email: user.emailAddresses[0].emailAddress,
          image: user.imageUrl,
        },
      });
      return dbUser;
    } catch (error: any) {
      // If error is about unique constraint on email
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        // Update the existing user instead
        const existingUser = await prisma.user.update({
          where: { email: user.emailAddresses[0].emailAddress },
          data: {
            clerkId: userId,
            name: `${user.firstName || ""} ${user.lastName || ""}`,
            image: user.imageUrl,
          },
        });
        return existingUser;
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in syncUser", error);
    throw error; // Re-throw the error to be handled by the caller
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
    if (!clerkId) return null;

    const user = await getUserByClerkId(clerkId);

    if (!user) {
      // If user doesn't exist in DB, sync them first
      try {
        const syncedUser = await syncUser();
        if (!syncedUser) {
          console.error("Failed to sync user - no user returned");
          return null;
        }
        return syncedUser.id;
      } catch (syncError) {
        console.error("Error during user sync:", syncError);
        return null;
      }
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
