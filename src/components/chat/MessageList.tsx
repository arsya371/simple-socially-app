import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Message } from '@/store/chat';
import { DeleteMessageDialog } from './DeleteMessageDialog';
import { deleteMessage, deleteAllMessages } from '@/actions/message.action';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  conversationId: string;
  onMessageDeleted?: () => void;
}

export function MessageList({ messages, currentUserId, conversationId, onMessageDeleted }: MessageListProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    setIsDeletingAll(true);
    setIsDeleteDialogOpen(true);
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
  };

  const handleDeleteMessage = async (deleteForEveryone: boolean) => {
    if (isDeletingAll) {
      const result = await deleteAllMessages(conversationId, currentUserId, deleteForEveryone);
      if (result.success) {
        onMessageDeleted?.();
      }
    } else if (selectedMessages.size > 0) {
      const promises = Array.from(selectedMessages).map(messageId =>
        deleteMessage(messageId, currentUserId, deleteForEveryone)
      );
      const results = await Promise.all(promises);
      if (results.every(r => r.success)) {
        onMessageDeleted?.();
      }
    } else if (selectedMessage) {
      const result = await deleteMessage(selectedMessage.id, currentUserId, deleteForEveryone);
      if (result.success) {
        onMessageDeleted?.();
      }
    }
    
    setIsDeleteDialogOpen(false);
    setSelectedMessage(null);
    setIsDeletingAll(false);
    clearSelection();
  };

  const handleDeleteAll = () => {
    setIsDeletingAll(true);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex justify-between items-center p-4 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={cn(isSelectionMode && "bg-secondary")}
          >
            {isSelectionMode ? "Cancel Selection" : "Select Messages"}
          </Button>
          <div className="flex gap-2">
            {isSelectionMode && selectedMessages.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedMessages.size})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="text-destructive hover:text-destructive/90 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </Button>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col space-y-4 py-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            const isDeleted = message.isDeleted;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2 group relative",
                  isOwnMessage ? "flex-row-reverse" : "flex-row",
                  isSelectionMode && "hover:bg-secondary/20 rounded-lg p-2 cursor-pointer"
                )}
                onClick={() => isSelectionMode && !isDeleted && toggleMessageSelection(message.id)}
              >
                {isSelectionMode && !isDeleted && (
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2",
                    isOwnMessage ? "right-[-30px]" : "left-[-30px]"
                  )}>
                    <input
                      type="checkbox"
                      checked={selectedMessages.has(message.id)}
                      onChange={() => toggleMessageSelection(message.id)}
                      className="h-4 w-4 rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender?.image || undefined} />
                  <AvatarFallback>{message.sender?.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>

                <div className="flex items-start gap-2 max-w-[70%]">
                  <Card className={cn(
                    "p-3",
                    isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted",
                    isDeleted && "opacity-50"
                  )}>
                    <p className="text-sm">
                      {isDeleted ? "This message was deleted" : message.content}
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </Card>

                  {isOwnMessage && !isDeleted && !isSelectionMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedMessage(message);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          Delete Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <DeleteMessageDialog 
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedMessage(null);
          setIsDeletingAll(false);
          clearSelection();
        }}
        onConfirm={handleDeleteMessage}
        messageCount={
          isDeletingAll 
            ? messages.filter(m => m.senderId === currentUserId).length 
            : selectedMessages.size || 1
        }
      />
    </div>
  );
}
