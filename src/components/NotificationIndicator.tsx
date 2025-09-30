'use client';

import { getNotifications } from "@/actions/notification.action";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export function NotificationIndicator() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    getNotifications().then(notifications => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    }).catch(error => {
      console.error('Error fetching notifications:', error);
    });

    // Set up SSE for real-time updates
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onmessage = (event) => {
      // Skip non-JSON messages like "connected"
      if (event.data === "connected" || event.data === "ping") return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.count !== undefined) {
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (unreadCount === 0) return null;

  return (
    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-xs">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}