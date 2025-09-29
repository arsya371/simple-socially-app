"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { checkRole, logAdminAction } from "./auth.action";

async function checkUserSuspension(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedUntil: true }
  });

  if (user?.suspendedUntil) {
    const now = new Date();
    if (user.suspendedUntil > now) {
      const endDate = user.suspendedUntil.toLocaleDateString();
      return {
        isSuspended: true,
        message: `Your account is currently suspended until ${endDate}`,
        endDate: user.suspendedUntil
      };
    }
  }
  return { isSuspended: false };
}

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { error: "Not authenticated" };
    
    // Check if user is suspended
    const suspensionStatus = await checkUserSuspension(userId);
    if (suspensionStatus.isSuspended) {
      return { error: suspensionStatus.message };
    }

    // If this is just a suspension check (empty content and image), return success
    if (!content && !image) {
      return { success: true };
    }

    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });

    revalidatePath("/"); // purge the cache for the home page
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.log("Error in getPosts", error);
    throw new Error("Failed to fetch posts");
  }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    // check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // unlike
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      // like and create notification (only if liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId, // recipient (post author)
                  creatorId: userId, // person who liked
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;
    if (!content) throw new Error("Content is required");
    
    // Check if user is suspended
    await checkUserSuspension(userId);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    // Create comment and notification in a transaction
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create comment first
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      // Create notification if commenting on someone else's post
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function deletePost(postId: string) {
  try {
    // First check if it's an admin request
    const isAdmin = await checkRole(["ADMIN"]);
    const userId = await getDbUserId();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");
    
    // Allow deletion if user is admin or post author
    if (!isAdmin && post.authorId !== userId) {
      throw new Error("Unauthorized - no delete permission");
    }

    // Delete all related data
    await prisma.$transaction([
      prisma.comment.deleteMany({
        where: { postId }
      }),
      prisma.like.deleteMany({
        where: { postId }
      }),
      prisma.notification.deleteMany({
        where: { postId }
      }),
      prisma.post.delete({
        where: { id: postId }
      })
    ]);

    if (isAdmin) {
      await logAdminAction(
        "Delete Post",
        `Deleted post with ID ${postId}`,
        `Post by ${post.authorId}`
      );
    }

    revalidatePath("/"); // purge the main feed cache
    revalidatePath("/admin/posts"); // purge the admin posts page cache
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}