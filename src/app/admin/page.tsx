import { Metadata } from "next";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import SystemSettings from "@/components/admin/SystemSettings";
import SystemMetrics from "@/components/admin/SystemMetrics";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing users and system settings",
};

export default function AdminDashboard() {
  return (
    <div className="hidden space-y-6 p-6 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage users, roles, and system settings.
        </p>
      </div>
      <Separator className="my-6" />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users Management</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <AdminUsersTable />
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <SystemSettings />
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card className="p-6">
            <SystemMetrics />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}