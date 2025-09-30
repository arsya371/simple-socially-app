import { getAuth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
// import { ReportType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user from our database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await req.json();
    const { type, targetId, reason, details } = body;

    if (!type || !targetId || !reason) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!["POST", "COMMENT", "PROFILE"].includes(type)) {
      return new NextResponse("Invalid report type", { status: 400 });
    }

    // Verify the target exists
    const targetExists = await (async () => {
      switch (type) {
        case "POST":
          return await prisma.post.findUnique({ where: { id: targetId } });
        case "COMMENT":
          return await prisma.comment.findUnique({ where: { id: targetId } });
        case "PROFILE":
          return await prisma.user.findUnique({ where: { id: targetId } });
        default:
          return false;
      }
    })();

    if (!targetExists) {
      return new NextResponse("Target not found", { status: 404 });
    }

    const report = await prisma.report.create({
      data: {
        type,
        reason,
        details,
        reportedBy: user.id, // Use our database user ID
        status: "PENDING",
        ...(type === "POST" ? { postId: targetId } : 
           type === "COMMENT" ? { commentId: targetId } : 
           type === "PROFILE" ? { reportedUserId: targetId } : {})
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("[REPORT_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}