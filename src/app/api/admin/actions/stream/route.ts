import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Set up Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      let lastActionCount = 0;
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`));
      
      const checkForNewActions = async () => {
        if (isClosed) return;
        
        try {
          const actionCount = await prisma.adminAuditLog.count();
          if (actionCount > lastActionCount) {
            lastActionCount = actionCount;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ newAction: true, count: actionCount })}\n\n`));
          }
        } catch (error) {
          console.error("Error checking admin actions:", error);
        }
      };
      
      // Initial check
      checkForNewActions();
      
      // Check for new admin actions every 2 seconds
      const actionInterval = setInterval(checkForNewActions, 2000);
      
      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (!isClosed) {
          controller.enqueue(encoder.encode(`data: ping\n\n`));
        }
      }, 30000);
      
      // Clean up on close
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(actionInterval);
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
