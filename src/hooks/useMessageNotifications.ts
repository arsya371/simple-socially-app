import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useNotificationStore } from '@/store/notifications';
import { useChatStore } from '@/store/chat';
import { toast } from '@/hooks/use-toast';

export function useMessageNotifications(userId: string) {
  const socket = useSocket();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addMessage = useChatStore((state) => state.addMessage);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:received', (data: {
      senderId: string;
      content: string;
      id: string;
      createdAt: Date;
      conversationId: string;
      updatedAt: Date;
    }) => {
      // Add to messages
      addMessage({
        id: data.id,
        content: data.content,
        senderId: data.senderId,
        receiverId: userId,
        conversationId: data.conversationId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        read: false,
        sender: undefined // Will be populated when fetching from the database
      });

      // Show notification
      addNotification({
        id: data.id,
        message: data.content,
        type: 'message',
        read: false,
        createdAt: new Date(),
      });

      // Show toast
      toast({
        title: 'New Message',
        description: data.content.length > 50 
          ? `${data.content.substring(0, 50)}...` 
          : data.content,
      });
    });

    return () => {
      socket.off('message:received');
    };
  }, [socket, userId, addNotification, addMessage]);
}