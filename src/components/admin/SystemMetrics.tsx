"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type SystemMetrics = {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  createdAt: string;
  updatedAt: string;
};

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
    // Refresh metrics every minute
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/metrics");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch metrics");
      }

      setMetrics(data.metrics);
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

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-muted-foreground">
        No metrics data available
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Users",
      value: metrics.totalUsers.toLocaleString(),
      description: "Registered users on the platform",
    },
    {
      title: "Total Posts",
      value: metrics.totalPosts.toLocaleString(),
      description: "Published posts",
    },
    {
      title: "Pending Reports",
      value: metrics.pendingReports.toLocaleString(),
      description: "Reports awaiting moderation",
    },
    {
      title: "System Uptime",
      value: formatUptime(metrics.uptime),
      description: "Time since last restart",
    },
    {
      title: "Average Response Time",
      value: `${metrics.averageResponseTime.toFixed(2)}ms`,
      description: "Average server response time",
    },
    {
      title: "Error Rate",
      value: `${(metrics.errorRate * 100).toFixed(2)}%`,
      description: "Percentage of failed requests",
    },
    {
      title: "Total Requests",
      value: metrics.totalRequests.toLocaleString(),
      description: "Total API requests processed",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metricCards.map((metric) => (
        <Card key={metric.title} className="p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </h3>
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}