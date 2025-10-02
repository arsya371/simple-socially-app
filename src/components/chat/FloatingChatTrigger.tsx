'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useFloatingChatStore } from '@/store/floating-chat';

interface FloatingChatTriggerProps {
  userId: string;
  username: string;
  userImage?: string;
}

export function FloatingChatTrigger({
  userId,
  username,
  userImage
}: FloatingChatTriggerProps) {
  const { activeChats, addChat } = useFloatingChatStore();

  const handleClick = () => {
    addChat(userId, {
      id: userId,
      username,
      image: userImage
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={activeChats.has(userId)}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Message
    </Button>
  );
}