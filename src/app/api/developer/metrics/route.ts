import { NextResponse } from "next/server";
import { checkRoleAuth } from "@/lib/role-middleware";
import prisma from "@/lib/prisma";
import { withLogging } from "@/lib/api-wrapper";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = withLogging(async (req: NextRequest) => {
    const auth = await checkRoleAuth(["DEVELOPER", "ADMIN"]);
  
    if (!auth.isAuthorized) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.error?.includes("sign in") ? 401 : 403 }
        );
    }

    try {
        // Fetch total counts
        const [userCount, postCount, pendingReportCount] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.report.count({
                where: { status: "PENDING" }
            })
        ]);

        // Get recent system logs with all levels for comprehensive monitoring
        const [errorLogs, allLogs, recentLogs] = await Promise.all([
            // Get error logs
            prisma.systemLog.findMany({
                where: { level: "ERROR" },
                take: 50,
                orderBy: { timestamp: "desc" }
            }),
            // Get logs for metrics calculation
            prisma.systemLog.findMany({
                where: {
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                }
            }),
            // Get recent logs of all types for comprehensive activity monitoring
            prisma.systemLog.findMany({
                take: 50,  // Increased to show more activities
                orderBy: { timestamp: "desc" },
                where: {
                    OR: [
                        // Admin activities
                        { path: { contains: '/api/admin' } },
                        // Moderator activities
                        { path: { contains: '/api/moderator' } },
                        // Developer activities
                        { path: { contains: '/api/developer' } },
                        // User activities (posts, comments, etc.)
                        { path: { contains: '/api/posts' } },
                        { path: { contains: '/api/comments' } },
                        // Role changes and user management
                        { message: { contains: 'role' } },
                        { message: { contains: 'user' } },
                        // Status changes
                        { message: { contains: 'status' } },
                    ]
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            role: true,
                            status: true
                        }
                    }
                }
            })
        ]);

        // Calculate real metrics from actual log data
        const totalRequests = allLogs.length;
        const averageResponseTime = allLogs.reduce((acc, log) => acc + log.duration, 0) / (totalRequests || 1);
        const errorCount = allLogs.filter(log => log.statusCode >= 400).length;
        const errorRate = totalRequests ? (errorCount / totalRequests) : 0;
        
        // Calculate uptime based on the earliest log in the last 24 hours
        const earliestLog = allLogs.reduce((earliest, log) => 
            log.timestamp < earliest ? log.timestamp : earliest, 
            new Date()
        );
        const uptimeHours = (Date.now() - earliestLog.getTime()) / (1000 * 60 * 60);

        const apiMetrics = {
            totalRequests,
            averageResponseTime: `${averageResponseTime.toFixed(2)}ms`,
            errorRate: `${(errorRate * 100).toFixed(2)}%`,
            uptime: `${uptimeHours.toFixed(2)} hours`,
            totalErrorsToday: errorCount,
            successRate: `${((1 - errorRate) * 100).toFixed(2)}%`
        };

        return NextResponse.json({
            users: userCount,
            posts: postCount,
            pendingReports: pendingReportCount,
            apiMetrics,
            recentErrors: errorLogs.map(error => ({
                id: error.id,
                message: error.message,
                path: error.path,
                timestamp: error.timestamp.toISOString(),
                statusCode: error.statusCode,
                metadata: error.metadata
            })),
            recentActivity: recentLogs.map(log => ({
                id: log.id,
                method: log.method,
                path: log.path,
                statusCode: log.statusCode,
                duration: log.duration,
                level: log.level,
                message: log.message,
                timestamp: log.timestamp.toISOString(),
                // metadata: log.metadata,
                user: log.user ? {
                    username: log.user.username,
                    role: log.user.role,
                    status: log.user.status
                } : null
            }))
        });
    } catch (error) {
        console.error("Error fetching metrics:", error);
        return NextResponse.json(
            { error: "Failed to fetch metrics" },
            { status: 500 }
        );
    }
})