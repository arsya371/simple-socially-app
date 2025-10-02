import UsersManagement from "@/components/admin/UsersManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
          <CardDescription>
            Manage user roles, permissions, and account status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersManagement />
        </CardContent>
      </Card>
    </div>
  );
}