"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Ban, Clock, AlertTriangle } from "lucide-react";
import { banUser, unbanUser, suspendUser, unsuspendUser } from "@/actions/admin.action";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface UserModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  isBanned: boolean;
  bannedUntil: Date | null;
  suspendedUntil: Date | null;
}

export function UserModerationModal({
  isOpen,
  onClose,
  userId,
  username,
  isBanned,
  bannedUntil,
  suspendedUntil,
}: UserModerationModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banDuration, setBanDuration] = useState("1");
  const [suspendDuration, setSuspendDuration] = useState("1");

  const isCurrentlySuspended = suspendedUntil && new Date(suspendedUntil) > new Date();

  const handleBan = async () => {
    try {
      setLoading(true);
      await banUser(userId, parseInt(banDuration));
      toast.success("User banned successfully");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Failed to ban user");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async () => {
    try {
      setLoading(true);
      await unbanUser(userId);
      toast.success("User unbanned successfully");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Failed to unban user");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    try {
      setLoading(true);
      await suspendUser(userId, parseInt(suspendDuration));
      toast.success("User suspended successfully");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Failed to suspend user");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    try {
      setLoading(true);
      await unsuspendUser(userId);
      toast.success("User unsuspended successfully");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Failed to unsuspend user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            User Moderation - {username}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="flex flex-wrap gap-2">
              {isBanned && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Ban className="h-3 w-3" />
                  Banned
                  {bannedUntil && (
                    <span className="text-xs">
                      (until {new Date(bannedUntil).toLocaleDateString()})
                    </span>
                  )}
                </Badge>
              )}
              {isCurrentlySuspended && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Suspended
                  <span className="text-xs">
                    (until {new Date(suspendedUntil!).toLocaleDateString()})
                  </span>
                </Badge>
              )}
              {!isBanned && !isCurrentlySuspended && (
                <Badge variant="outline" className="text-green-600">
                  Active
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="ban" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ban" className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Ban Management
              </TabsTrigger>
              <TabsTrigger value="suspend" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Suspension Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ban" className="space-y-4">
              {isBanned ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      This user is currently banned.
                      {bannedUntil && (
                        <span className="block mt-1">
                          Ban expires: {new Date(bannedUntil).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={handleUnban}
                    disabled={loading}
                    className="w-full"
                    variant="outline"
                  >
                    Remove Ban
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="banDuration">Ban Duration (days)</Label>
                    <Input
                      id="banDuration"
                      type="number"
                      min="1"
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      placeholder="Enter number of days"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty or enter 0 for permanent ban
                    </p>
                  </div>
                  <Button
                    onClick={handleBan}
                    disabled={loading || !banDuration}
                    className="w-full"
                    variant="destructive"
                  >
                    Ban User
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="suspend" className="space-y-4">
              {isCurrentlySuspended ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      This user is currently suspended.
                      <span className="block mt-1">
                        Suspension expires: {new Date(suspendedUntil!).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <Button
                    onClick={handleUnsuspend}
                    disabled={loading}
                    className="w-full"
                    variant="outline"
                  >
                    Remove Suspension
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="suspendDuration">Suspension Duration (days)</Label>
                    <Input
                      id="suspendDuration"
                      type="number"
                      min="1"
                      value={suspendDuration}
                      onChange={(e) => setSuspendDuration(e.target.value)}
                      placeholder="Enter number of days"
                    />
                    <p className="text-xs text-muted-foreground">
                      User will be unable to access their account during suspension
                    </p>
                  </div>
                  <Button
                    onClick={handleSuspend}
                    disabled={loading || !suspendDuration}
                    className="w-full"
                    variant="secondary"
                  >
                    Suspend User
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
