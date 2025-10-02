"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Metrics = {
  users: number;
  posts: number;
  pendingReports: number;
  apiMetrics: {
    totalRequests: number;
    averageResponseTime: string;
    errorRate: string;
    uptime: string;
    totalErrorsToday: number;
    successRate: string;
  };
  recentErrors: Array<{
    id: string;
    message: string;
    path: string;
    timestamp: string;
    statusCode: number;
    metadata: any;
  }>;
  recentActivity: Array<{
    id: string;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    level: string;
    message: string;
    timestamp: string;
    metadata: any;
    user?: {
      username: string;
      role: string;
      status: string;
    };
  }>;
};

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
    // Set up polling every minute
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/developer/metrics");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch metrics");
      }

      setMetrics(data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load system metrics. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
          <CardDescription>Active user count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.users}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Posts</CardTitle>
          <CardDescription>Content count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.posts}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Uptime</CardTitle>
          <CardDescription>System availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.apiMetrics.uptime}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
          <CardDescription>API failures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.apiMetrics.errorRate}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>API Performance</CardTitle>
          <CardDescription>Response times and request volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Average Response Time:</span>
              <span className="font-mono">{metrics.apiMetrics.averageResponseTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Requests:</span>
              <span className="font-mono">{metrics.apiMetrics.totalRequests.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Real-time metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span className="font-mono">{metrics.apiMetrics.successRate}</span>
            </div>
            <div className="flex justify-between">
              <span>Errors Today:</span>
              <span className="font-mono">{metrics.apiMetrics.totalErrorsToday}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest operations and access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {metrics.recentActivity.map((log) => (
              <div key={log.id} className="text-sm border-b pb-2">
                <div className="flex justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${log.statusCode >= 400 ? 'text-red-500' : 'text-green-500'}`}>
                      {log.method} {log.statusCode}
                    </span>
                    {log.user && (
                      <span className="px-2 py-0.5 rounded bg-background text-xs">
                        {log.user.username} ({log.user.role})
                      </span>
                    )}
                  </div>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="mt-1 font-mono text-xs">{log.path}</p>
                {log.message && (
                  <p className="mt-1 text-sm text-gray-600">{log.message}</p>
                )}
                <div className="flex justify-between mt-1 text-xs">
                  <span className={`px-2 py-0.5 rounded ${log.level === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {log.level}
                  </span>
                  <span>{log.duration}ms</span>
                </div>
                {log.metadata && (
                  <div className="mt-2 p-2 bg-background rounded text-xs">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Error Log</CardTitle>
          <CardDescription>Recent system errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {metrics.recentErrors.map((error) => (
              <div key={error.id} className="text-sm border-b pb-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-red-500 font-mono">{error.statusCode}</span>
                  <span>{new Date(error.timestamp).toLocaleString()}</span>
                </div>
                <p className="mt-1">{error.message}</p>
                <p className="mt-1 font-mono text-xs">{error.path}</p>
                {error.metadata && (
                  <pre className="mt-2 text-xs bg-background p-2 rounded">
                    {JSON.stringify(error.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}