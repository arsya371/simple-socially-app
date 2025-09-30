import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');
    
    const recentAuditLogs = await prisma.adminAuditLog.findMany({
      take: limit ? parseInt(limit) : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json(recentAuditLogs);
  } catch (error) {
    console.error("[ADMIN_ACTIONS_API]", error);
    return NextResponse.json(
      { error: "Failed to fetch admin actions" },
      { status: 500 }
    );
  }
}
