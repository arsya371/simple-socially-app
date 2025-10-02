'use client';

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useFloatingChatStore } from "@/store/floating-chat";

interface ChatButtonProps {
  clerkId: string;
  username: string;
  userImage?: string | null;
  currentUserId: string | null;
}

export function ChatButton({ clerkId, username, userImage, currentUserId }: ChatButtonProps) {
  const { addChat } = useFloatingChatStore();

  if (!currentUserId || !clerkId) return null;

  const handleClick = () => {
    addChat(clerkId, {
      id: clerkId,
      username,
      image: userImage ?? undefined
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground gap-2"
      onClick={handleClick}
    >
      <MessageCircle className="h-4 w-4" />
      Message
    </Button>
  );
}