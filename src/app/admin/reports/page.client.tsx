"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportActions } from "@/components/admin/ReportActions";
import { Badge } from "@/components/ui/badge";
import { formatTimeToNow } from "@/lib/utils";
import Link from "next/link";

import { ReportWithRelations } from "@/types/report";

interface ReportsClientPageProps {
  initialReports: ReportWithRelations[];
}

export default function ReportsClientPage({ initialReports }: ReportsClientPageProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [reports, setReports] = useState<ReportWithRelations[]>(initialReports);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "yellow";
      case "RESOLVED":
        return "green";
      case "DISMISSED":
        return "gray";
      default:
        return "default";
    }
  };

  const filteredReports = reports.filter((report) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return report.status === "PENDING";
    if (activeTab === "resolved") return report.status === "RESOLVED";
    if (activeTab === "dismissed") return report.status === "DISMISSED";
    return true;
  });

  return (
    <Card className="p-6">
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.reporter.username}</TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(report.status) as any}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTimeToNow(new Date(report.createdAt))}</TableCell>
                    <TableCell className="text-right">
                      <ReportActions
                        reportId={report.id}
                        currentStatus={report.status}
                        type={report.type}
                        targetId={
                          report.post?.id || 
                          report.comment?.id || 
                          report.reportedUser?.id || 
                          ""
                        }
                        targetUrl={
                          report.type === "POST"
                            ? `/post/${report.post?.id}`
                            : report.type === "COMMENT"
                            ? `/post/${report.comment?.id}`
                            : `/profile/${report.reportedUser?.username}`
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
