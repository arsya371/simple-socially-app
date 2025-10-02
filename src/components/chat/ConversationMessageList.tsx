import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender?: {
    image?: string;
    username: string;
  };
  createdAt: string;
  read: boolean;
}

interface ConversationMessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: ConversationMessageListProps) {
  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-2",
            message.senderId === currentUserId ? "flex-row-reverse" : "flex-row"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender?.image} />
            <AvatarFallback>
              {message.sender?.username?.[0].toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "rounded-lg px-3 py-2 max-w-[70%]",
              message.senderId === currentUserId
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <p className="text-sm">{message.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}