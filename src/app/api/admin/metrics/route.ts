import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

let startTime = Date.now();

function getUptime() {
  return Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
}

async function calculateMetrics() {
  const [errorLogs, totalLogs] = await Promise.all([
    prisma.systemLog.count({
      where: {
        level: 'ERROR',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.systemLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  const averageResponse = await prisma.systemLog.aggregate({
    _avg: {
      duration: true
    },
    where: {
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  });

  return {
    errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0,
    averageResponseTime: averageResponse._avg.duration || 0,
    totalRequests: totalLogs
  };
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: {
        clerkId: user.id,
        role: "ADMIN",
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get real-time metrics
    const calculatedMetrics = await calculateMetrics();
    
    // Get additional statistics
    const [totalUsers, totalPosts, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.report.count({
        where: { status: "PENDING" },
      }),
    ]);

    // Update the metrics in the database
    const currentMetrics = await prisma.systemMetric.upsert({
      where: { id: 'current' },
      update: {
        totalRequests: calculatedMetrics.totalRequests,
        averageResponseTime: calculatedMetrics.averageResponseTime,
        errorRate: calculatedMetrics.errorRate,
        uptime: getUptime(),
      },
      create: {
        id: 'current',
        totalRequests: calculatedMetrics.totalRequests,
        averageResponseTime: calculatedMetrics.averageResponseTime,
        errorRate: calculatedMetrics.errorRate,
        uptime: getUptime(),
      },
    });

    return NextResponse.json({
      metrics: {
        ...currentMetrics,
        totalUsers,
        totalPosts,
        pendingReports,
      },
    });
  } catch (error) {
    console.error("Error in admin metrics route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}