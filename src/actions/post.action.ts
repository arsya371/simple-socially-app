"use server";

import prisma from "@/lib/prisma";
import { createAdminActionNotification } from "./admin-notification.action";
import { NotificationType } from "@prisma/client";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { checkRole, logAdminAction } from "./auth.action";
import { moderateContent } from "@/lib/moderation";
import { getAppSetting } from "@/lib/app-settings"; // <-- Tambahkan import ini

export async function checkUserSuspension(userId: string) {
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
      
      const suspensionStatus = await checkUserSuspension(userId);
      if (suspensionStatus.isSuspended) {
        return { error: suspensionStatus.message };
      }
  
      if (!content && !image) {
        return { success: true };
      }
  
      const moderationResult = await moderateContent(content, userId);
      
      const post = await prisma.post.create({
        data: {
          content: moderationResult.censoredContent || content,
          image,
          authorId: userId,
        },
      });
  
      if (moderationResult.hasViolation) {
        await prisma.contentViolation.create({
          data: {
            userId: userId,
            type: "PROHIBITED_CONTENT",
            contentType: "POST",
            contentId: post.id,
          }
        });
  
        const recentViolations = await prisma.contentViolation.count({
          where: {
            userId: userId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        });
  
        // === PERUBAHAN: MENGAMBIL PENGATURAN DARI DATABASE ===
        const [violationThreshold, suspensionDurationHours] = await Promise.all([
          getAppSetting('violation_threshold', 3),
          getAppSetting('suspension_duration_hours', 24)
        ]);
        
        if (recentViolations >= violationThreshold) {
          await prisma.user.update({
            where: { id: userId },
            data: { 
              suspendedUntil: new Date(Date.now() + suspensionDurationHours * 60 * 60 * 1000)
            }
          });
  
          await createAdminActionNotification({
              userId: userId,
              type: NotificationType.ACCOUNT_SUSPENDED,
              message: `Akun Anda telah di-suspensi selama ${suspensionDurationHours} jam karena beberapa pelanggaran konten.`
          });
        }
        // === AKHIR PERUBAHAN ===
      }
  
      revalidatePath("/");
      return { success: true, post };
    } catch (error) {
      console.error("Failed to create post:", error);
      return { success: false, error: "Failed to create post" };
    }
  }
  
  export async function createComment(postId: string, content: string) {
    try {
      const userId = await getDbUserId();
      if (!userId) return { error: "Not authenticated" };
      if (!content) throw new Error("Content is required");
      
      const suspensionStatus = await checkUserSuspension(userId);
      if (suspensionStatus.isSuspended) {
        return { error: suspensionStatus.message };
      }
  
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
  
      if (!post) throw new Error("Post not found");
  
      const moderationResult = await moderateContent(content, userId);
  
      const newComment = await prisma.$transaction(async (tx) => {
        const createdComment = await tx.comment.create({
          data: {
            content: moderationResult.censoredContent || content,
            authorId: userId,
            postId,
          },
        });
  
        if (moderationResult.hasViolation) {
          await tx.contentViolation.create({
            data: {
              userId: userId,
              type: "PROHIBITED_CONTENT",
              contentType: "COMMENT",
              contentId: createdComment.id,
            }
          });
        }
  
        if (post.authorId !== userId) {
          await tx.notification.create({
            data: {
              type: "COMMENT",
              userId: post.authorId,
              creatorId: userId,
              postId,
              commentId: createdComment.id,
            },
          });
        }
        
        return createdComment;
      });
      
      if (moderationResult.hasViolation) {
          const recentViolations = await prisma.contentViolation.count({
              where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
          });
  
          // === PERUBAHAN: MENGAMBIL PENGATURAN DARI DATABASE ===
          const [violationThreshold, suspensionDurationHours] = await Promise.all([
              getAppSetting('violation_threshold', 3),
              getAppSetting('suspension_duration_hours', 24)
          ]);
  
          if (recentViolations >= violationThreshold) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  suspendedUntil: new Date(Date.now() + suspensionDurationHours * 60 * 60 * 1000)
                }
              });
  
              await createAdminActionNotification({
                  userId: userId,
                  type: NotificationType.ACCOUNT_SUSPENDED,
                  message: `Akun Anda telah di-suspensi selama ${suspensionDurationHours} jam karena beberapa pelanggaran konten.`
              });
          }
          // === AKHIR PERUBAHAN ===
      }
  
      const fullComment = await prisma.comment.findUnique({
          where: { id: newComment.id },
          include: {
              author: {
                  select: { id: true, name: true, username: true, image: true },
              },
          },
      });
  
      revalidatePath(`/`);
      return { success: true, comment: fullComment };
    } catch (error) {
      console.error("Failed to create comment:", error);
      return { success: false, error: "Failed to create comment" };
    }
  }
  
  // Fungsi getPosts, toggleLike, deletePost, dan getUserPosts tidak berubah
  // ... (sisa kode di file ini tetap sama)
  
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
        await prisma.like.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
      } else {
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
                    userId: post.authorId,
                    creatorId: userId,
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
  
  export async function deletePost(postId: string) {
    try {
      const isAdmin = await checkRole(["ADMIN"]);
      const userId = await getDbUserId();
  
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
  
      if (!post) throw new Error("Post not found");
      
      if (!isAdmin && post.authorId !== userId) {
        throw new Error("Unauthorized - no delete permission");
      }
  
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
  
      revalidatePath("/");
      revalidatePath("/admin/posts");
      return { success: true };
    } catch (error) {
      console.error("Failed to delete post:", error);
      return { success: false, error: "Failed to delete post" };
    }
  }
  
  export async function getUserPosts(userId: string) {
    try {
      const posts = await prisma.post.findMany({
        where: {
          authorId: userId,
          deleted: false,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20,
        select: {
          id: true,
          content: true,
          createdAt: true,
          image: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      });
  
      return posts;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  }