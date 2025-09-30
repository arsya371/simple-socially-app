import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getDbUserId } from "@/actions/user.action";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getDbUserId();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      
      controller.enqueue("data: connected\n\n");

      const checkNewNotifications = async () => {
        if (isClosed) return;
        
        try {
          const notifications = await prisma.notification.findMany({
            where: {
              userId,
              read: false,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          const count = notifications.length;
          if (!isClosed) {
            controller.enqueue(`data: ${JSON.stringify({ count })}\n\n`);
          }
        } catch (error) {
          console.error("Error checking notifications:", error);
        }
      };

      // Initial check
      await checkNewNotifications();

      // Check for new notifications every 2 seconds
      const interval = setInterval(checkNewNotifications, 2000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(interval);
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
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}