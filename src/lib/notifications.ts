import { Server as SocketServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export const notifyUser = async (userId: string, event: string, data: any) => {
  try {
    // Get user's socket ID from active connections
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true }
    });

    if (!user?.clerkId) return;

    // Get the global socket.io instance
    const io: SocketServer = (global as any).io;
    if (!io) return;

    // Emit to user's room
    io.to(user.clerkId).emit(event, data);

    // Map event to NotificationType correctly
    const type = 
      event === 'message' ? 'MESSAGE' :
      event === 'like' ? 'LIKE' :
      event === 'follow' ? 'FOLLOW' :
      event === 'comment' ? 'COMMENT' : 'REPORT';

    // Save notification to database
    await prisma.notification.create({
      data: {
        userId,
        type: type as NotificationType,
        message: data.content || `New ${type.toLowerCase()} notification`,
        metadata: {
          ...data,
          eventType: event
        },
        moderatorId: data.moderatorId,
        postId: data.postId,
        commentId: event === 'comment' ? data.commentId : undefined,
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notifyMessage = async (
  senderId: string,
  receiverId: string,
  content: string
) => {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { username: true }
  });

  if (!sender) return;

  await notifyUser(receiverId, 'message', {
    senderId,
    senderName: sender.username,
    content
  });
};

export const notifyLike = async (
  userId: string,
  postAuthorId: string,
  postId: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return;

  await notifyUser(postAuthorId, 'like', {
    userId,
    username: user.username,
    postId
  });
};

export const notifyFollow = async (
  followerId: string,
  followedId: string
) => {
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { username: true }
  });

  if (!follower) return;

  await notifyUser(followedId, 'follow', {
    followerId,
    followerName: follower.username
  });
};

export const notifyComment = async (
  userId: string,
  postAuthorId: string,
  postId: string,
  content: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return;

  await notifyUser(postAuthorId, 'comment', {
    userId,
    username: user.username,
    postId,
    content
  });
};

export async function sendModerationNotification({
  userId,
  moderatorId,
  type,
  reason,
  duration
}: {
  userId: string;
  moderatorId: string;
  type: 'BANNED' | 'UNBANNED' | 'SUSPENDED' | 'UNSUSPENDED';
  reason?: string;
  duration?: number;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        moderatorId,
        type: type as NotificationType,
        message: reason || `Your account has been ${type.toLowerCase()}`,
        metadata: {
          duration,
          reason,
          timestamp: new Date().toISOString()
        },
      }
    });

    const io: SocketServer = (global as any).io;
    if (io) {
      io.to(userId).emit('notification:moderation', {
        type,
        reason,
        duration,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error('Error sending moderation notification:', error);
    throw error;
  }
}

export async function banUser(userId: string, reason?: string, duration?: number) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'BANNED',
        bannedUntil: duration ? new Date(Date.now() + duration) : null
      }
    });

    await sendModerationNotification({
      userId,
      moderatorId: '', // Set this to the appropriate moderator ID
      type: 'BANNED',
      reason,
      duration
    });

    return user;
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
}

export async function unbanUser(userId: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'ACTIVE',
        bannedUntil: null
      }
    });

    await sendModerationNotification({
      userId,
      moderatorId: '', // Set this to the appropriate moderator ID
      type: 'UNBANNED'
    });

    return user;
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
}

// Fungsi yang sama untuk suspend dan unsuspend