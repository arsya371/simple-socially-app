'use client';

import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useNotificationStore } from '@/store/notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize real-time notifications
  useRealTimeNotifications();

  return <>{children}</>;
}