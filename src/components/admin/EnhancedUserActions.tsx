"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle, Edit, Trash, Shield } from "lucide-react";
import { updateUserRole, toggleUserStatus, deleteUser, updateUser } from "@/actions/admin.action";
import { UserModerationModal } from "./UserModerationModal";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = "ADMIN" | "MODERATOR" | "USER";

interface UserActionsProps {
  userId: string;
  username: string;
  name: string;
  currentRole: Role;
  isActive: boolean;
  isVerified: boolean;
  isBanned: boolean;
  bannedUntil: Date | null;
  suspendedUntil: Date | null;
}

export function UserActions({
  userId,
  username,
  name,
  currentRole,
  isActive,
  isVerified,
  isBanned,
  bannedUntil,
  suspendedUntil
}: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: name,
    username: username,
  });

  const handleStatusToggle = async (action: 'ACTIVATE' | 'DEACTIVATE' | 'VERIFY' | 'UNVERIFY') => {
    try {
      setLoading(true);
      await toggleUserStatus(userId, action);
      toast.success(`User ${action.toLowerCase()}d successfully`);
      router.refresh();
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      setLoading(true);
      await updateUserRole(userId, newRole as Role);
      toast.success("User role updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };


  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateUser(userId, editForm);
      toast.success("User updated successfully");
      setShowEditDialog(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteUser(userId);
      toast.success("User deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={currentRole}
        onValueChange={handleRoleChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USER">User</SelectItem>
          <SelectItem value="MODERATOR">Moderator</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isVerified ? (
            <DropdownMenuItem onClick={() => handleStatusToggle('UNVERIFY')}>
              <XCircle className="mr-2 h-4 w-4" /> Remove Verification
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleStatusToggle('VERIFY')}>
              <CheckCircle className="mr-2 h-4 w-4" /> Verify User
            </DropdownMenuItem>
          )}
          
          {isActive ? (
            <DropdownMenuItem onClick={() => handleStatusToggle('DEACTIVATE')}>
              <XCircle className="mr-2 h-4 w-4" /> Deactivate Account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleStatusToggle('ACTIVATE')}>
              <CheckCircle className="mr-2 h-4 w-4" /> Activate Account
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => setShowModerationModal(true)}>
            <Shield className="mr-2 h-4 w-4" /> Manage Ban/Suspension
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit User
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={loading}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserModerationModal
        isOpen={showModerationModal}
        onClose={() => setShowModerationModal(false)}
        userId={userId}
        username={username}
        isBanned={isBanned}
        bannedUntil={bannedUntil}
        suspendedUntil={suspendedUntil}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you absolutely sure you want to delete this account? This action cannot be undone.
              This will permanently delete the user account and remove all associated data.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}