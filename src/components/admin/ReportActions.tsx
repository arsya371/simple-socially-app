"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MoreVertical, Trash2, UserX, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface ReportActionsProps {
  reportId: string;
  currentStatus: string;
  type: "POST" | "COMMENT" | "PROFILE";
  targetId: string;
  targetUrl?: string;
}

export function ReportActions({ reportId, currentStatus, type, targetId, targetUrl }: ReportActionsProps) {
  const router = useRouter();
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspensionDuration, setSuspensionDuration] = useState("7");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleStatusUpdate(newStatus: string) {
    try {
      const res = await fetch("/api/admin/reports/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update report status");
      }

      toast.success("Status updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update status");
    }
  }

  async function handleDeleteContent() {
    try {
      const res = await fetch("/api/admin/actions/delete-content", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          targetId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete content");
      }

      toast.success("Content deleted successfully");
      await handleStatusUpdate("RESOLVED");
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  }

  async function handleSuspendAccount() {
    try {
      const res = await fetch("/api/admin/actions/suspend-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: targetId,
          duration: parseInt(suspensionDuration),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to suspend account");
      }

      toast.success("Account suspended successfully");
      await handleStatusUpdate("RESOLVED");
      setShowSuspendDialog(false);
    } catch (error) {
      console.error("Error suspending account:", error);
      toast.error("Failed to suspend account");
    }
  }

  async function handleDeleteAccount() {
    try {
      const res = await fetch("/api/admin/actions/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: targetId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success("Account deleted successfully");
      await handleStatusUpdate("RESOLVED");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="-mx-2">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {currentStatus !== "REVIEWED" && (
            <DropdownMenuItem onClick={() => handleStatusUpdate("REVIEWED")}>
              Mark as Reviewed
            </DropdownMenuItem>
          )}

          {type === "POST" && (
            <>
              <DropdownMenuItem>
                <Link 
                  href={targetUrl || ''} 
                  className="flex items-center" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Post
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </>
          )}

          {type === "PROFILE" && (
            <>
              <DropdownMenuItem>
                <Link 
                  href={targetUrl || ''} 
                  className="flex items-center" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Suspend Account
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => {
                      setSuspensionDuration("1");
                      setShowSuspendDialog(true);
                    }}>
                      24 Hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSuspensionDuration("7");
                      setShowSuspendDialog(true);
                    }}>
                      7 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSuspensionDuration("30");
                      setShowSuspendDialog(true);
                    }}>
                      30 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSuspensionDuration("permanent");
                      setShowSuspendDialog(true);
                    }}>
                      Permanent
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <UserX className="w-4 h-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            </>
          )}

          {currentStatus !== "DISMISSED" && (
            <DropdownMenuItem onClick={() => handleStatusUpdate("DISMISSED")}>
              Dismiss Report
            </DropdownMenuItem>
          )}

          {targetUrl && (
            <DropdownMenuItem onClick={() => window.open(targetUrl, "_blank")}>
              View Content
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {type === "PROFILE" ? "Delete Account" : "Delete Post"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {type === "PROFILE"
                ? "This will permanently delete the user account and all associated content. This action cannot be undone."
                : "This will permanently delete this post. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={type === "PROFILE" ? handleDeleteAccount : handleDeleteContent}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              This will temporarily suspend the user account. The user will not be able to log in during the suspension period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Suspension Duration</Label>
              <RadioGroup
                value={suspensionDuration}
                onValueChange={setSuspensionDuration}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="1" />
                  <Label htmlFor="1">24 Hours</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7" id="7" />
                  <Label htmlFor="7">7 Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="30" />
                  <Label htmlFor="30">30 Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="permanent" id="permanent" />
                  <Label htmlFor="permanent">Permanent</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSuspendAccount} variant="destructive">
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}