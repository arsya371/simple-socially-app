"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface AdminAction {
  id: string;
  action: string;
  details: string | null;
  performedById: string;
  performedOn: string | null;
  createdAt: Date;
  performedBy: {
    username: string;
  };
}

interface RecentAdminActionsProps {
  initialActions: AdminAction[];
}

export function RecentAdminActions({ initialActions }: RecentAdminActionsProps) {
  const [actions, setActions] = useState<AdminAction[]>(initialActions);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Set up SSE for real-time updates
    const eventSource = new EventSource('/api/admin/actions/stream');
    
    eventSource.onopen = () => {
      setIsConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      // Skip non-JSON messages like "connected" and "ping"
      if (event.data === "connected" || event.data === "ping") return;
      
      try {
        const data = JSON.parse(event.data);
        // If we got new admin actions, refresh the list
        if (data.newAction) {
          // Fetch updated actions
          fetch('/api/admin/actions')
            .then(res => res.json())
            .then(newActions => setActions(newActions))
            .catch(error => console.error('Error fetching admin actions:', error));
        }
      } catch (error) {
        console.error('Error parsing admin action data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Recent Admin Actions</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {actions.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground text-sm">
            No admin actions yet
          </div>
        ) : (
          actions.map((log) => (
            <Card key={log.id} className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm">{log.action}</p>
                  {log.details && <p className="text-xs text-muted-foreground mt-1">{log.details}</p>}
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-muted-foreground">
                    by {log.performedBy.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt))} ago
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
