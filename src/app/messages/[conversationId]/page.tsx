'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SendHorizontalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { userId, isLoaded } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);

  useEffect(() => {
    if (conversationId && userId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 200);
      return () => clearInterval(interval);
    }
  }, [conversationId, userId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      const data = await response.json();
      setMessages((prevMessages) => {
        const newMessagesMap = new Map(data.messages.map((m: Message) => [m.id, m]));
        const existingIds = new Set(prevMessages.map(m => m.id));
        const finalMessages = [...prevMessages];
        data.messages.forEach((msg: Message) => {
          if (!existingIds.has(msg.id)) {
            finalMessages.push(msg);
          }
        });
        
        return finalMessages;
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

  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isCurrentUser = (message: Message) => {
    // Message senderId is now always using Clerk ID
    return message.senderId === userId;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
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
      <ScrollArea className="flex-1 bg-background">
        <div className="px-4 space-y-4 py-4">
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
  );
}


// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';
// import { useAuth } from '@clerk/nextjs';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { SendHorizontalIcon } from 'lucide-react';
// import { cn } from '@/lib/utils';

// // 1. Update interface Message
// interface Message {
//   id: string;
//   content: string;
//   senderId: string;
//   receiverId: string;
//   createdAt: string;
//   read: boolean;
//   sender: {
//     id: string;
//     username: string;
//     image?: string;
//   };
// }

// interface User {
//   id: string;
//   username: string;
//   image?: string;
// }

// export default function ConversationPage() {
//   const { conversationId } = useParams();
//   const { userId, isLoaded } = useAuth();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [otherUser, setOtherUser] = useState<User | null>(null);

//   useEffect(() => {
//     if (conversationId && userId) {
//       fetchMessages();
      
//       // Refresh messages every 5 seconds
//       const interval = setInterval(fetchMessages, 5000);
      
//       return () => clearInterval(interval);
//     }
//   }, [conversationId, userId]);

//   const fetchMessages = async () => {
//     try {
//       const response = await fetch(`/api/messages/${conversationId}`);
//       const data = await response.json();
//       setMessages(
//         data.messages.map((message: any) => ({
//           ...message,
//           sender: message.sender, // Pastikan sender selalu ada
//           senderId: message.sender.id, // Gunakan ID dari sender
//         }))
//       );
//       setOtherUser(data.otherUser);
//     } catch (error) {
//       console.error('Failed to fetch messages:', error);
//     }
//   };

//   const sendMessage = async () => {
//     if (!newMessage.trim() || !otherUser || !conversationId) return;

//     try {
//       const response = await fetch(`/api/messages/${conversationId}/send`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           content: newMessage,
//           receiverId: otherUser.id,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to send message');
//       }

//       const data = await response.json();
//       setMessages((prev) => [...prev, data]);
//       setNewMessage('');
//     } catch (error) {
//       console.error('Failed to send message:', error);
//     }
//   };

//   if (!isLoaded || !userId) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <p className="text-muted-foreground">Loading...</p>
//       </div>
//     );
//   }

//   const isCurrentUser = (message: Message) => message.senderId === userId;

//   return (
//     <div className="flex flex-col h-full bg-[#0B141A]">
//       {/* Header */}
//       {otherUser && (
//         <div className="flex items-center gap-3 p-4 bg-[#202C33] border-b border-[#2A3942]">
//           <Avatar className="h-10 w-10">
//             <AvatarImage src={otherUser.image} />
//             <AvatarFallback>{otherUser.username[0].toUpperCase()}</AvatarFallback>
//           </Avatar>
//           <div className="flex-1">
//             <h3 className="font-medium">{otherUser.username}</h3>
//             <p className="text-sm text-muted-foreground">Active now</p>
//           </div>
//         </div>
//       )}

//       {/* Messages */}
//       <ScrollArea className="flex-1 px-4 bg-[#0B141A]">
//         <div className="space-y-4 py-4">
//           {messages.map((message) => (
//             <div
//               key={message.id}
//               className={cn(
//                 'flex w-full mb-4',
//                 isCurrentUser(message) ? 'justify-end' : 'justify-start'
//               )}
//             >
//               <div className="flex items-end gap-2 max-w-[70%] group">
//                 {!isCurrentUser(message) && (
//                   <Avatar className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <AvatarImage src={otherUser?.image} />
//                     <AvatarFallback>{otherUser?.username?.[0]}</AvatarFallback>
//                   </Avatar>
//                 )}
                
//                 <div className="flex flex-col gap-1">
//                   <div className="relative">
//                     <div
//                       className={cn(
//                         'px-4 py-2 break-words',
//                         isCurrentUser(message)
//                           ? 'bg-[#005C4B] text-white rounded-lg rounded-tr-none'
//                           : 'bg-[#202C33] text-white rounded-lg rounded-tl-none'
//                       )}
//                     >
//                       <p className="text-sm">{message.content}</p>
//                       <div
//                         className={cn(
//                           'absolute top-0 -z-10 w-4 h-4',
//                           isCurrentUser(message)
//                             ? 'right-0 bg-[#005C4B]'
//                             : 'left-0 bg-[#202C33]'
//                         )}
//                         style={{
//                           clipPath: isCurrentUser(message)
//                             ? 'polygon(0 0, 100% 0, 100% 100%)'
//                             : 'polygon(0 0, 100% 0, 0 100%)'
//                         }}
//                       />
//                     </div>
//                   </div>
//                   <span className="text-xs text-[#8696A0] opacity-0 group-hover:opacity-100 transition-opacity px-2">
//                     {new Date(message.createdAt).toLocaleTimeString([], {
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </span>
//                 </div>
                
//                 {isCurrentUser(message) && (
//                   <Avatar className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <AvatarImage src={undefined} />
//                     <AvatarFallback>Me</AvatarFallback>
//                   </Avatar>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </ScrollArea>

//       {/* Input */}
//       <div className="p-4 bg-[#202C33] border-t border-[#2A3942]">
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             sendMessage();
//           }}
//           className="flex items-center gap-2"
//         >
//           <Input
//             placeholder="Write a message..."
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             className="flex-1 bg-[#2A3942] border-0 text-white placeholder:text-[#8696A0]"
//           />
//           <Button 
//             type="submit" 
//             size="icon" 
//             className="rounded-full bg-[#005C4B] hover:bg-[00715D]"
//           >
//             <SendHorizontalIcon className="h-5 w-5" />
//           </Button>
//         </form>
//       </div>
//     </div>
//   );
// }