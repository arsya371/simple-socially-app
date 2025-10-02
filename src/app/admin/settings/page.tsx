import WebsiteSettings from "@/components/admin/WebsiteSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website Settings</CardTitle>
          <CardDescription>
            Manage your website&apos;s general settings and configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebsiteSettings />
        </CardContent>
      </Card>
    </div>
  );
}