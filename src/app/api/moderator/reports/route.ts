import { NextRequest, NextResponse } from "next/server";
import { checkRoleAuth } from "@/lib/role-middleware";
import prisma from "@/lib/prisma";
import { withLogging } from "@/lib/api-wrapper";

export const dynamic = 'force-dynamic';

export const GET = withLogging(async (req: NextRequest) => {
  const auth = await checkRoleAuth(["MODERATOR", "ADMIN"]);
  
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error?.includes("sign in") ? 401 : 403 }
    );
  }

  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
})

export const POST = withLogging(async (request: NextRequest) => {
  const auth = await checkRoleAuth(["MODERATOR", "ADMIN"]);
  
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error?.includes("sign in") ? 401 : 403 }
    );
  }

  try {
    const { reportId, action, reason } = await request.json();

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: action,
        resolution: reason,
        resolvedBy: auth.user?.id,
        resolvedAt: new Date(),
      },
      include: {
        post: true,
        reporter: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error handling report:", error);
    return NextResponse.json(
      { error: "Failed to handle report" },
      { status: 500 }
    );
  }
});