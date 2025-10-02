import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

export function useUserStatus(userId: string) {
  const [isActive, setIsActive] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for user online/offline events
    socket.on('user:online', (onlineUserId: string) => {
      if (onlineUserId === userId) {
        setIsActive(true);
        setLastSeen(new Date());
      }
    });

    socket.on('user:offline', (offlineUserId: string) => {
      if (offlineUserId === userId) {
        setIsActive(false);
        setLastSeen(new Date());
      }
    });

    // Cleanup listeners
    return () => {
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [socket, userId]);

  return { isActive, lastSeen };
}