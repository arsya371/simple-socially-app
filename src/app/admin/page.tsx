import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const [totalUsers, totalPosts, totalComments] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
  ]);

  const recentAuditLogs = await prisma.adminAuditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      performedBy: {
        select: {
          username: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-3xl font-bold">{totalUsers}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Total Posts</h3>
          <p className="text-3xl font-bold">{totalPosts}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Total Comments</h3>
          <p className="text-3xl font-bold">{totalComments}</p>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-4">Recent Admin Actions</h2>
        <div className="space-y-4">
          {recentAuditLogs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{log.action}</p>
                  {log.details && <p className="text-sm text-muted-foreground">{log.details}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    by {log.performedBy.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}