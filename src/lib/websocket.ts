import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Socket } from 'socket.io';

// Types untuk server dan messages
interface ServerWithIO extends HTTPServer {
  io?: SocketIOServer;
}

interface MessageData {
  senderId: string;
  receiverId: string;
  content: string;
}

// Singleton instance untuk Socket.IO server
let io: SocketIOServer | null = null;

export function initWebSocketServer(server: HTTPServer): SocketIOServer {
  // Kembalikan instance yang ada jika sudah diinisialisasi
  if (io) {
    return io;
  }

  // Buat instance Socket.IO server baru
  io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Simpan instance di server untuk referensi
  (server as ServerWithIO).io = io;

  // Setup event handlers
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Handle join room
    socket.on('join', (userId: string) => {
      socket.join(userId);
      io?.emit('user:online', userId);
    });

    // Handle leave room
    socket.on('leave', (userId: string) => {
      socket.leave(userId);
      io?.emit('user:offline', userId);
    });

    // Handle messages
    socket.on('message', (data: MessageData) => {
      if (!data.receiverId) {
        return;
      }
      // Emit to the specific room
      socket.to(data.receiverId).emit('message:received', {
        senderId: data.senderId,
        content: data.content,
        receiverId: data.receiverId
      });
      // Also emit to sender for confirmation
      socket.emit('message:sent', {
        senderId: data.senderId,
        content: data.content,
        receiverId: data.receiverId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}