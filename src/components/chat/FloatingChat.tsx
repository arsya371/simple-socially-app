import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/hooks/useSocket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FloatingMessage } from './FloatingMessage';

interface FloatingChatProps {
  receiverId: string;
  receiverUsername: string;
  receiverImage?: string;
  onClose: () => void;
}

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

export function FloatingChat({ 
  receiverId, 
  receiverUsername, 
  receiverImage,
  onClose 
}: FloatingChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const socket = useSocket();
  const { user } = useUser();
  const router = useRouter();

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages/floating/${receiverId}`);
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [receiverId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: Message) => {
      if (msg.senderId === receiverId || msg.senderId === user?.id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('message', handleMessage);

    return () => {
      socket.off('message', handleMessage);
    };
  }, [socket, receiverId, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          receiverId,
          isFloating: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Emit socket event
      if (socket) {
        socket.emit('message', {
          ...data,
          receiverId
        });
      }

      setMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenFullChat = () => {
    router.push(`/messages/${receiverId}`);
    onClose();
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-background border rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={receiverImage} />
            <AvatarFallback>
              {receiverUsername.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{receiverUsername}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleOpenFullChat}
          >
            Open
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
      
      <div className="h-60 overflow-y-auto p-4">
        {messages.map((msg) => (
          <FloatingMessage key={msg.id} message={msg} />
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
          />
          <Button disabled={isSending} type="submit">
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}