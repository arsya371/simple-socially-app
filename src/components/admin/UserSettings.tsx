"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateUser, toggleUserStatus, banUser, unbanUser, updateUserRole, deleteUser } from "@/actions/admin.action";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

interface UserSettingsProps {
  userId: string;
  username: string;
  name: string;
  currentRole: "USER" | "MODERATOR" | "ADMIN";
  isActive: boolean;
  isVerified: boolean;
  isBanned: boolean;
  email: string;
}

export function UserSettings({ 
  userId,
  username: initialUsername,
  name: initialName,
  currentRole,
  isActive,
  isVerified,
  isBanned,
  email
}: UserSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [name, setName] = useState(initialName);
  const [verified, setVerified] = useState(isVerified);
  const [activated, setActivated] = useState(isActive);
  const [banned, setBanned] = useState(isBanned);
  const [banMessage, setBanMessage] = useState("");
  const [role, setRole] = useState(currentRole);

  const handleToggle = async (type: 'VERIFY' | 'UNVERIFY' | 'ACTIVATE' | 'DEACTIVATE') => {
    try {
      setLoading(true);
      await toggleUserStatus(userId, type);
      toast.success(`User ${type.toLowerCase()}d successfully`);
      
      if (type === 'VERIFY' || type === 'UNVERIFY') {
        setVerified(type === 'VERIFY');
      } else {
        setActivated(type === 'ACTIVATE');
      }
    } catch (error) {
      toast.error(`Failed to ${type.toLowerCase()} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async () => {
    try {
      setLoading(true);
      if (!banned) {
        // If banning, we need a message and we'll set it for 30 days by default
        if (!banMessage) {
          toast.error("Please provide a ban message");
          return;
        }
        await banUser(userId, 30); // 30 days ban
        setBanned(true);
      } else {
        await unbanUser(userId);
        setBanned(false);
        setBanMessage("");
      }
      toast.success(banned ? "User unbanned successfully" : "User banned successfully");
    } catch (error) {
      toast.error("Failed to update ban status");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUser(userId, { name, username });
      toast.success("User updated successfully");
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
      router.push('/admin/users');
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: "USER" | "MODERATOR" | "ADMIN") => {
    try {
      setLoading(true);
      await updateUserRole(userId, newRole);
      setRole(newRole);
      toast.success("User role updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User's display name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1"
                  placeholder="username"
                />

              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={email}
                readOnly
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label>User Group</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verified User</Label>
                  <div className="text-sm text-muted-foreground">
                    User will get a verification badge
                  </div>
                </div>
                <Switch
                  checked={verified}
                  onCheckedChange={(checked) => {
                    handleToggle(checked ? 'VERIFY' : 'UNVERIFY');
                  }}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Account Activated</Label>
                  <div className="text-sm text-muted-foreground">
                    User can access their account
                  </div>
                </div>
                <Switch
                  checked={activated}
                  onCheckedChange={(checked) => {
                    handleToggle(checked ? 'ACTIVATE' : 'DEACTIVATE');
                  }}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Account Banned</Label>
                  <div className="text-sm text-muted-foreground">
                    User will not be able to access their account
                  </div>
                </div>
                <Switch
                  checked={banned}
                  onCheckedChange={handleBanToggle}
                  disabled={loading}
                />
              </div>

              {banned && (
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="banMessage">Ban Message</Label>
                  <Textarea
                    id="banMessage"
                    value={banMessage}
                    onChange={(e) => setBanMessage(e.target.value)}
                    placeholder="The message that will be shown to the user when they try to access their account"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading}>
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user account
                    and remove all associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}