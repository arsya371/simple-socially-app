import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  image?: string;
}

export function UserSearchList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const startChat = async (userId: string) => {
    try {
      const response = await fetch('/api/messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const { conversationId } = await response.json();
      router.push(`/messages?id=${conversationId}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          searchUsers(e.target.value);
        }}
        className="w-full"
      />
      
      <ScrollArea className="h-[400px]">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 hover:bg-accent rounded-lg cursor-pointer"
            onClick={() => startChat(user.id)}
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.image} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.username}</span>
            </div>
            <Button variant="ghost" size="sm">
              Message
            </Button>
          </div>
        ))}
        
        {searchQuery && users.length === 0 && (
          <p className="text-center text-muted-foreground p-4">
            No users found
          </p>
        )}
      </ScrollArea>
    </div>
  );
}