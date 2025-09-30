"use client";

import { 
  removeBan as unbanUser,
  removeSuspension,
  updateUserRole,
  toggleUserStatus,
  banUser,
} from "@/actions/admin.action";
import { Button } from "../ui/button";
import { useState } from "react";
import toast from "react-hot-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface User {
  id: string;
  role: "ADMIN" | "MODERATOR" | "USER";
  banned: boolean;
  bannedUntil: Date | null;
  isActive: boolean;
  verified: boolean;
  activated: boolean;
  suspendedUntil: Date | null;
}

export function UserActions({ user }: { user: User }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [showBanInput, setShowBanInput] = useState(false);
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [showUpdateSuspendInput, setShowUpdateSuspendInput] = useState(false);
  const [duration, setDuration] = useState("");

  const handleRoleUpdate = async (newRole: "ADMIN" | "MODERATOR" | "USER") => {
    try {
      setIsProcessing(true);
      await updateUserRole(user.id, newRole);
      toast.success(`Role updated to ${newRole}`);
      window.location.reload();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusToggle = async (action: 'ACTIVATE' | 'DEACTIVATE') => {
    try {
      setIsProcessing(true);
      await toggleUserStatus(user.id, action);
      toast.success(`User ${action.toLowerCase()}d successfully`);
      window.location.reload();
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} user:`, error);
      toast.error(`Failed to ${action.toLowerCase()} user`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBan = async (permanent: boolean = false) => {
    if (isBanning) return;
    
    try {
      setIsBanning(true);
      const days = permanent ? null : Number(duration);
      await banUser(user.id, days);
      toast.success(`User has been ${permanent ? 'permanently' : 'temporarily'} banned`);
      window.location.reload();
      setShowBanInput(false);
      setDuration('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to ban user');
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnban = async () => {
    if (isUnbanning) return;
    
    try {
      setIsUnbanning(true);
      await unbanUser(user.id);
      toast.success('User has been unbanned');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unban user');
    } finally {
      setIsUnbanning(false);
    }
  };

  const handleSuspend = async () => {
    if (!duration) return;
    
    try {
      setIsProcessing(true);
      await fetch('/api/admin/actions/suspend-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, duration: Number(duration) })
      });
      toast.success('User has been suspended');
      window.location.reload();
      setShowSuspendInput(false);
      setDuration('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDuration = async () => {
    if (!duration) return;

    try {
      setIsProcessing(true);
      await fetch('/api/admin/actions/update-suspension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, duration: Number(duration) })
      });
      toast.success('Suspension duration updated');
      window.location.reload();
      setShowUpdateSuspendInput(false);
      setDuration('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update suspension duration');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    try {
      setIsProcessing(true);
      await removeSuspension(user.id);
      toast.success('Suspension removed');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove suspension');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetInputs = () => {
    setShowBanInput(false);
    setShowSuspendInput(false);
    setShowUpdateSuspendInput(false);
    setDuration('');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Role Management */}
        <DropdownMenuItem 
          onSelect={() => handleRoleUpdate("ADMIN")}
          disabled={user.role === "ADMIN" || isProcessing}>
          Make Admin
        </DropdownMenuItem>
        <DropdownMenuItem 
          onSelect={() => handleRoleUpdate("MODERATOR")}
          disabled={user.role === "MODERATOR" || isProcessing}>
          Make Moderator
        </DropdownMenuItem>
        <DropdownMenuItem 
          onSelect={() => handleRoleUpdate("USER")}
          disabled={user.role === "USER" || isProcessing}>
          Make Regular User
        </DropdownMenuItem>

        {/* Account Status */}
        <DropdownMenuItem 
          onSelect={() => handleStatusToggle(user.isActive ? 'DEACTIVATE' : 'ACTIVATE')}>
          {user.isActive ? "Deactivate User" : "Activate User"}
        </DropdownMenuItem>

        {/* Ban Controls */}
        {!user.banned && (
          <DropdownMenuItem onSelect={() => setShowBanInput(true)}>
            Ban User
          </DropdownMenuItem>
        )}

        {/* Suspension Controls */}
        {!user.suspendedUntil && (
          <DropdownMenuItem onSelect={() => setShowSuspendInput(true)}>
            Suspend User
          </DropdownMenuItem>
        )}

        {user.suspendedUntil && (
          <>
            <DropdownMenuItem onSelect={() => setShowUpdateSuspendInput(true)}>
              Update Suspension
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleUnsuspend}>
              Remove Suspension
            </DropdownMenuItem>
          </>
        )}
        
        {showBanInput && (
          <div className="p-2 border-t mt-2">
            <p className="text-xs text-gray-600 mb-2">Enter ban duration (days)</p>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Days (empty for permanent)"
              className="w-full p-1 mb-2 border rounded text-sm"
              min="1"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleBan(duration === '')}
                className="flex-1 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                disabled={isBanning}>
                Ban
              </button>
              <button
                onClick={resetInputs}
                className="flex-1 px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {showSuspendInput && (
          <div className="p-2 border-t mt-2">
            <p className="text-xs text-gray-600 mb-2">Enter suspension duration (days)</p>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Days"
              className="w-full p-1 mb-2 border rounded text-sm"
              min="1"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSuspend}
                className="flex-1 px-2 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                disabled={!duration || isProcessing}>
                Suspend
              </button>
              <button
                onClick={resetInputs}
                className="flex-1 px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {showUpdateSuspendInput && (
          <div className="p-2 border-t mt-2">
            <p className="text-xs text-gray-600 mb-2">Enter new duration (days)</p>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Days"
              className="w-full p-1 mb-2 border rounded text-sm"
              min="1"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateDuration}
                className="flex-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={!duration || isProcessing}>
                Update
              </button>
              <button
                onClick={resetInputs}
                className="flex-1 px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {user.banned && (
          <DropdownMenuItem 
            onSelect={handleUnban}
            disabled={isProcessing}
            className="text-green-600 dark:text-green-400">
            Remove Ban
            {user.bannedUntil && (
              <span className="ml-2 text-xs text-muted-foreground">
                (until {new Date(user.bannedUntil).toLocaleDateString()})
              </span>
            )}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}