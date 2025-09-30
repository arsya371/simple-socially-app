import { Card } from "@/components/ui/card";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { WebsiteVisitsCard } from "@/components/admin/WebsiteVisitsCard";
import { RecentAdminActions } from "@/components/admin/RecentAdminActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Settings, Users, Shield, BarChart3 } from "lucide-react";

export default async function AdminDashboard() {
  const [
    totalUsers, 
    totalPosts, 
    totalComments,
    bannedUsers,
    suspendedUsers,
    verifiedUsers,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.user.count({ where: { banned: true } }),
    prisma.user.count({ where: { suspendedUntil: { not: null } } }),
    prisma.user.count({ where: { verified: true } }),
    prisma.user.findMany({
      take: 7,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    })
  ]);

  const [recentAuditLogs, appSettingsCount] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: {
          select: {
            username: true,
          },
        },
      },
    }),
    prisma.appSetting.count()
  ]);

  // Create chart data for user registration over time
  const userRegistrationData = recentUsers.map((user, index) => ({
    day: `Day ${index + 1}`,
    users: index + 1,
  }));

  // Create account status distribution data
  const accountStatusData = [
    { name: "Active", value: totalUsers - bannedUsers - suspendedUsers, color: "#10b981" },
    { name: "Banned", value: bannedUsers, color: "#ef4444" },
    { name: "Suspended", value: suspendedUsers, color: "#f59e0b" },
    { name: "Verified", value: verifiedUsers, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
      {/* Main Metrics Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Core Metrics */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">Total Users</h3>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{totalUsers}</p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <h3 className="text-lg font-semibold mb-2 text-green-700 dark:text-green-300">Total Posts</h3>
          <p className="text-4xl font-bold text-green-900 dark:text-green-100">{totalPosts}</p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-semibold mb-2 text-purple-700 dark:text-purple-300">Total Comments</h3>
          <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{totalComments}</p>
        </Card>

        <WebsiteVisitsCard />

        {/* Account Status Metrics */}
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
          <h3 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">Banned Accounts</h3>
          <p className="text-4xl font-bold text-red-900 dark:text-red-100">{bannedUsers}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <h3 className="text-lg font-semibold mb-2 text-orange-700 dark:text-orange-300">Suspended Accounts</h3>
          <p className="text-4xl font-bold text-orange-900 dark:text-orange-100">{suspendedUsers}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700">
          <h3 className="text-lg font-semibold mb-2 text-emerald-700 dark:text-emerald-300">Verified Accounts</h3>
          <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">{verifiedUsers}</p>
        </Card>
      </div>

      {/* Charts Section */}
      <DashboardCharts 
        userRegistrationData={userRegistrationData}
        accountStatusData={accountStatusData}
      />

      {/* Quick Actions Section
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">App Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure application settings
                </p>
                <Badge variant="secondary" className="mb-4">
                  {appSettingsCount} settings
                </Badge>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <Link href="/admin/settings/app">
              <Button className="w-full">
                Manage Settings
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">User Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage users and permissions
                </p>
                <Badge variant="secondary" className="mb-4">
                  {totalUsers} users
                </Badge>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <Link href="/admin/users">
              <Button className="w-full">
                Manage Users
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Site Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure site-wide settings
                </p>
                <Badge variant="secondary" className="mb-4">
                  General & Security
                </Badge>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <Link href="/admin/settings">
              <Button className="w-full">
                Site Settings
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Reports</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review and manage reports
                </p>
                <Badge variant="secondary" className="mb-4">
                  Content Moderation
                </Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <Link href="/admin/reports">
              <Button className="w-full">
                View Reports
              </Button>
            </Link>
          </Card>
        </div>
      </div> */}

      <RecentAdminActions initialActions={recentAuditLogs} />
    </div>
  );
}