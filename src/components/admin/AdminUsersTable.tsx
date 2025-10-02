"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      console.log('Response status:', response.status); // Debug log
      
      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      if (!Array.isArray(data.users)) {
        console.error('Unexpected response format:', data);
        throw new Error("Invalid response format");
      }

      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserStatus = async (userId: string, action: 'ACTIVE' | 'SUSPENDED' | 'BANNED', reason: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, action, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user status");
      }

      fetchUsers();

      toast({
        title: "Success",
        description: "User status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status. Please try again.",
      });
    }
  };

  const handleUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      fetchUsers();

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {/* <div className="rounded-md border"> */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!users || users.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          user.status === "ACTIVE" 
                            ? "default" 
                            : user.status === "SUSPENDED" 
                            ? "secondary" 
                            : "destructive"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end items-center gap-2">
                        {user.role !== "ADMIN" && (
                          <>
                            {user.status === "ACTIVE" ? (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      Suspend
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Suspend User</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to suspend <strong>{user.username}</strong>? They will not be able to access their account until reactivated.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <DialogClose asChild>
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleUserStatus(user.id, "SUSPENDED", "Administrative action")
                                          }
                                        >
                                          Suspend
                                        </Button>
                                      </DialogClose>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      Ban
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Ban User</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to permanently ban <strong>{user.username}</strong>? This action is severe and should only be used for serious violations.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <DialogClose asChild>
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleUserStatus(user.id, "BANNED", "Severe violation")
                                          }
                                        >
                                          Ban User
                                        </Button>
                                      </DialogClose>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            ) : user.status === "SUSPENDED" ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="default">
                                    Reactivate
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reactivate User</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to reactivate <strong>{user.username}</strong>? They will regain full access to their account.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                      <Button
                                        onClick={() =>
                                          handleUserStatus(user.id, "ACTIVE", "Suspension lifted")
                                        }
                                      >
                                        Reactivate
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            ) : null}
                            
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleUserRole(user.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="MODERATOR">Moderator</SelectItem>
                                <SelectItem value="DEVELOPER">Developer</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        {/* </div> */}
      </CardContent>
    </Card>
  );
}


// "use client";

// import { useEffect, useState } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button"
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";

// type User = {
//   id: string;
//   username: string;
//   email: string;
//   role: string;
//   status: string;
//   createdAt: string;
// };

// export default function AdminUsersTable() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const { toast } = useToast();

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const response = await fetch("/api/admin/users");
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to fetch users");
//       }

//       setUsers(data.users);
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to load users. Please try again.",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleUserStatus = async (userId: string, action: 'ACTIVE' | 'SUSPENDED' | 'BANNED', reason: string) => {
//     try {
//       const response = await fetch("/api/admin/users", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ userId, action, reason }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to update user status");
//       }

//       fetchUsers();

//       toast({
//         title: "Success",
//         description: "User status updated successfully.",
//       });
//     } catch (error) {
//       console.error("Error updating user status:", error);
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to update user status. Please try again.",
//       });
//     }
//   };

//   const handleUserRole = async (userId: string, newRole: string) => {
//     try {
//       const response = await fetch("/api/admin/users/role", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ userId, role: newRole }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to update user role");
//       }

//       fetchUsers();

//       toast({
//         title: "Success",
//         description: "User role updated successfully.",
//       });
//     } catch (error) {
//       console.error("Error updating user role:", error);
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to update user role. Please try again.",
//       });
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-96">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex justify-between items-center mb-6">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Username</TableHead>
//             <TableHead>Email</TableHead>
//             <TableHead>Role</TableHead>
//             <TableHead>Status</TableHead>
//             <TableHead>Joined</TableHead>
//             <TableHead>Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {users.map((user) => (
//             <TableRow key={user.id}>
//               <TableCell>{user.username}</TableCell>
//               <TableCell>{user.email}</TableCell>
//               <TableCell>
//                 <Badge variant="outline">{user.role}</Badge>
//               </TableCell>
//               <TableCell>
//                 <Badge 
//                   variant={
//                     user.status === "ACTIVE" 
//                       ? "default" 
//                       : user.status === "SUSPENDED" 
//                       ? "secondary" 
//                       : "destructive"
//                   }
//                 >
//                   {user.status}
//                 </Badge>
//               </TableCell>
//               <TableCell>
//                 {new Date(user.createdAt).toLocaleDateString()}
//               </TableCell>
//               <TableCell className="space-x-2">
//                 {user.role !== "ADMIN" && (
//                   <>
//                     {user.status === "ACTIVE" ? (
//                       <>
//                         <Button
//                           size="sm"
//                           variant="destructive"
//                           onClick={() =>
//                             handleUserStatus(user.id, "SUSPENDED", "Administrative action")
//                           }
//                         >
//                           Suspend
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="destructive"
//                           onClick={() =>
//                             handleUserStatus(user.id, "BANNED", "Severe violation")
//                           }
//                         >
//                           Ban
//                         </Button>
//                       </>
//                     ) : user.status === "SUSPENDED" ? (
//                       <Button
//                         size="sm"
//                         variant="default"
//                         onClick={() =>
//                           handleUserStatus(user.id, "ACTIVE", "Suspension lifted")
//                         }
//                       >
//                         Reactivate
//                       </Button>
//                     ) : null}
//                     <select
//                       className="px-2 py-1 rounded border"
//                       value={user.role}
//                       onChange={(e) => handleUserRole(user.id, e.target.value)}
//                     >
//                       <option value="USER">User</option>
//                       <option value="MODERATOR">Moderator</option>
//                       <option value="DEVELOPER">Developer</option>
//                     </select>
//                   </>
//                 )}
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }