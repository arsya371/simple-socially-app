"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { updateUserRole, toggleUserStatus, removeSuspension } from "@/actions/admin.action";
import { useRouter } from "next/navigation";

type Role = "ADMIN" | "MODERATOR" | "USER";

interface UserActionsProps {
  userId: string;
  currentRole: Role;
  isActive: boolean;
  isSuspended?: boolean;
}

export default function UserActions({ userId, currentRole, isActive, isSuspended }: UserActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleUpdate = async (newRole: Role) => {
    try {
      setIsLoading(true);
      await updateUserRole(userId, newRole);
      router.refresh();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      setIsLoading(true);
      await toggleUserStatus(userId);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSuspension = async () => {
    try {
      setIsLoading(true);
      await removeSuspension(userId);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove suspension:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => handleRoleUpdate("ADMIN")}
          disabled={currentRole === "ADMIN" || isLoading}
        >
          Make Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => handleRoleUpdate("MODERATOR")}
          disabled={currentRole === "MODERATOR" || isLoading}
        >
          Make Moderator
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => handleRoleUpdate("USER")}
          disabled={currentRole === "USER" || isLoading}
        >
          Reset to User
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleStatusToggle}
          disabled={isLoading}
        >
          {isActive ? "Deactivate User" : "Activate User"}
        </DropdownMenuItem>
        {isSuspended && (
          <DropdownMenuItem
            onSelect={handleRemoveSuspension}
            disabled={isLoading}
            className="text-red-500 focus:text-red-500"
          >
            Remove Suspension
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}