'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon, SendHorizontalIcon } from 'lucide-react';
import { ConversationsList, type Conversation } from '@/components/chat/ConversationsList';
import { UserSearchList } from '@/components/chat/UserSearchList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ApiConversation {
  id: string;
  messages: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    read: boolean;
  }[];
  participants: {
    id: string;
    username: string;
    image?: string;
    isOnline: boolean;
    lastSeen: Date;
  }[];
  _count: {
    messages: number;
  };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    username: string;
    image?: string;
  };
}

interface User {
  id: string;
  username: string;
  image?: string;
}

export default function MessagesPage() {
  const { userId, isSignedIn: isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  const isNewChat = searchParams.get('new') === 'true';
  
  const [apiConversations, setApiConversations] = useState<ApiConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const conversationList: Conversation[] = apiConversations
    .filter(conv => conv.participants && conv.participants.length > 0) // Only include conversations with participants
    .map((conv: ApiConversation) => {
    const otherUser = conv.participants[0];
    const lastMessage = conv.messages?.[0];
    return {
      id: conv.id,
      lastMessage: lastMessage?.content || '',
      user: {
        id: otherUser.id,
        name: otherUser.username || 'Unknown User',
        image: otherUser.image,
        isOnline: otherUser.isOnline || false,
        lastSeen: otherUser.lastSeen
      },
      timestamp: lastMessage ? new Date(lastMessage.createdAt) : new Date(),
      unread: lastMessage ? !lastMessage.read && lastMessage.senderId !== userId : false,
      messageCount: conv._count.messages
    };
  });

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  useEffect(() => {
    if (conversationId && userId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 100); // Poll every 2 seconds instead
      return () => clearInterval(interval);
    }
  }, [conversationId, userId]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setApiConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      const data = await response.json();
      
      // Update messages while maintaining order and adding only new ones
      setMessages(prevMessages => {
        const newMessages = data.messages.filter((newMsg: Message) => 
          !prevMessages.some(existingMsg => existingMsg.id === newMsg.id)
        );
        
        const allMessages = [...prevMessages, ...newMessages];
        // Sort by creation time
        return allMessages.sort((a: Message, b: Message) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      setOtherUser(data.otherUser);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !otherUser || !conversationId) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const response = await fetch(`/api/messages/${conversationId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          receiverId: otherUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      const data = await response.json();
      setMessages((prev) => [...prev, data]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageContent);
    }
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/messages?id=${id}`);
  };

  const isCurrentUser = (message: Message) => {
    return message.senderId === userId || message.sender?.id === userId;
  };

  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Conversations List */}
      <div className="w-[380px] border-r flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={() => router.push('/messages?new=true')}
            variant="outline"
            className="w-full"
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
        <ConversationsList
          conversations={conversationList} 
          onSelectConversation={handleSelectConversation}
          selectedConversationId={conversationId || undefined}
        />
      </div>

      {/* Message View */}
      <div className="flex-1">
        {isNewChat ? (
          <div className="flex-1 p-4">
            <div className="w-full max-w-3xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Start a New Chat</h2>
              </div>
              <div className="p-4 bg-card rounded-lg">
                <UserSearchList />
              </div>
            </div>
          </div>
        ) : conversationId ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            {otherUser && (
              <div className="flex items-center gap-3 p-4 bg-card border-b border-border flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.image} />
                  <AvatarFallback>{otherUser.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{otherUser.username}</h3>
                  <p className="text-sm text-muted-foreground">Active now</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 bg-background h-[calc(100vh-180px)]">
              <div className="flex flex-col px-4 space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex w-full mb-4',
                      isCurrentUser(message) ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className="flex items-end gap-2 max-w-[70%] group">
                      {!isCurrentUser(message) && (
                        <Avatar className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AvatarImage src={otherUser?.image} />
                          <AvatarFallback>{otherUser?.username?.[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <div className="relative">
                          <div
                            className={cn(
                              'px-4 py-2 break-words',
                              isCurrentUser(message)
                                ? 'bg-primary text-primary-foreground rounded-lg rounded-tr-none'
                                : 'bg-muted text-foreground rounded-lg rounded-tl-none'
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div
                              className={cn(
                                'absolute top-0 -z-10 w-4 h-4',
                                isCurrentUser(message)
                                  ? 'right-0 bg-primary'
                                  : 'left-0 bg-muted'
                              )}
                              style={{
                                clipPath: isCurrentUser(message)
                                  ? 'polygon(0 0, 100% 0, 100% 100%)'
                                  : 'polygon(0 0, 100% 0, 0 100%)'
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity px-2">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {isCurrentUser(message) && (
                        <Avatar className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AvatarImage src={undefined} />
                          <AvatarFallback>Me</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} style={{ float: 'left', clear: 'both' }} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-card border-t border-border flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-background border-input"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full"
                >
                  <SendHorizontalIcon className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation or start a new one
          </div>
        )}
      </div>
    </div>
  );
  };

//   if (!isLoaded) {
//     return (
//       <div className="flex items-center justify-center min-h-[200px]">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   if (!userId) {
//     return (
//       <div className="flex items-center justify-center min-h-[200px]">
//         <p>Please sign in to view messages</p>
//       </div>
//     );
//   }

//   const formattedConversations = conversations.map(conv => ({
//     id: conv.id,
//     lastMessage: conv.lastMessage?.content ?? '',
//     user: {
//       id: conv.otherUser.id,
//       name: conv.otherUser.username,
//       image: conv.otherUser.image,
//       role: conv.otherUser.role,
//       isOnline: false // TODO: Implement online status
//     },
//     timestamp: conv.lastMessage ? new Date(conv.lastMessage.createdAt) : new Date(),
//     unread: conv.unreadCount > 0
//   }));

//   return (
//     <div className="flex h-[calc(100vh-4rem)]">
//       <Card className="w-[380px] border-r flex flex-col">
//         <div className="flex items-center justify-between p-4 border-b">
//           <h2 className="text-xl font-semibold">Messages</h2>
//           <Button onClick={() => router.push('/messages?new=true')} variant="ghost" size="icon" className="rounded-full">
//             <PlusCircleIcon className="h-5 w-5" />
//           </Button>
//         </div>

//         <ConversationsList 
//           conversations={formattedConversations}
//           onSelectConversation={handleSelectConversation}
//           selectedConversationId={selectedConversation}
//         />
//       </Card>
//     </div>
//   );
// }