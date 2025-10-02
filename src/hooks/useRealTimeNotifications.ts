'use client';

import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useNotificationStore } from '@/store/notifications';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export function useRealTimeNotifications() {
  const socket = useSocket();
  const { user } = useUser();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for new messages
    const handleNewMessage = (data: {
      senderId: string;
      senderName: string;
      content: string;
    }) => {
      // Create notification
      const notification = {
        id: Math.random().toString(),
        message: `New message from ${data.senderName}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
        type: 'message' as const,
        read: false,
        createdAt: new Date()
      };

      // Add to store
      addNotification(notification);

      // Show toast notification
      toast(notification.message, {
        icon: '💬'
      });
    };

    // Listen for likes
    const handleNewLike = (data: {
      userId: string;
      username: string;
      postId: string;
    }) => {
      const notification = {
        id: Math.random().toString(),
        message: `${data.username} liked your post`,
        type: 'system' as const,
        read: false,
        createdAt: new Date()
      };

      addNotification(notification);
      toast(notification.message, {
        icon: '❤️'
      });
    };

    // Listen for follows
    const handleNewFollow = (data: {
      followerId: string;
      followerName: string;
    }) => {
      const notification = {
        id: Math.random().toString(),
        message: `${data.followerName} started following you`,
        type: 'system' as const,
        read: false,
        createdAt: new Date()
      };

      addNotification(notification);
      toast(notification.message, {
        icon: '👤'
      });
    };

    // Listen for comments
    const handleNewComment = (data: {
      userId: string;
      username: string;
      postId: string;
      content: string;
    }) => {
      const notification = {
        id: Math.random().toString(),
        message: `${data.username} commented on your post: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
        type: 'system' as const,
        read: false,
        createdAt: new Date()
      };

      addNotification(notification);
      toast(notification.message, {
        icon: '💭'
      });
    };

    // Subscribe to events
    socket.on('message', handleNewMessage);
    socket.on('like', handleNewLike);
    socket.on('follow', handleNewFollow);
    socket.on('comment', handleNewComment);

    return () => {
      socket.off('message', handleNewMessage);
      socket.off('like', handleNewLike);
      socket.off('follow', handleNewFollow);
      socket.off('comment', handleNewComment);
    };
  }, [socket, user, addNotification]);
}