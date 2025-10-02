"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Conversation {
  id: string;
  lastMessage: string;
  user: {
    id: string;
    name: string;
    image?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
  timestamp: Date;
  unread?: boolean;
  messageCount?: number;
}

interface ConversationsListProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  selectedConversationId?: string;
}

export function ConversationsList({
  conversations,
  onSelectConversation,
  selectedConversationId
}: ConversationsListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-5rem)]">
      <div className="flex flex-col divide-y divide-border">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`flex items-center w-full px-4 py-3 gap-3 hover:bg-accent/40 transition-colors border-b border-border ${
              selectedConversationId === conversation.id ? 'bg-accent/40' : ''
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.user.image} />
                <AvatarFallback>{conversation.user.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              {conversation.user.isOnline && (
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <span className="font-semibold text-sm text-foreground">
                  {conversation.user.name}
                </span>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(conversation.timestamp, { addSuffix: false })}
                </span>
              </div>
              
              <div className="flex items-start gap-2">
                <p className="text-sm text-muted-foreground truncate flex-1">
                  {conversation.user.isOnline ? (
                    <span className="text-green-500">Active now</span>
                  ) : (
                    conversation.lastMessage
                  )}
                </p>
                {conversation.unread && (
                  <div className="flex-shrink-0 w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    1
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}