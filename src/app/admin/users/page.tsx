import prisma from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import UsersTable from "./UsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      verified: true,
      banned: true,
      bannedUntil: true,
      suspendedUntil: true,
      createdAt: true,
      image: true,
    },
  });

  const formattedUsers = users.map((user: any) => ({
    id: user.id,
    username: user.username || "",
    name: user.name || user.username || "",
    role: user.role,
    joined: user.createdAt,
    activated: user.isActive,
    verified: user.verified,
    banned: user.banned,
    bannedUntil: user.bannedUntil,
    suspendedUntil: user.suspendedUntil,
    avatarUrl: user.image,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="w-[300px]">
          <Input 
            type="search" 
            placeholder="Search by Username, First Name, Last Name, Email or Phone" 
            className="w-full"
          />
        </div>
      </div>
      
      <UsersTable users={formattedUsers} />
    </div>
  );
}