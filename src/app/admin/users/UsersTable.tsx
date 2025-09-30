"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActions } from "@/components/admin/EnhancedUserActions";
import Link from "next/link";

type User = {
  id: string;
  username: string;
  name: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  joined: Date;
  activated: boolean;
  verified: boolean;
  banned: boolean;
  bannedUntil: Date | null;
  suspendedUntil: Date | null;
  avatarUrl: string | null;
};

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </div>
              </TableCell>
              <TableCell>
                {user.username}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {user.activated ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                  {user.verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Verified
                    </span>
                  )}
                  {user.banned && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Banned
                    </span>
                  )}
                  {user.suspendedUntil && new Date(user.suspendedUntil) > new Date() && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Suspended
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{new Date(user.joined).toLocaleDateString()}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <UserActions
                  userId={user.id}
                  username={user.username}
                  name={user.name}
                  currentRole={user.role}
                  isActive={user.activated}
                  isVerified={user.verified}
                  isBanned={user.banned}
                  bannedUntil={user.bannedUntil}
                  suspendedUntil={user.suspendedUntil}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}