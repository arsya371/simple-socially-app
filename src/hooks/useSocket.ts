import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let cachedSocket: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current && typeof window !== 'undefined') {
      if (!cachedSocket) {
        cachedSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
          path: '/api/socket',
          addTrailingSlash: false,
        });
      }
      socketRef.current = cachedSocket;

      // Setup reconnection logic
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
}