import type { NextApiRequest } from 'next';
import type { NextApiResponse } from 'next';
import type { Socket as NetSocket } from 'net';
import type { Server as HTTPServer } from 'http';
import { initWebSocketServer } from '@/lib/websocket';

interface SocketServer extends HTTPServer {
  io?: any;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (req.method === 'GET') {
    // Initialize Socket.IO server if it doesn't exist
    if (!res.socket.server.io) {
      initWebSocketServer(res.socket.server);
    }
    res.end();
  } else {
    res.status(405).end();
  }
}
