'use client';

import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    image: string;
  };
}

interface FloatingMessageProps {
  message: Message;
}

export function FloatingMessage({ message }: FloatingMessageProps) {
  const { user } = useUser();
  const isOwn = user?.id === message.senderId;

  return (
    <div className={cn(
      'flex w-full mb-4 last:mb-0',
      isOwn && 'justify-end'
    )}>
      <div className={cn(
        'flex flex-col max-w-[70%]',
        isOwn && 'items-end'
      )}>
        <div className={cn(
          'rounded-lg py-2 px-3',
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.createdAt), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}