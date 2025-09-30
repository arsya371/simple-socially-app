"use client";

import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";
import { NotificationsSkeleton } from "@/components/NotificationSkeleton";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircleIcon,
  BanIcon,
  HeartIcon,
  MessageCircleIcon,
  ShieldIcon,
  UserPlusIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Notifications = Awaited<ReturnType<typeof getNotifications>>;
type Notification = Notifications[number];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return <HeartIcon className="size-4 text-red-500" />;
    case "COMMENT":
      return <MessageCircleIcon className="size-4 text-blue-500" />;
    case "FOLLOW":
      return <UserPlusIcon className="size-4 text-green-500" />;
    case "ACCOUNT_SUSPENDED":
      return <AlertCircleIcon className="size-4 text-orange-500" />;
    case "ACCOUNT_BANNED":
      return <BanIcon className="size-4 text-red-500" />;
    case "ACCOUNT_VERIFIED":
    case "ACCOUNT_ACTIVATED":
    case "ACCOUNT_STATUS_CHANGED":
      return <ShieldIcon className="size-4 text-green-500" />;
    default:
      return null;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);

        const unreadIds = data.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
          await markNotificationsAsRead(unreadIds);
        }
      } catch (error) {
        toast.error("Failed to fetch notifications");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up SSE for real-time updates
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onmessage = (event) => {
      // Skip non-JSON messages like "connected" and "ping"
      if (event.data === "connected" || event.data === "ping") return;
      
      try {
        const data = JSON.parse(event.data);
        // If we got new notifications, refresh the list
        if (data.count > 0) {
          fetchNotifications();
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

  if (isLoading) return <NotificationsSkeleton />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <span className="text-sm text-muted-foreground">
              {notifications.filter((n) => !n.read).length} unread
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with circular background */}
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notification.creator.image ?? "/avatar.png"} />
                        {!notification.creator.image && (
                          <div className="w-10 h-10 bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                            {(notification.creator.name ?? notification.creator.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Avatar>
                      {/* Heart icon positioned next to avatar */}
                      {notification.type === "LIKE" && (
                        <div className="absolute -right-1 -top-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <HeartIcon className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {notification.type !== "LIKE" && getNotificationIcon(notification.type)}
                          <span className="text-sm">
                            {notification.message ? (
                              notification.message
                            ) : (
                              <>
                                <span className="font-semibold text-white">
                                  {notification.creator.name ?? notification.creator.username}
                                </span>{" "}
                                <span className="text-white">
                                  {notification.type === "FOLLOW"
                                    ? "started following you"
                                    : notification.type === "LIKE"
                                    ? "liked your post"
                                    : "commented on your post"}
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.createdAt))} ago
                        </span>
                      </div>

                      {notification.post &&
                        (notification.type === "LIKE" || notification.type === "COMMENT") && (
                          <div className="mt-2">
                            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {notification.post.content}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}