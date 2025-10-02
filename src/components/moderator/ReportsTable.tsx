"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: string;
  type: string;
  status: string;
  entityType: 'POST' | 'USER';
  content: string;
  createdAt: string;
  reporter: {
    id: string;
    username: string;
  };
  post?: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
    };
  };
  targetUser?: {
    id: string;
    username: string;
    status: string;
  };
};

export default function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/moderator/reports");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reports");
      }

      setReports(data.reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async (reportId: string, action: string, reason: string) => {
    try {
      const response = await fetch("/api/moderator/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId, action, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to handle report");
      }

      // Refresh reports list
      fetchReports();

      toast({
        title: "Success",
        description: "Report handled successfully.",
      });
    } catch (error) {
      console.error("Error handling report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to handle report. Please try again.",
      });
    }
  };

  const getReportTypeLabel = (report: Report) => {
    return report.entityType === 'USER' ? 'Account Report' : 'Content Report';
  };

  const getReportContent = (report: Report) => {
    if (report.entityType === 'USER') {
      return `Reported user: ${report.targetUser?.username}`;
    }
    return report.post?.content || 'Content unavailable';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Reported Content</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Badge variant="outline">
                  {getReportTypeLabel(report)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={report.status === "PENDING" ? "secondary" : "default"}>
                  {report.status}
                </Badge>
              </TableCell>
              <TableCell>{report.reporter.username}</TableCell>
              <TableCell className="max-w-xs truncate">
                {getReportContent(report)}
              </TableCell>
              <TableCell>
                {new Date(report.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="space-x-2">
                {report.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleReport(
                          report.id,
                          "RESOLVED",
                          report.entityType === 'USER' ? "Account action taken" : "Content removed"
                        )
                      }
                    >
                      {report.entityType === 'USER' ? 'Review Account' : 'Remove Content'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        handleReport(report.id, "DISMISSED", "No violation found")
                      }
                    >
                      Dismiss
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}