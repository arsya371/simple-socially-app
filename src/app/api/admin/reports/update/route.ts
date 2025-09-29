import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { 
        id: true,
        role: true 
      }
    });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "MODERATOR")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { reportId, status } = body;

    const report = await prisma.report.update({
      where: { id: reportId },
      data: { 
        status,
        reviewedBy: dbUser.id, // Use the database user ID instead of Clerk ID
        actionTaken: status === "RESOLVED" ? "Report reviewed and action taken" : "Report reviewed",
        updatedAt: new Date()
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("[REPORT_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}