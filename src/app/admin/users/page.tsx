import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import UserActions from "@/components/admin/UserActions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      suspendedUntil: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{user.username}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {user.role}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.isActive 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                  {user.suspendedUntil && new Date(user.suspendedUntil) > new Date() && (
                    <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded ml-2">
                      Suspended until {new Date(user.suspendedUntil).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="space-y-1 mb-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Posts:</span>{" "}
                    {user._count.posts}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Followers:</span>{" "}
                    {user._count.followers}
                  </p>
                </div>
                                <UserActions
                  userId={user.id}
                  currentRole={user.role}
                  isActive={user.isActive}
                  isSuspended={user.suspendedUntil ? new Date(user.suspendedUntil) > new Date() : false}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}