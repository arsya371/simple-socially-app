import { redirect } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import prisma from "@/lib/prisma";
import { checkRole } from "@/actions/auth.action";
import ReportsClientPage from "./page.client";
import { ReportWithRelations } from "@/types/report";

export default async function ReportsPage() {
  const isAdmin = await checkRole(["ADMIN"]);
  if (!isAdmin) {
    redirect("/");
  }

  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { username: true } },
        post: {
          select: {
            id: true,
            content: true,
            image: true,
            createdAt: true,
            author: { select: { username: true } }
          }
        },
        comment: {
          select: {
            id: true,
            content: true,
            author: { select: { username: true } }
          }
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            email: true,
            bio: true
          }
        }
      }
    });

    const mappedReports = reports.map(report => ({
      ...report,
      status: report.status === "REVIEWED" ? "RESOLVED" : report.status
    })) as unknown as ReportWithRelations[];

    return <ReportsClientPage initialReports={mappedReports} />;
  } catch (error: any) {
    console.error("[REPORTS_PAGE]", error);
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || "Failed to load reports. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }
}